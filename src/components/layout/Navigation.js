'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <span style={{ fontSize: '1.5rem' }}>🤖</span>
        BenMaorGal
      </Link>
      <button
        className="nav-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          🎮 Create
        </Link>
        <Link href="/games" className={`nav-link ${pathname === '/games' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          📦 My Games
        </Link>
        <a href="/battle" target="_blank" rel="noopener noreferrer" className="nav-link" onClick={() => setMenuOpen(false)}>
          ⚔️ Battle
        </a>
      </div>
    </nav>
  )
}
