'use client'

import { useState, useRef, useEffect } from 'react'

export default function RobotChat({ messages, suggestions, onSend, disabled }) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
  }

  const handleChip = (text) => {
    onSend(text)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
        color: '#fff',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '1.4rem' }}>🤖</span>
        Game Robot
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
              {msg.role === 'user' ? '👦' : '🤖'}
            </span>
            <div style={{
              padding: '10px 14px',
              borderRadius: '14px',
              maxWidth: '85%',
              fontSize: '0.95rem',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              background: msg.role === 'user' ? '#6c5ce7' : '#f0f0f5',
              color: msg.role === 'user' ? '#fff' : '#2d3436',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '14px',
              borderBottomLeftRadius: msg.role === 'user' ? '14px' : '4px',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {suggestions && suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleChip(s.text)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid #dfe6e9',
                  background: '#f8f9ff',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: '#6c5ce7',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.target.style.background = '#e8e4ff' }}
                onMouseOut={(e) => { e.target.style.background = '#f8f9ff' }}
              >
                {s.icon} {s.text}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{
        padding: '12px',
        borderTop: '1px solid #eee',
        display: 'flex',
        gap: '8px',
      }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '12px', fontSize: '1.1rem', opacity: 0.4 }}>🎤</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            placeholder="Tell me what to change..."
            disabled={disabled}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: '24px',
              border: '2px solid #dfe6e9',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#6c5ce7' }}
            onBlur={(e) => { e.target.style.borderColor = '#dfe6e9' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: input.trim() ? '#6c5ce7' : '#dfe6e9',
            color: '#fff',
            fontSize: '1.2rem',
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}
