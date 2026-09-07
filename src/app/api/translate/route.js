import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { text, from = 'he', to = 'en' } = await request.json()
    if (!text) return NextResponse.json({ translated: '' })

    const params = new URLSearchParams({ q: text, langpair: `${from}|${to}` })
    const res = await fetch(`https://api.mymemory.translated.net/get?${params}`)
    if (!res.ok) return NextResponse.json({ translated: text })

    const data = await res.json()
    const translated = data.responseData?.translatedText
    if (translated && translated !== text) {
      return NextResponse.json({ translated })
    }
    return NextResponse.json({ translated: text })
  } catch {
    return NextResponse.json({ translated: '' }, { status: 500 })
  }
}
