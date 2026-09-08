'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'

export default function AdminPanel({ clientId }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [aiOn, setAiOn] = useState(null)
  const [calls, setCalls] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [gsiReady, setGsiReady] = useState(false)
  const [kvOk, setKvOk] = useState(true)
  const btnRef = useRef(null)

  const fetchStatus = useCallback(async (tok) => {
    try {
      const res = await fetch('/api/admin/ai', {
        headers: { Authorization: `Bearer ${tok}` }
      })
      if (res.status === 403) {
        setError('Access denied — not an authorized admin')
        setToken(null)
        return
      }
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setAiOn(data.enabled)
      setCalls(data.calls)
      setUser(data.email)
      setKvOk(data.kv !== false)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const handleCredential = useCallback((response) => {
    setToken(response.credential)
    fetchStatus(response.credential)
  }, [fetchStatus])

  useEffect(() => {
    if (!gsiReady || !clientId || !btnRef.current || token) return
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    })
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
    })
  }, [gsiReady, clientId, handleCredential, token])

  const toggle = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !aiOn }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiOn(data.enabled)
        setCalls(data.calls)
      } else if (res.status === 503) {
        setError('KV store not configured — cannot toggle')
      } else {
        setError('Toggle failed')
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const signOut = () => {
    if (window.google) window.google.accounts.id.disableAutoSelect()
    setUser(null)
    setToken(null)
    setAiOn(null)
    setCalls(0)
    setError(null)
  }

  if (!clientId) {
    return (
      <div style={sx.wrap}>
        <div style={sx.card}>
          <h1 style={sx.title}>Admin</h1>
          <p style={sx.err}>GOOGLE_CLIENT_ID not configured</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGsiReady(true)}
      />
      <div style={sx.wrap}>
        <div style={sx.card}>
          <h1 style={sx.title}>Admin</h1>

          {!user && !error && (
            <div style={sx.center}>
              <p style={sx.hint}>Sign in with Google to manage AI</p>
              <div ref={btnRef} style={sx.center} />
            </div>
          )}

          {error && <p style={sx.err}>{error}</p>}

          {user && (
            <div style={sx.panel}>
              <p style={sx.email}>{user}</p>

              {!kvOk && (
                <p style={sx.warn}>KV store not configured — set KV_REST_API_URL and KV_REST_API_TOKEN in Vercel</p>
              )}

              <div style={sx.row}>
                <span>AI Mode</span>
                <span style={{
                  ...sx.badge,
                  background: aiOn ? '#00b894' : '#d63031',
                }}>{aiOn ? 'ON' : 'OFF'}</span>
              </div>

              <button
                onClick={toggle}
                disabled={loading}
                style={{
                  ...sx.btn,
                  background: aiOn ? '#d63031' : '#00b894',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '...' : (aiOn ? 'Turn OFF' : 'Turn ON')}
              </button>

              <div style={sx.row}>
                <span>Calls today</span>
                <span style={sx.count}>{calls}</span>
              </div>

              <button onClick={signOut} style={sx.outBtn}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const sx = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    padding: 20,
    direction: 'ltr',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: 40,
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    textAlign: 'center',
  },
  title: { margin: '0 0 24px', fontSize: '1.5rem' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  hint: { margin: 0, color: '#636e72', fontSize: '0.95rem' },
  err: { color: '#d63031', fontSize: '0.9rem', margin: '12px 0' },
  warn: { color: '#e17055', fontSize: '0.8rem', margin: 0, background: '#ffeaa7', padding: '8px 12px', borderRadius: 8 },
  panel: { display: 'flex', flexDirection: 'column', gap: 16 },
  email: { margin: 0, fontSize: '0.85rem', color: '#636e72' },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f5f6fa',
    borderRadius: 12,
    fontWeight: 600,
  },
  badge: {
    color: '#fff',
    padding: '4px 14px',
    borderRadius: 20,
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  btn: {
    border: 'none',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  count: { fontWeight: 700, fontSize: '1.2rem', color: '#6c5ce7' },
  outBtn: {
    background: 'none',
    border: '1px solid #ddd',
    padding: 8,
    borderRadius: 8,
    color: '#636e72',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
}
