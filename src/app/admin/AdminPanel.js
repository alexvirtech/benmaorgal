'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'
import BudgetCard from './BudgetCard'
import UsageMonitor from './UsageMonitor'
import RequestLog from './RequestLog'

export default function AdminPanel({ clientId }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [gsiReady, setGsiReady] = useState(false)
  const btnRef = useRef(null)
  const pollRef = useRef(null)

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
      const d = await res.json()
      setData(d)
      setUser(d.email)
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

  useEffect(() => {
    if (!token) return

    const poll = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus(token)
      }
    }

    pollRef.current = setInterval(poll, 30_000)
    document.addEventListener('visibilitychange', poll)

    return () => {
      clearInterval(pollRef.current)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [token, fetchStatus])

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
        body: JSON.stringify({ enabled: !(data?.enabled) }),
      })
      if (res.ok) {
        const d = await res.json()
        setData(d)
        try {
          new BroadcastChannel('benmaorgal-ai').postMessage({ enabled: d.enabled })
        } catch {
          // BroadcastChannel not supported
        }
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

  const handleDataUpdate = (d) => {
    setData(d)
  }

  const signOut = () => {
    if (window.google) window.google.accounts.id.disableAutoSelect()
    setUser(null)
    setToken(null)
    setData(null)
    setError(null)
  }

  const aiOn = data?.enabled
  const kvOk = data?.kv !== false

  if (!clientId) {
    return (
      <div style={sx.wrap}>
        <div style={sx.container}>
          <div style={sx.card}>
            <h1 style={sx.title}>Admin</h1>
            <p style={sx.err}>GOOGLE_CLIENT_ID not configured</p>
          </div>
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
        <div style={sx.container}>
          <div style={sx.card}>
            <h1 style={sx.title}>🤖 Admin — BenMaorGal</h1>

            {!user && !error && (
              <div style={sx.center}>
                <p style={sx.hint}>Sign in with Google to manage AI</p>
                <div ref={btnRef} style={sx.center} />
              </div>
            )}

            {error && <p style={sx.err}>{error}</p>}

            {user && (
              <div style={sx.panel}>
                <div style={sx.headerRow}>
                  <p style={sx.email}>{user}</p>
                  <button onClick={signOut} style={sx.outBtn}>Sign out</button>
                </div>

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

                {data?.budget?.budgetExhausted && (
                  <div style={sx.warn}>
                    ⚠️ Monthly budget reached — AI is paused until next month
                  </div>
                )}

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
                  <span style={sx.count}>{data?.calls || 0}</span>
                </div>
              </div>
            )}
          </div>

          {user && data && (
            <>
              <BudgetCard
                budget={data.budget}
                token={token}
                onUpdate={handleDataUpdate}
              />

              <UsageMonitor
                budget={data.budget}
                monthly={data.monthly}
              />

              <RequestLog log={data.log} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

const sx = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    padding: 20,
    direction: 'ltr',
  },
  container: {
    maxWidth: 600,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '28px 32px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    textAlign: 'center',
  },
  title: { margin: '0 0 24px', fontSize: '1.4rem' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  hint: { margin: 0, color: '#636e72', fontSize: '0.95rem' },
  err: { color: '#d63031', fontSize: '0.9rem', margin: '12px 0' },
  warn: { color: '#e17055', fontSize: '0.8rem', margin: 0, background: '#ffeaa7', padding: '8px 12px', borderRadius: 8 },
  panel: { display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
    padding: '6px 14px',
    borderRadius: 8,
    color: '#636e72',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
}
