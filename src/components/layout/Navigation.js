'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="nav">
      <Link href="/" className="nav-brand">
        <span style={{ fontSize: '1.5rem' }}>🤖</span>
        BenMaorgal
      </Link>
      <div className="nav-links">
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          🎮 Create
        </Link>
        <Link href="/games" className={`nav-link ${pathname === '/games' ? 'active' : ''}`}>
          📦 My Games
        </Link>
        <Link href="/battle" className="nav-link">
          ⚔️ Battle
        </Link>
      </div>
    </nav>
  )
}
