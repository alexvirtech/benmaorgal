'use client'

import { useRef, useEffect } from 'react'
import VoicePrompt from '@/components/voice/VoicePrompt'
import RobotBubble from '@/components/robot/RobotBubble'
import { useLang } from '@/i18n'

export default function RobotChat({ messages, suggestions, onSend, disabled }) {
  const messagesEndRef = useRef(null)
  const { t, lang } = useLang()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (english, hebrew) => {
    onSend(english, hebrew)
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
        {t('nav.create')}
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
            {msg.role === 'robot' ? (
              <RobotBubble text={msg.textHe || msg.text} lang={lang} />
            ) : (
              <>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>👦</span>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  maxWidth: '85%',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  background: '#6c5ce7',
                  color: '#fff',
                  borderBottomRightRadius: '4px',
                  borderBottomLeftRadius: '14px',
                }}>
                  {msg.textHe || msg.text}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        borderTop: '1px solid #eee',
      }}>
        <VoicePrompt
          placeholder={t('chat.placeholder')}
          busy={disabled}
          onSubmit={handleSubmit}
          suggestions={suggestions}
          lang={lang}
        />
      </div>
    </div>
  )
}
