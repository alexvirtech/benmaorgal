'use client'

export default function RobotBubble({ text, source }) {
  const isAiSource = source === 'claude'

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      direction: 'rtl',
    }}>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🤖</span>
      <div style={{
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
        position: 'relative',
      }}>
        {text}
        {isAiSource && (
          <span style={{
            display: 'inline-block',
            marginInlineStart: 6,
            fontSize: '0.7rem',
            opacity: 0.5,
            verticalAlign: 'middle',
          }}>
            🤖✨
          </span>
        )}
      </div>
    </div>
  )
}
