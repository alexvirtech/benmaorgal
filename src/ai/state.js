const BASE = process.env.KV_REST_API_URL
const TOK = process.env.KV_REST_API_TOKEN
const FLAG = 'benmaorgal:ai'

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
  return (await r.json()).result
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
