import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { setAiState } from '@/ai/state'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeEqual(a, b) {
  const x = Buffer.from(a || '')
  const y = Buffer.from(b || '')
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  if (!process.env.ADMIN_KEY || !safeEqual(searchParams.get('key'), process.env.ADMIN_KEY)) {
    return new NextResponse('Not found', { status: 404 })
  }
  await setAiState(searchParams.get('on') === '1')
  const res = NextResponse.redirect(`${origin}/`)
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}
