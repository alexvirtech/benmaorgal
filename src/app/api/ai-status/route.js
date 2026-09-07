import { NextResponse } from 'next/server'
import { aiEnabled } from '@/ai/state'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const enabled = await aiEnabled()
  return NextResponse.json({ enabled })
}
