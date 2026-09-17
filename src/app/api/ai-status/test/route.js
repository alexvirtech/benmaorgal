import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY
  const model = process.env.ROBOT_MODEL || 'claude-sonnet-4-20250514'
  const checks = {
    hasKey: !!key,
    keyPrefix: key ? key.slice(0, 10) + '...' : null,
    model,
    kvUrl: !!process.env.KV_REST_API_URL,
    kvToken: !!process.env.KV_REST_API_TOKEN,
  }

  if (!key) {
    return NextResponse.json({ ...checks, apiTest: 'SKIP: no key' })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say hi' }],
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ ...checks, apiTest: 'FAIL', status: res.status, error: text.slice(0, 300) })
    }

    const data = await res.json()
    return NextResponse.json({
      ...checks,
      apiTest: 'OK',
      responseModel: data.model,
      usage: data.usage,
    })
  } catch (e) {
    return NextResponse.json({ ...checks, apiTest: 'ERROR', error: e.message })
  }
}
