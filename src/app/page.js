'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { interpretPrompt } from '@/game-interpreter/LocalGameInterpreter'
import { createGame } from '@/repositories/localGameRepository'
import { getAllTemplates } from '@/game-templates/index'

function useSpeechRecognition(lang, onResult) {
  const recognitionRef = useRef(null)
  const [listening, setListening] = useState(false)

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      onResult(text)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [lang, onResult])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  return { listening, start, stop }
}

async function translateHebrewToEnglish(text) {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) return text
    const data = await res.json()
    return data.translated || text
  } catch {
    return text
  }
}

export default function HomePage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [translating, setTranslating] = useState(false)
  const templates = getAllTemplates()

  const hasSpeech = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  const handleEnglishResult = useCallback((text) => {
    setInput(prev => prev ? prev + ' ' + text : text)
  }, [])

  const handleHebrewResult = useCallback(async (text) => {
    setTranslating(true)
    const translated = await translateHebrewToEnglish(text)
    setInput(prev => prev ? prev + ' ' + translated : translated)
    setTranslating(false)
  }, [])

  const enSpeech = useSpeechRecognition('en-US', handleEnglishResult)
  const heSpeech = useSpeechRecognition('he-IL', handleHebrewResult)

  const handleCreate = async (prompt) => {
    if (creating) return
    let text = prompt || input
    if (/[֐-׿]/.test(text)) {
      setTranslating(true)
      text = await translateHebrewToEnglish(text)
      setTranslating(false)
    }
    setCreating(true)

    const result = interpretPrompt(text)
    if (result.intent === 'CREATE_GAME' && result.definition) {
      const game = createGame(result.definition, [
        { id: 1, role: 'user', text, timestamp: Date.now() },
        { id: 2, role: 'robot', text: result.robotMessage, timestamp: Date.now() },
      ])
      router.push(`/games/${game.id}`)
    } else {
      setCreating(false)
    }
  }

  const handleQuickStart = (template) => {
    setCreating(true)
    const result = interpretPrompt(template.examplePrompt)
    if (result.intent === 'CREATE_GAME' && result.definition) {
      const game = createGame(result.definition, [
        { id: 1, role: 'robot', text: `Let's make a ${template.name} game! ${template.icon}`, timestamp: Date.now() },
        { id: 2, role: 'robot', text: result.robotMessage, timestamp: Date.now() },
      ])
      router.push(`/games/${game.id}`)
    } else {
      setCreating(false)
    }
  }

  return (
    <>
      <Navigation />
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'linear-gradient(180deg, #f0eeff 0%, #f8f9ff 40%)',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(24px, 5vw, 48px) clamp(12px, 3vw, 24px)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', marginBottom: '16px', animation: 'bounce 2s ease infinite' }}>
            🤖🎮
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6c5ce7, #00cec9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
          }}>
            BUILD YOUR OWN GAME!
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#636e72',
            marginBottom: '32px',
            maxWidth: '500px',
            margin: '0 auto 32px',
          }}>
            Tell me what you want to play. I&apos;ll help you make it!
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '600px',
            margin: '0 auto 48px',
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) handleCreate() }}
              placeholder="Make a cat catch stars..."
              disabled={translating}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '16px',
                border: '2px solid #dfe6e9',
                fontSize: '1.1rem',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c5ce7'
                e.target.style.boxShadow = '0 0 0 4px rgba(108,92,231,0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dfe6e9'
                e.target.style.boxShadow = 'none'
              }}
            />

            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {hasSpeech && (
                <>
                  <button
                    onClick={() => enSpeech.listening ? enSpeech.stop() : enSpeech.start()}
                    disabled={creating || heSpeech.listening || translating}
                    title="English voice input"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: 'none',
                      background: enSpeech.listening ? '#ff4444' : '#f0f0f5',
                      color: enSpeech.listening ? '#fff' : '#666',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      animation: enSpeech.listening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    🎤
                  </button>

                  <button
                    onClick={() => heSpeech.listening ? heSpeech.stop() : heSpeech.start()}
                    disabled={creating || enSpeech.listening || translating}
                    title="Hebrew voice input (translates to English)"
                    style={{
                      height: '44px',
                      borderRadius: '22px',
                      border: 'none',
                      padding: '0 14px',
                      background: heSpeech.listening ? '#ff4444' : (translating ? '#ffd700' : '#f0f0f5'),
                      color: heSpeech.listening ? '#fff' : '#666',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                      animation: heSpeech.listening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    🎤 🇮🇱
                    {translating && <span style={{ fontSize: '0.75rem' }}>...</span>}
                  </button>
                </>
              )}

              <button
                className="btn btn-primary btn-lg"
                onClick={() => handleCreate()}
                disabled={!input.trim() || creating || translating}
              >
                {creating ? '🤖✨ Building...' : '✨ Create'}
              </button>
            </div>
          </div>

          <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: 600, marginBottom: '20px', color: '#2d3436' }}>
            Or pick a game to start:
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '10px',
            maxWidth: '700px',
            margin: '0 auto 48px',
          }}>
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleQuickStart(t)}
                disabled={creating}
                className="card"
                style={{
                  padding: 'clamp(10px, 2vw, 16px) clamp(6px, 1.5vw, 12px)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: '#fff',
                }}
              >
                <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '4px' }}>{t.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 'clamp(0.75rem, 2vw, 0.95rem)' }}>{t.name}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-accent btn-lg"
              onClick={() => router.push('/games')}
            >
              🎮 My Games
            </button>
          </div>

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
            <p style={{ color: '#b2bec3', marginBottom: '8px' }}>Already using Ben&apos;s Brawl Apps?</p>
            <a href="/battle" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              ⚔️ Open Battle Apps
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
