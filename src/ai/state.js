import { estimateCostCents } from '@/ai/pricing'

const BASE = process.env.KV_REST_API_URL
const TOK = process.env.KV_REST_API_TOKEN
const FLAG = 'benmaorgal:ai'
const MONTH_TTL = 3888000 // 45 days in seconds
const DEFAULT_BUDGET = parseFloat(process.env.AI_MONTHLY_BUDGET_DEFAULT || '5.00')

let cache = { value: false, at: 0 }
const TTL_MS = 30_000

async function kv(path, method = 'GET', body) {
  const r = await fetch(`${BASE}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOK}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`kv ${r.status}`)
  const json = await r.json()
  return Array.isArray(json) ? json : json.result
}

export async function getAiState() {
  if (Date.now() - cache.at < TTL_MS) return cache.value
  const on = (await kv(`get/${FLAG}`)) === 'on'
  cache = { value: on, at: Date.now() }
  return on
}

export async function setAiState(on) {
  await kv(`set/${FLAG}/${on ? 'on' : 'off'}`, 'POST')
  cache = { value: on, at: Date.now() }
}

export async function bumpGlobalCount() {
  const key = `benmaorgal:calls:${new Date().toISOString().slice(0, 10)}`
  const [count] = await kv('pipeline', 'POST', [['INCR', key], ['EXPIRE', key, 172800]])
  return Number(count?.result ?? count)
}

export async function getGlobalCount() {
  const key = `benmaorgal:calls:${new Date().toISOString().slice(0, 10)}`
  try {
    const val = await kv(`get/${key}`)
    return Number(val || 0)
  } catch {
    return 0
  }
}

export async function aiEnabled() {
  if (!process.env.ANTHROPIC_API_KEY || !BASE || !TOK) return false
  try {
    return await getAiState()
  } catch {
    return false
  }
}

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

export async function bumpMonthlyStats({ mode, usage, model }) {
  const ym = currentYearMonth()
  const dd = new Date().getDate().toString()
  const cost = estimateCostCents(usage, model)
  const pfx = `benmaorgal:month:${ym}`

  const pipeline = [
    ['INCRBY', `${pfx}:requests`, 1],
    ['EXPIRE', `${pfx}:requests`, MONTH_TTL],
    ['INCRBY', `${pfx}:tokens:in`, usage.inputTokens || 0],
    ['EXPIRE', `${pfx}:tokens:in`, MONTH_TTL],
    ['INCRBY', `${pfx}:tokens:out`, usage.outputTokens || 0],
    ['EXPIRE', `${pfx}:tokens:out`, MONTH_TTL],
    ['INCRBY', `${pfx}:tokens:cache`, usage.cacheReadTokens || 0],
    ['EXPIRE', `${pfx}:tokens:cache`, MONTH_TTL],
    ['INCRBY', `${pfx}:cost:est`, cost],
    ['EXPIRE', `${pfx}:cost:est`, MONTH_TTL],
    ['INCRBY', `${pfx}:by-type:${mode || 'modify'}`, 1],
    ['EXPIRE', `${pfx}:by-type:${mode || 'modify'}`, MONTH_TTL],
    ['INCRBY', `${pfx}:daily:${dd}`, 1],
    ['EXPIRE', `${pfx}:daily:${dd}`, MONTH_TTL],
  ]

  await kv('pipeline', 'POST', pipeline)
}

export async function getMonthlyStats(yearMonth) {
  const ym = yearMonth || currentYearMonth()
  const pfx = `benmaorgal:month:${ym}`

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const dailyKeys = []
  for (let d = 1; d <= daysInMonth; d++) {
    dailyKeys.push(['GET', `${pfx}:daily:${d}`])
  }

  const pipeline = [
    ['GET', `${pfx}:requests`],
    ['GET', `${pfx}:tokens:in`],
    ['GET', `${pfx}:tokens:out`],
    ['GET', `${pfx}:tokens:cache`],
    ['GET', `${pfx}:cost:est`],
    ['GET', `${pfx}:by-type:modify`],
    ['GET', `${pfx}:by-type:create`],
    ['GET', `${pfx}:by-type:translate`],
    ...dailyKeys,
  ]

  const results = await kv('pipeline', 'POST', pipeline)
  const val = (i) => Number(results[i]?.result ?? results[i] ?? 0)

  const daily = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const v = val(8 + d - 1)
    if (v > 0) daily[d] = v
  }

  return {
    yearMonth: ym,
    requests: val(0),
    tokensIn: val(1),
    tokensOut: val(2),
    tokensCache: val(3),
    costCents: val(4),
    byType: {
      modify: val(5),
      create: val(6),
      translate: val(7),
    },
    daily,
    daysInMonth,
  }
}

export async function getMonthlyBudget() {
  try {
    const val = await kv('get/benmaorgal:budget:monthly')
    const dollars = parseFloat(val)
    return { budgetDollars: isNaN(dollars) ? DEFAULT_BUDGET : dollars }
  } catch {
    return { budgetDollars: DEFAULT_BUDGET }
  }
}

export async function setMonthlyBudget(dollars) {
  const clamped = Math.max(0.50, Math.min(100.00, parseFloat(dollars) || DEFAULT_BUDGET))
  await kv(`set/benmaorgal:budget:monthly/${clamped.toFixed(2)}`, 'POST')
  return { budgetDollars: clamped }
}

export async function isBudgetExhausted() {
  try {
    const [stats, budget] = await Promise.all([
      getMonthlyStats(),
      getMonthlyBudget(),
    ])
    return (stats.costCents / 100) >= budget.budgetDollars
  } catch {
    return false
  }
}
