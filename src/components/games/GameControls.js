'use client'

import { useLang } from '@/i18n'

export default function GameControls({ gameState, onPlay, onPause, onRestart, onUndo, canUndo, soundOn, onSoundToggle }) {
  const { t } = useLang()
  const status = gameState?.status || 'ready'
  const isPlaying = status === 'playing'
  const isPaused = status === 'paused'
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
          ⏸ {t('controls.pause')}
        </button>
      ) : isPaused ? (
        <button className="btn btn-accent btn-sm" onClick={onPlay}>
          ▶ {t('controls.continue')}
        </button>
      ) : (
        <button className="btn btn-primary btn-sm" onClick={onPlay}>
          {isOver ? `🔄 ${t('controls.restart')}` : `▶ ${t('controls.play')}`}
        </button>
      )}

      <button className="btn btn-secondary btn-sm" onClick={onRestart}>
        🔄 {t('controls.restart')}
      </button>

      {canUndo && (
        <button className="btn btn-secondary btn-sm" onClick={onUndo}>
          ↩ {t('controls.undo')}
        </button>
      )}

      <button
        className="btn btn-secondary btn-sm"
        onClick={onSoundToggle}
        title={soundOn ? t('controls.soundOff') : t('controls.soundOn')}
        style={{ fontSize: '1rem', padding: '4px 10px' }}
      >
        {soundOn ? '🔊' : '🔇'}
      </button>

      {gameState && (
        <div style={{
          marginInlineStart: 'auto',
          display: 'flex',
          gap: '16px',
          fontSize: '0.9rem',
          color: '#636e72',
        }}>
          <span>{t('game.score')}: <strong>{gameState.score}</strong></span>
          {gameState.lives < 99 && <span>{t('game.lives')}: <strong>{'❤️'.repeat(Math.min(gameState.lives, 10))}</strong></span>}
        </div>
      )}
    </div>
  )
}
