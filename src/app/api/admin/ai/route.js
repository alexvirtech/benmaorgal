import { NextResponse } from 'next/server'
import { getAiState, setAiState, getGlobalCount, aiEnabled } from '@/ai/state'

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

export async function GET(req) {
  const info = await authorize(req)
  if (!info) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!kvReady()) {
    return NextResponse.json({ enabled: false, calls: 0, email: info.email, kv: false })
  }
  try {
    const enabled = await getAiState()
    const calls = await getGlobalCount()
    return NextResponse.json({ enabled, calls, email: info.email, kv: true })
  } catch {
    return NextResponse.json({ enabled: false, calls: 0, email: info.email, kv: false })
  }
}

export async function POST(req) {
  const info = await authorize(req)
  if (!info) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!kvReady()) {
    return NextResponse.json({ error: 'KV not configured' }, { status: 503 })
  }
  const body = await req.json()
  await setAiState(!!body.enabled)
  const enabled = await getAiState()
  const calls = await getGlobalCount()
  return NextResponse.json({ enabled, calls, email: info.email, kv: true })
}
