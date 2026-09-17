import { NextResponse } from 'next/server'
import { aiEnabled, isBudgetExhausted } from '@/ai/state'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const enabled = await aiEnabled()
  const budgetExhausted = enabled ? await isBudgetExhausted().catch(() => false) : false
  return NextResponse.json({ enabled, budgetExhausted })
}
