import { NextResponse } from 'next/server'
import { matchHebrew } from '@/ai/phrasebook.he'
import { aiEnabled } from '@/ai/state'
import { callClaude } from '@/ai/claude'
import { TRANSLATE_SYSTEM } from '@/ai/prompts/system.translate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function respond(translated, source) {
  return NextResponse.json({ translated, source })
}

export async function POST(request) {
  try {
    const { text, from = 'he', to = 'en', context } = await request.json()
    if (!text) return respond('', 'passthrough')

    if (from === 'he' && to === 'en') {
      const match = matchHebrew(text)
      if (match?.english) {
        return respond(match.english, 'phrasebook')
      }
    }

    try {
      if (await aiEnabled()) {
        const result = await callClaude({
          system: TRANSLATE_SYSTEM,
          messages: [{ role: 'user', content: text }],
          maxTokens: 200,
          model: process.env.TRANSLATE_MODEL || 'claude-haiku-4-5-20251001',
        })
        if (result.text?.trim()) {
          return respond(result.text.trim(), 'claude')
        }
      }
    } catch {
      // Claude failed, fall through to MyMemory
    }

    const email = process.env.TRANSLATE_CONTACT_EMAIL || ''
    const params = new URLSearchParams({
      q: text,
      langpair: `${from}|${to}`,
    })
    if (email) params.set('de', email)

    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const data = await res.json()
        const translated = data.responseData?.translatedText
        if (translated && translated !== text && translated.toUpperCase() !== text.toUpperCase()) {
          return respond(translated, 'mymemory')
        }
      }
    } catch {
      // MyMemory failed, fall through to passthrough
    }

    return respond(text, 'passthrough')
  } catch {
    return respond('', 'passthrough')
  }
}
