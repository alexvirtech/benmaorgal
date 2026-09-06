'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=he|en`
    const res = await fetch(url)
    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    }
    return text
  } catch {
    return text
  }
}

export default function RobotChat({ messages, suggestions, onSend, disabled }) {
  const [input, setInput] = useState('')
  const [translating, setTranslating] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const hasSpeech = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
  }

  const handleChip = (text) => {
    onSend(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
        flexDirection: 'column',
        gap: '8px',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me what to change..."
          disabled={disabled || translating}
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '14px',
            border: '2px solid #dfe6e9',
            fontSize: '0.95rem',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#6c5ce7' }}
          onBlur={(e) => { e.target.style.borderColor = '#dfe6e9' }}
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {hasSpeech && (
            <>
              <button
                onClick={() => enSpeech.listening ? enSpeech.stop() : enSpeech.start()}
                disabled={disabled || heSpeech.listening || translating}
                title="English voice input"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: enSpeech.listening ? '#ff4444' : '#f0f0f5',
                  color: enSpeech.listening ? '#fff' : '#666',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  animation: enSpeech.listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
                  flexShrink: 0,
                }}
              >
                🎤
              </button>

              <button
                onClick={() => heSpeech.listening ? heSpeech.stop() : heSpeech.start()}
                disabled={disabled || enSpeech.listening || translating}
                title="Hebrew voice input (translates to English)"
                style={{
                  height: '40px',
                  borderRadius: '20px',
                  border: 'none',
                  padding: '0 12px',
                  background: heSpeech.listening ? '#ff4444' : (translating ? '#ffd700' : '#f0f0f5'),
                  color: heSpeech.listening ? '#fff' : '#666',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                  animation: heSpeech.listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
                  flexShrink: 0,
                }}
              >
                🎤 🇮🇱
                {translating && <span style={{ fontSize: '0.75rem' }}>...</span>}
              </button>
            </>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={handleSend}
            disabled={disabled || !input.trim() || translating}
            style={{
              height: '40px',
              padding: '0 20px',
              borderRadius: '20px',
              border: 'none',
              background: input.trim() ? '#6c5ce7' : '#dfe6e9',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            Send ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(255,68,68,0); }
        }
      `}</style>
    </div>
  )
}
