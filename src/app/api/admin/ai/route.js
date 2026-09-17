import { NextResponse } from 'next/server'
import { getAiState, setAiState, getGlobalCount, getMonthlyStats, getMonthlyBudget, setMonthlyBudget } from '@/ai/state'
import { getLog } from '@/ai/log'
import { estimateCost } from '@/ai/pricing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const kvReady = () => !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

async function verifyGoogleToken(idToken) {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.aud !== CLIENT_ID) return null
    if (data.email_verified !== 'true') return null
    if (data.email !== ADMIN_EMAIL) return null
    return data
  } catch {
    return null
  }
}

async function authorize(req) {
  if (!CLIENT_ID || !ADMIN_EMAIL) return null
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyGoogleToken(auth.slice(7))
}

function buildBudgetInfo(stats, budget) {
  const spentDollars = stats.costCents / 100
  const budgetDollars = budget.budgetDollars
  const percentUsed = budgetDollars > 0 ? Math.min(100, (spentDollars / budgetDollars) * 100) : 0
  const avgCost = stats.requests > 0 ? spentDollars / stats.requests : 0.015
  const estimatedMax = avgCost > 0 ? Math.floor(budgetDollars / avgCost) : 0

  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = lastDay - now.getDate()

  return {
    monthlyDollars: budgetDollars,
    spentCents: stats.costCents,
    spentDollars: Math.round(spentDollars * 100) / 100,
    requests: stats.requests,
    estimatedMaxRequests: estimatedMax,
    averageCostPerRequest: Math.round(avgCost * 10000) / 10000,
    budgetExhausted: spentDollars >= budgetDollars,
    percentUsed: Math.round(percentUsed * 10) / 10,
    daysRemaining,
  }
}

function enrichLog(log) {
  return log.map(entry => {
    const costEst = entry.tokens
      ? estimateCost(entry.tokens, entry.model || process.env.ROBOT_MODEL)
      : 0
    return { ...entry, costEstimate: Math.round(costEst * 10000) / 10000 }
  })
}

export async function GET(req) {
  const info = await authorize(req)
  if (!info) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!kvReady()) {
    return NextResponse.json({
      enabled: false, calls: 0, email: info.email, kv: false,
      budget: null, monthly: null, log: [],
    })
  }
  try {
    const [enabled, calls, stats, budget] = await Promise.all([
      getAiState(),
      getGlobalCount(),
      getMonthlyStats().catch(() => ({
        yearMonth: new Date().toISOString().slice(0, 7),
        requests: 0, tokensIn: 0, tokensOut: 0, tokensCache: 0,
        costCents: 0, byType: { modify: 0, create: 0, translate: 0 },
        daily: {}, daysInMonth: 30,
      })),
      getMonthlyBudget(),
    ])

    return NextResponse.json({
      enabled, calls, email: info.email, kv: true,
      budget: buildBudgetInfo(stats, budget),
      monthly: stats,
      log: enrichLog(getLog()),
    })
  } catch {
    return NextResponse.json({
      enabled: false, calls: 0, email: info.email, kv: false,
      budget: null, monthly: null, log: [],
    })
  }
}

export async function POST(req) {
  const info = await authorize(req)
  if (!info) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!kvReady()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 })
  }
  const body = await req.json()

  if (typeof body.enabled === 'boolean') {
    await setAiState(body.enabled)
  }

  if (typeof body.budget === 'number' && body.budget >= 0.50 && body.budget <= 100) {
    await setMonthlyBudget(body.budget)
  }

  const [enabled, calls, stats, budget] = await Promise.all([
    getAiState(),
    getGlobalCount(),
    getMonthlyStats().catch(() => ({
      yearMonth: new Date().toISOString().slice(0, 7),
      requests: 0, tokensIn: 0, tokensOut: 0, tokensCache: 0,
      costCents: 0, byType: { modify: 0, create: 0, translate: 0 },
      daily: {}, daysInMonth: 30,
    })),
    getMonthlyBudget(),
  ])

  return NextResponse.json({
    enabled, calls, email: info.email, kv: true,
    budget: buildBudgetInfo(stats, budget),
    monthly: stats,
    log: enrichLog(getLog()),
  })
}
