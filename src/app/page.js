'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { interpretPrompt } from '@/game-interpreter/LocalGameInterpreter'
import { createGame } from '@/repositories/localGameRepository'
import { getAllTemplates } from '@/game-templates/index'

export default function HomePage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [creating, setCreating] = useState(false)
  const templates = getAllTemplates()

  const handleCreate = (prompt) => {
    if (creating) return
    setCreating(true)

    const result = interpretPrompt(prompt || input)
    if (result.intent === 'CREATE_GAME' && result.definition) {
      const game = createGame(result.definition, [
        { id: 1, role: 'user', text: prompt || input, timestamp: Date.now() },
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
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'bounce 2s ease infinite' }}>
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
            fontSize: '1.2rem',
            color: '#636e72',
            marginBottom: '32px',
            maxWidth: '500px',
            margin: '0 auto 32px',
          }}>
            Tell me what you want to play. I&apos;ll help you make it!
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            maxWidth: '600px',
            margin: '0 auto 48px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) handleCreate() }}
                placeholder="Make a cat catch stars..."
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
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => handleCreate()}
              disabled={!input.trim() || creating}
            >
              {creating ? '🤖✨ Building...' : '✨ Create'}
            </button>
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '20px', color: '#2d3436' }}>
            Or pick a game to start:
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
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
                  padding: '16px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: '#fff',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{t.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.name}</div>
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
            <a href="/battle" className="btn btn-secondary btn-sm">
              ⚔️ Open Battle Apps
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
