'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLang } from '@/i18n'

function useSpeechRecognition(lang, onResult) {
  const recognitionRef = useRef(null)
  const [listening, setListening] = useState(false)
  const [denied, setDenied] = useState(false)

  const start = useCallback(() => {
    const SR = typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
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
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') setDenied(true)
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [lang, onResult])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  return { listening, start, stop, denied }
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

export default function VoicePrompt({ placeholder, busy, onSubmit, suggestions }) {
  const { t, lang } = useLang()
  const [input, setInput] = useState('')
  const [hebrewTranscript, setHebrewTranscript] = useState(null)
  const [translating, setTranslating] = useState(false)
  const [hasSpeech, setHasSpeech] = useState(false)

  useEffect(() => {
    setHasSpeech(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  const handleHebrewResult = useCallback(async (text) => {
    setHebrewTranscript(text)
    setTranslating(true)
    const translated = await translateHebrewToEnglish(text)
    setInput(translated)
    setTranslating(false)
  }, [])

  const handleEnglishResult = useCallback((text) => {
    setInput(prev => prev ? prev + ' ' + text : text)
  }, [])

  const heSpeech = useSpeechRecognition('he-IL', handleHebrewResult)
  const enSpeech = useSpeechRecognition('en-US', handleEnglishResult)

  const handleSubmit = useCallback(() => {
    const text = input.trim()
    if (!text || busy || translating) return
    onSubmit(text, hebrewTranscript)
    setInput('')
    setHebrewTranscript(null)
  }, [input, busy, translating, onSubmit, hebrewTranscript])

  const handleChip = useCallback((en, he) => {
    if (busy) return
    onSubmit(en, he)
  }, [busy, onSubmit])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const toggleHeMic = () => {
    if (heSpeech.listening) heSpeech.stop()
    else {
      enSpeech.stop()
      heSpeech.start()
    }
  }

  const toggleEnMic = () => {
    if (enSpeech.listening) enSpeech.stop()
    else {
      heSpeech.stop()
      enSpeech.start()
    }
  }

  const anyListening = heSpeech.listening || enSpeech.listening
  const disabled = busy || translating

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 16px' }}>
      {hebrewTranscript && (
        <div style={{
          direction: 'rtl',
          background: '#f0f0f5',
          borderRadius: '12px',
          padding: '8px 14px',
          fontSize: '0.85rem',
          color: '#636e72',
        }}>
          <span style={{ fontWeight: 600, color: '#6c5ce7' }}>{t('voice.youSaid')}</span>{' '}
          <span style={{ color: '#2d3436' }}>{hebrewTranscript}</span>
        </div>
      )}

      {heSpeech.denied && (
        <div style={{
          direction: 'rtl',
          background: '#fff3cd',
          borderRadius: '10px',
          padding: '8px 12px',
          fontSize: '0.85rem',
          color: '#856404',
        }}>
          לא קיבלתי הרשאה למיקרופון. אפשר לכתוב במקום.
        </div>
      )}

      {translating && (
        <div style={{
          textAlign: 'center',
          color: '#6c5ce7',
          fontSize: '0.9rem',
          fontWeight: 600,
          padding: '4px',
        }}>
          {t('voice.translating')}
        </div>
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t('chat.placeholder')}
        disabled={disabled}
        dir="rtl"
        rows={2}
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

      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {hasSpeech && (
          <>
            <button
              onClick={toggleHeMic}
              disabled={disabled}
              title={t('home.micHint')}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: 'none',
                background: heSpeech.listening
                  ? '#ff4444'
                  : 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                transition: 'all 0.2s',
                animation: heSpeech.listening ? 'voicePulse 1.2s ease-in-out infinite' : 'none',
                flexShrink: 0,
                opacity: disabled ? 0.5 : 1,
                boxShadow: heSpeech.listening
                  ? '0 0 20px rgba(255,68,68,0.4)'
                  : '0 4px 15px rgba(108,92,231,0.3)',
              }}
            >
              🎤
              <span style={{ fontSize: '0.5rem', fontWeight: 700 }}>
                {heSpeech.listening ? t('voice.listening') : 'עברית'}
              </span>
            </button>

            <button
              onClick={toggleEnMic}
              disabled={disabled}
              title="English voice input"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: enSpeech.listening ? '#ff4444' : '#f0f0f5',
                color: enSpeech.listening ? '#fff' : '#666',
                fontSize: '1rem',
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                animation: enSpeech.listening ? 'voicePulse 1.2s ease-in-out infinite' : 'none',
                flexShrink: 0,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              🎤<span style={{ fontSize: '0.55rem' }}>EN</span>
            </button>
          </>
        )}

        {!hasSpeech && (
          <div style={{
            direction: 'rtl',
            fontSize: '0.8rem',
            color: '#636e72',
            padding: '4px 8px',
          }}>
            {t('voice.unsupported')}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          style={{
            height: '44px',
            padding: '0 22px',
            borderRadius: '22px',
            border: 'none',
            background: input.trim() && !disabled ? '#6c5ce7' : '#dfe6e9',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: input.trim() && !disabled ? 'pointer' : 'default',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {lang === 'he' ? 'שלח ➤' : 'Send ➤'}
        </button>
      </div>

      {anyListening && (
        <div style={{
          textAlign: 'center',
          color: heSpeech.listening ? '#6c5ce7' : '#00b894',
          fontSize: '0.9rem',
          fontWeight: 600,
          animation: 'voiceFade 1.5s ease-in-out infinite',
        }}>
          {t('voice.listening')}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          direction: lang === 'he' ? 'rtl' : 'ltr',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleChip(s.en, s.he)}
              disabled={busy}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid #dfe6e9',
                background: '#f8f9ff',
                cursor: busy ? 'default' : 'pointer',
                fontSize: '0.85rem',
                color: '#6c5ce7',
                transition: 'all 0.2s',
                opacity: busy ? 0.5 : 1,
              }}
              onMouseOver={(e) => { if (!busy) e.target.style.background = '#e8e4ff' }}
              onMouseOut={(e) => { e.target.style.background = '#f8f9ff' }}
            >
              {s.icon} {lang === 'he' ? s.he : s.en}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(108,92,231,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(108,92,231,0); }
        }
        @keyframes voiceFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
