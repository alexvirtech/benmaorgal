'use client'

import UsageChart from './UsageChart'

function gaugeColor(pct) {
  if (pct >= 80) return '#d63031'
  if (pct >= 50) return '#fdcb6e'
  return '#00b894'
}

function formatTokens(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export default function UsageMonitor({ budget, monthly }) {
  if (!budget || !monthly) {
    return (
      <div style={sx.card}>
        <h2 style={sx.heading}>📊 This Month's Usage</h2>
        <p style={sx.empty}>No usage data yet</p>
      </div>
    )
  }

  const pct = budget.percentUsed || 0
  const color = gaugeColor(pct)
  const spent = budget.spentDollars?.toFixed(2) ?? '0.00'
  const total = budget.monthlyDollars?.toFixed(2) ?? '5.00'
  const avgCost = budget.averageCostPerRequest || 0
  const totalRequests = monthly.requests || 0
  const estMax = budget.estimatedMaxRequests || 0

  const modifyCost = monthly.byType?.modify && avgCost
    ? (monthly.byType.modify * avgCost).toFixed(2)
    : '0.00'
  const createCost = monthly.byType?.create && avgCost
    ? (monthly.byType.create * avgCost).toFixed(2)
    : '0.00'
  const translateCost = monthly.byType?.translate && avgCost
    ? (monthly.byType.translate * avgCost * 0.3).toFixed(2)
    : '0.00'

  return (
    <div style={sx.card}>
      <h2 style={sx.heading}>📊 This Month's Usage</h2>

      {budget.budgetExhausted && (
        <div style={sx.warning}>
          ⚠️ Monthly budget reached — AI is paused until next month
        </div>
      )}

      <div style={sx.gaugeWrap}>
        <div style={sx.gaugeLabel}>
          <span>${spent} of ${total}</span>
          <span style={{ fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
        </div>
        <div style={sx.gaugeBg}>
          <div style={{
            ...sx.gaugeFill,
            width: `${Math.min(pct, 100)}%`,
            background: color,
          }} />
        </div>
        <div style={sx.gaugeLabel}>
          <span style={{ fontSize: '0.8rem', color: '#b2bec3' }}>
            {totalRequests} of ~{estMax} requests
          </span>
        </div>
      </div>

      <div style={sx.statsGrid}>
        <StatCard label="Requests" value={totalRequests} />
        <StatCard label="Est. Spend" value={`$${spent}`} />
        <StatCard label="Avg Cost" value={avgCost > 0 ? `$${avgCost.toFixed(4)}` : '—'} />
        <StatCard label="Days Left" value={budget.daysRemaining ?? '—'} />
      </div>

      <div style={{ marginTop: 20 }}>
        <h3 style={sx.subheading}>Daily Requests</h3>
        <UsageChart
          daily={monthly.daily}
          daysInMonth={monthly.daysInMonth || 30}
          percentUsed={pct}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <h3 style={sx.subheading}>Breakdown by Type</h3>
        <table style={sx.table}>
          <thead>
            <tr>
              <th style={sx.th}>Type</th>
              <th style={{ ...sx.th, textAlign: 'right' }}>Requests</th>
              <th style={{ ...sx.th, textAlign: 'right' }}>Tokens (in/out)</th>
              <th style={{ ...sx.th, textAlign: 'right' }}>Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={sx.td}>Game modify</td>
              <td style={{ ...sx.td, textAlign: 'right' }}>{monthly.byType?.modify || 0}</td>
              <td style={{ ...sx.td, textAlign: 'right', color: '#b2bec3' }}>—</td>
              <td style={{ ...sx.td, textAlign: 'right' }}>${modifyCost}</td>
            </tr>
            <tr>
              <td style={sx.td}>Game create</td>
              <td style={{ ...sx.td, textAlign: 'right' }}>{monthly.byType?.create || 0}</td>
              <td style={{ ...sx.td, textAlign: 'right', color: '#b2bec3' }}>—</td>
              <td style={{ ...sx.td, textAlign: 'right' }}>${createCost}</td>
            </tr>
            <tr>
              <td style={sx.td}>Translate</td>
              <td style={{ ...sx.td, textAlign: 'right' }}>{monthly.byType?.translate || 0}</td>
              <td style={{ ...sx.td, textAlign: 'right', color: '#b2bec3' }}>—</td>
              <td style={{ ...sx.td, textAlign: 'right' }}>${translateCost}</td>
            </tr>
            <tr style={{ fontWeight: 700 }}>
              <td style={sx.td}>Total</td>
              <td style={{ ...sx.td, textAlign: 'right' }}>{totalRequests}</td>
              <td style={{ ...sx.td, textAlign: 'right' }}>
                {formatTokens(monthly.tokensIn)} / {formatTokens(monthly.tokensOut)}
              </td>
              <td style={{ ...sx.td, textAlign: 'right' }}>${spent}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={sx.stat}>
      <div style={sx.statValue}>{value}</div>
      <div style={sx.statLabel}>{label}</div>
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
  subheading: {
    margin: '0 0 10px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#636e72',
  },
  empty: {
    color: '#b2bec3',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '20px 0',
  },
  warning: {
    background: '#ffeaa7',
    color: '#e17055',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: 16,
  },
  gaugeWrap: {
    marginBottom: 16,
  },
  gaugeLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: '#636e72',
    marginBottom: 4,
  },
  gaugeBg: {
    height: 12,
    background: '#f0f0f5',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.5s ease',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: 10,
  },
  stat: {
    background: '#f5f6fa',
    borderRadius: 12,
    padding: '12px 10px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#6c5ce7',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#b2bec3',
    marginTop: 2,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
  },
  th: {
    textAlign: 'left',
    padding: '8px 6px',
    borderBottom: '2px solid #f0f0f5',
    color: '#b2bec3',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '8px 6px',
    borderBottom: '1px solid #f5f6fa',
    color: '#2d3436',
  },
}
