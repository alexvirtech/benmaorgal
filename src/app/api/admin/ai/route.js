import { NextResponse } from 'next/server'
import { getAiState, setAiState, getGlobalCount } from '@/ai/state'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

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
  const enabled = await getAiState()
  const calls = await getGlobalCount()
  return NextResponse.json({ enabled, calls, email: info.email })
}

export async function POST(req) {
  const info = await authorize(req)
  if (!info) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json()
  await setAiState(!!body.enabled)
  const enabled = await getAiState()
  const calls = await getGlobalCount()
  return NextResponse.json({ enabled, calls, email: info.email })
}
