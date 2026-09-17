'use client'

import { useState } from 'react'
import { useAiStatus } from './AiStatusProvider'

export default function AiToggle() {
  const { aiEnabled, budgetExhausted, toggleAi } = useAiStatus()
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    if (busy || budgetExhausted) return
    setBusy(true)
    await toggleAi()
    setBusy(false)
  }

  const pillColor = !aiEnabled
    ? '#636e72'
    : budgetExhausted
      ? '#e17055'
      : '#00b894'

  const dotPos = aiEnabled ? 'translateX(18px)' : 'translateX(0)'

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={handleClick}
        disabled={busy}
        aria-label={aiEnabled ? 'Turn AI off' : 'Turn AI on'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: busy ? 'wait' : 'pointer',
          padding: '4px 0',
          opacity: busy ? 0.6 : 1,
        }}
      >
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: aiEnabled ? '#fff' : 'rgba(255,255,255,0.5)',
          letterSpacing: '0.5px',
        }}>
          AI
        </span>
        <div style={{
          width: 36,
          height: 18,
          borderRadius: 10,
          background: pillColor,
          position: 'relative',
          transition: 'background 0.3s',
          boxShadow: aiEnabled && !budgetExhausted
            ? `0 0 8px ${pillColor}80`
            : 'none',
        }}>
          <div style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: 2,
            transform: dotPos,
            transition: 'transform 0.3s',
          }} />
        </div>
      </button>

      {aiEnabled && !budgetExhausted && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#00b894',
          animation: 'ai-pulse 2s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}

      <style>{`
        @keyframes ai-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
