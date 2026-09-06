'use client'

import Link from 'next/link'
import { getTemplateMetadata } from '@/game-templates/index'

export default function GameCard({ game, onDelete }) {
  const meta = getTemplateMetadata(game.template)

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '2rem' }}>{meta?.icon || '🎮'}</span>
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{game.title || 'Untitled'}</h3>
          <span style={{ fontSize: '0.85rem', color: '#636e72' }}>
            {meta?.name || game.template}
          </span>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#b2bec3' }}>
        {game.updatedAt ? new Date(game.updatedAt).toLocaleDateString() : ''}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <Link href={`/games/${game.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          ✏️ Edit
        </Link>
        <button
          className="btn btn-danger btn-sm"
          onClick={(e) => { e.preventDefault(); onDelete(game.id, game.title) }}
          style={{ padding: '8px 12px' }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}
