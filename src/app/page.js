'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import VoicePrompt from '@/components/voice/VoicePrompt'
import { interpretPrompt } from '@/game-interpreter/LocalGameInterpreter'
import { createGame } from '@/repositories/localGameRepository'
import { getAllTemplates } from '@/game-templates/index'
import { useLang } from '@/i18n'

export default function HomePage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const { t, lang } = useLang()
  const templates = getAllTemplates()

  const handleCreate = useCallback((english, hebrew) => {
    if (creating || !english) return
    setCreating(true)

    const result = interpretPrompt(english)
    if (result.intent === 'CREATE_GAME' && result.definition) {
      const msgs = []
      if (hebrew) {
        msgs.push({ id: 1, role: 'user', text: english, textHe: hebrew, lang: 'he', timestamp: Date.now() })
      } else {
        msgs.push({ id: 1, role: 'user', text: english, lang: 'en', timestamp: Date.now() })
      }
      msgs.push({ id: 2, role: 'robot', text: result.robotMessage, timestamp: Date.now() })
      const game = createGame(result.definition, msgs)
      router.push(`/games/${game.id}`)
    } else {
      setCreating(false)
    }
  }, [creating, router])

  const handleQuickStart = (template) => {
    setCreating(true)
    const result = interpretPrompt(template.examplePrompt)
    if (result.intent === 'CREATE_GAME' && result.definition) {
      const game = createGame(result.definition, [
        { id: 1, role: 'robot', text: `${t('robot.thinking')}`, timestamp: Date.now() },
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
            {t('home.title')}
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#636e72',
            marginBottom: '32px',
            maxWidth: '500px',
            margin: '0 auto 32px',
          }}>
            {t('home.subtitle')}
          </p>

          <div style={{
            maxWidth: '600px',
            margin: '0 auto 48px',
          }}>
            <VoicePrompt
              placeholder={t('chat.placeholder')}
              busy={creating}
              onSubmit={handleCreate}
              suggestions={[]}
              lang={lang}
            />
          </div>

          <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: 600, marginBottom: '20px', color: '#2d3436' }}>
            {t('home.orPick')}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '10px',
            maxWidth: '700px',
            margin: '0 auto 48px',
          }}>
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleQuickStart(tmpl)}
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
                <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '4px' }}>{tmpl.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 'clamp(0.75rem, 2vw, 0.95rem)' }}>{tmpl.name}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-accent btn-lg"
              onClick={() => router.push('/games')}
            >
              🎮 {t('home.myGames')}
            </button>
          </div>

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
            <p style={{ color: '#b2bec3', marginBottom: '8px' }}>{t('home.battleHint')}</p>
            <a href="/battle" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              ⚔️ {t('home.openBattle')}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
