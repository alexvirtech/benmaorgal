'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/i18n'

export default function Navigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, setLang, t } = useLang()

  const toggleLang = () => {
    const next = lang === 'he' ? 'en' : 'he'
    setLang(next)
    document.documentElement.lang = next
    document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr'
  }

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
          🎮 {t('nav.create')}
        </Link>
        <Link href="/games" className={`nav-link ${pathname === '/games' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
          📦 {t('nav.myGames')}
        </Link>
        <a href="/battle" target="_blank" rel="noopener noreferrer" className="nav-link" onClick={() => setMenuOpen(false)}>
          ⚔️ {t('nav.battle')}
        </a>
        <button
          onClick={toggleLang}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '12px',
            padding: '4px 10px',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {lang === 'he' ? 'EN' : 'עב'}
        </button>
      </div>
    </nav>
  )
}
