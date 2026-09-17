'use client'

import { useState, useEffect } from 'react'

export default function BudgetCard({ budget, token, onUpdate }) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (budget?.monthlyDollars != null) {
      setValue(budget.monthlyDollars.toFixed(2))
    }
  }, [budget?.monthlyDollars])

  const handleSave = async () => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0.50 || num > 100) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budget: num }),
      })
      if (res.ok) {
        const data = await res.json()
        onUpdate(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // ignore
    }
    setSaving(false)
  }

  const estMax = budget?.estimatedMaxRequests ?? '~333'
  const avgCost = budget?.averageCostPerRequest
    ? `$${budget.averageCostPerRequest.toFixed(4)}`
    : '~$0.015'

  return (
    <div style={sx.card}>
      <h2 style={sx.heading}>💰 Monthly Budget</h2>

      <div style={sx.inputRow}>
        <span style={sx.dollar}>$</span>
        <input
          type="number"
          min="0.50"
          max="100"
          step="0.50"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={sx.input}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...sx.saveBtn,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? '...' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      <div style={sx.info}>
        <span>≈ <strong>{estMax}</strong> requests this month</span>
      </div>
      <div style={sx.info}>
        <span>Average cost per request: <strong>{avgCost}</strong></span>
      </div>
      {!budget && (
        <div style={sx.note}>Default: $5.00/month — change it above.</div>
      )}
    </div>
  )
}

const sx = {
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px 24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  heading: {
    margin: '0 0 16px',
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dollar: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#636e72',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 10,
    border: '2px solid #dfe6e9',
    fontSize: '1.1rem',
    fontWeight: 600,
    outline: 'none',
    maxWidth: 120,
  },
  saveBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: '#6c5ce7',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  info: {
    fontSize: '0.85rem',
    color: '#636e72',
    marginBottom: 4,
  },
  note: {
    fontSize: '0.8rem',
    color: '#b2bec3',
    marginTop: 8,
    fontStyle: 'italic',
  },
}
