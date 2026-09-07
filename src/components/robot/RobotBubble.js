'use client'

import { useState, useEffect, useRef } from 'react'

function getTtsPreference() {
  try {
    const val = localStorage.getItem('benmaorgal-tts')
    return val !== 'off'
  } catch {
    return true
  }
}

function setTtsPreference(on) {
  try {
    localStorage.setItem('benmaorgal-tts', on ? 'on' : 'off')
  } catch {}
}

function hasHebrew(text) {
  return /[֐-׿]/.test(text)
}

export default function RobotBubble({ text, lang }) {
  const [muted, setMuted] = useState(true)
  const utteranceRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    setMuted(!getTtsPreference())
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (!text || muted) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    if (lang === 'en' && !hasHebrew(text)) return

    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'he-IL'
    utter.rate = 0.95

    const voices = window.speechSynthesis.getVoices()
    const heVoice = voices.find(v => v.lang.startsWith('he'))
    if (heVoice) utter.voice = heVoice

    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [text, muted, lang])

  const toggleMute = () => {
    const newMuted = !muted
    setMuted(newMuted)
    setTtsPreference(!newMuted)
    if (newMuted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      direction: 'rtl',
    }}>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🤖</span>
      <div style={{
        position: 'relative',
        padding: '10px 14px',
        borderRadius: '14px',
        maxWidth: '85%',
        fontSize: '0.95rem',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        background: '#f0f0f5',
        color: '#2d3436',
        borderBottomRightRadius: '14px',
        borderBottomLeftRadius: '4px',
      }}>
        {text}
        <button
          onClick={toggleMute}
          title={muted ? 'הפעל קול' : 'השתק'}
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6,
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '0.6' }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  )
}
