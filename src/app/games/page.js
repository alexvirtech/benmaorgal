'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import GameCard from '@/components/games/GameCard'
import { getGames, deleteGame } from '@/repositories/localGameRepository'
import { useLang } from '@/i18n'

export default function MyGamesPage() {
  const router = useRouter()
  const [games, setGames] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const { t } = useLang()

  useEffect(() => {
    setGames(getGames())
    setLoaded(true)
  }, [])

  const handleDelete = (id, title) => {
    setDeleteTarget({ id, title })
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteGame(deleteTarget.id)
      setGames(getGames())
      setDeleteTarget(null)
    }
  }

  if (!loaded) return null

  return (
    <>
      <Navigation />
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>🎮 {t('games.myGames')}</h1>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => router.push('/')}
            style={{ marginInlineStart: 'auto' }}
          >
            + {t('games.createNew')}
          </button>
        </div>

        {games.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: '#636e72',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎮</div>
            <h2 style={{ marginBottom: '8px' }}>{t('games.empty')}</h2>
            <p style={{ marginBottom: '24px' }}>{t('home.subtitle')}</p>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/')}>
              ✨ {t('nav.create')}
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px',
          }}>
            {games.map((game) => (
              <GameCard key={game.id} game={game} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{t('games.deleteConfirm', { title: deleteTarget.title })}</h3>
              <div className="modal-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
                  ✕
                </button>
                <button className="btn btn-danger btn-sm" onClick={confirmDelete}>
                  🗑
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
