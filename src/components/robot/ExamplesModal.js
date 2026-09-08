'use client'

import { getExamples } from '@/game-data/examples'

export default function ExamplesModal({ templateId, onSelect, onClose }) {
  const examples = getExamples(templateId)
  if (!examples.length) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '380px',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1.05rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>💡 דוגמאות</span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => { onSelect(ex.en, ex.he); onClose() }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'right',
                direction: 'rtl',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '10px',
                background: i % 2 === 0 ? '#f8f9ff' : '#fff',
                cursor: 'pointer',
                fontSize: '0.95rem',
                color: '#2d3436',
                transition: 'background 0.15s',
                lineHeight: '1.5',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e8e4ff' }}
              onMouseOut={(e) => { e.currentTarget.style.background = i % 2 === 0 ? '#f8f9ff' : '#fff' }}
            >
              {ex.he}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
