'use client'

export default function GameControls({ gameState, onPlay, onPause, onRestart, onUndo, canUndo }) {
  const status = gameState?.status || 'ready'
  const isPlaying = status === 'playing'
  const isOver = status === 'won' || status === 'lost'

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      padding: '12px 16px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {isPlaying ? (
        <button className="btn btn-secondary btn-sm" onClick={onPause}>
          ⏸ Pause
        </button>
      ) : (
        <button className="btn btn-primary btn-sm" onClick={onPlay}>
          {isOver ? '🔄 Play Again' : '▶ Play'}
        </button>
      )}

      <button className="btn btn-secondary btn-sm" onClick={onRestart}>
        🔄 Restart
      </button>

      {canUndo && (
        <button className="btn btn-secondary btn-sm" onClick={onUndo}>
          ↩ Undo
        </button>
      )}

      {gameState && (
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: '16px',
          fontSize: '0.9rem',
          color: '#636e72',
        }}>
          <span>Score: <strong>{gameState.score}</strong></span>
          {gameState.lives < 99 && <span>Lives: <strong>{'❤️'.repeat(Math.min(gameState.lives, 10))}</strong></span>}
        </div>
      )}
    </div>
  )
}
