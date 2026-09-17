import { NextResponse } from 'next/server'
import { aiEnabled, isBudgetExhausted, getAiState, setAiState } from '@/ai/state'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const enabled = await aiEnabled()
  const budgetExhausted = enabled ? await isBudgetExhausted().catch(() => false) : false
  return NextResponse.json({ enabled, budgetExhausted })
}

export async function POST(request) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 })
  }
  try {
    const body = await request.json()
    const newState = typeof body.enabled === 'boolean' ? body.enabled : !(await getAiState())
    await setAiState(newState)
    const budgetExhausted = newState ? await isBudgetExhausted().catch(() => false) : false
    return NextResponse.json({ enabled: newState, budgetExhausted })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
