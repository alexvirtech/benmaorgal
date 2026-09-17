'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AiStatusContext = createContext({
  aiEnabled: false,
  budgetExhausted: false,
  toggleAi: () => {},
  refreshStatus: () => {},
})

const POLL_INTERVAL = 60_000

export function AiStatusProvider({ children }) {
  const [status, setStatus] = useState({ aiEnabled: false, budgetExhausted: false })
  const [toggling, setToggling] = useState(false)
  const channelRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-status', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setStatus(prev => {
        const next = { aiEnabled: data.enabled, budgetExhausted: data.budgetExhausted }
        if (prev.aiEnabled !== next.aiEnabled || prev.budgetExhausted !== next.budgetExhausted) {
          window.dispatchEvent(new CustomEvent('ai-status-changed', { detail: next }))
          return next
        }
        return prev
      })
    } catch {
      // keep current state on error
    }
  }, [])

  const toggleAi = useCallback(async () => {
    if (toggling) return
    setToggling(true)
    try {
      const res = await fetch('/api/ai-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !status.aiEnabled }),
      })
      if (res.ok) {
        const data = await res.json()
        const next = { aiEnabled: data.enabled, budgetExhausted: data.budgetExhausted }
        setStatus(next)
        window.dispatchEvent(new CustomEvent('ai-status-changed', { detail: next }))
        try {
          new BroadcastChannel('benmaorgal-ai').postMessage({ enabled: data.enabled })
        } catch {}
      }
    } catch {}
    setToggling(false)
  }, [toggling, status.aiEnabled])

  useEffect(() => {
    fetchStatus()

    const interval = setInterval(fetchStatus, POLL_INTERVAL)

    const handleFocus = () => fetchStatus()
    window.addEventListener('focus', handleFocus)

    try {
      const ch = new BroadcastChannel('benmaorgal-ai')
      ch.onmessage = (e) => {
        if (typeof e.data?.enabled === 'boolean') {
          setStatus(prev => {
            const next = { ...prev, aiEnabled: e.data.enabled }
            window.dispatchEvent(new CustomEvent('ai-status-changed', { detail: next }))
            return next
          })
        }
      }
      channelRef.current = ch
    } catch {}

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      channelRef.current?.close()
    }
  }, [fetchStatus])

  const value = { ...status, toggleAi, refreshStatus: fetchStatus }

  return (
    <AiStatusContext.Provider value={value}>
      {children}
    </AiStatusContext.Provider>
  )
}

export function useAiStatus() {
  return useContext(AiStatusContext)
}
