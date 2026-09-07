import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getAiState, getGlobalCount } from '@/ai/state'
import { getLog } from '@/ai/log'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeEqual(a, b) {
  const x = Buffer.from(a || '')
  const y = Buffer.from(b || '')
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  if (!process.env.ADMIN_KEY || !safeEqual(searchParams.get('key'), process.env.ADMIN_KEY)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const [enabled, globalCount] = await Promise.all([
    getAiState().catch(() => false),
    getGlobalCount().catch(() => 0),
  ])

  const res = NextResponse.json({
    enabled,
    globalCountToday: globalCount,
    date: new Date().toISOString().slice(0, 10),
    calls: getLog(),
  })
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}
