'use client'

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatTokens(tokens) {
  if (!tokens) return '—'
  const inp = tokens.inputTokens || 0
  const out = tokens.outputTokens || 0
  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
  return `${fmt(inp)}/${fmt(out)}`
}

export default function RequestLog({ log }) {
  if (!log || log.length === 0) {
    return (
      <div style={sx.card}>
        <h2 style={sx.heading}>📋 Recent AI Calls</h2>
        <p style={sx.empty}>No calls logged yet</p>
      </div>
    )
  }

  const sorted = [...log].reverse()

  return (
    <div style={sx.card}>
      <h2 style={sx.heading}>📋 Recent AI Calls</h2>
      <div style={sx.tableWrap}>
        <table style={sx.table}>
          <thead>
            <tr>
              <th style={sx.th}>Time</th>
              <th style={sx.th}>Hebrew</th>
              <th style={sx.th}>English</th>
              <th style={sx.th}>Type</th>
              <th style={sx.th}>Tier</th>
              <th style={{ ...sx.th, textAlign: 'right' }}>Tokens</th>
              <th style={{ ...sx.th, textAlign: 'right' }}>Latency</th>
              <th style={{ ...sx.th, textAlign: 'right' }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => {
              const isFree = entry.tier !== 'claude'
              const rowBg = i % 2 === 0 ? '#fff' : '#fafbff'
              return (
                <tr key={i} style={{ background: rowBg }}>
                  <td style={sx.td}>{formatTime(entry.timestamp)}</td>
                  <td style={{ ...sx.td, direction: 'rtl', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.hebrewText || '—'}
                  </td>
                  <td style={{ ...sx.td, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.englishText || '—'}
                  </td>
                  <td style={sx.td}>
                    <span style={{
                      ...sx.typeBadge,
                      background: entry.mode === 'create' ? '#00cec920' : entry.mode === 'translate' ? '#fdcb6e30' : '#6c5ce720',
                      color: entry.mode === 'create' ? '#00b5b1' : entry.mode === 'translate' ? '#d4a017' : '#6c5ce7',
                    }}>
                      {entry.mode || '—'}
                    </span>
                  </td>
                  <td style={sx.td}>
                    <span style={{
                      ...sx.tierBadge,
                      background: isFree ? '#00b89420' : '#6c5ce720',
                      color: isFree ? '#00b894' : '#6c5ce7',
                    }}>
                      {entry.tier || '—'}
                    </span>
                  </td>
                  <td style={{ ...sx.td, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {formatTokens(entry.tokens)}
                  </td>
                  <td style={{ ...sx.td, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {entry.latencyMs ? `${(entry.latencyMs / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td style={{ ...sx.td, textAlign: 'right', fontWeight: 600 }}>
                    {isFree
                      ? <span style={{ color: '#00b894' }}>$0</span>
                      : <span style={{ color: '#6c5ce7' }}>${entry.costEstimate?.toFixed(4) || '—'}</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={sx.note}>Recent calls (this server instance only)</p>
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
  empty: {
    color: '#b2bec3',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '20px 0',
  },
  tableWrap: {
    overflowX: 'auto',
    marginBottom: 8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
    minWidth: 600,
  },
  th: {
    textAlign: 'left',
    padding: '8px 6px',
    borderBottom: '2px solid #f0f0f5',
    color: '#b2bec3',
    fontWeight: 600,
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '7px 6px',
    borderBottom: '1px solid #f5f6fa',
    color: '#2d3436',
    whiteSpace: 'nowrap',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: '0.7rem',
    fontWeight: 600,
  },
  tierBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: '0.7rem',
    fontWeight: 600,
  },
  note: {
    fontSize: '0.75rem',
    color: '#b2bec3',
    textAlign: 'center',
    fontStyle: 'italic',
    margin: 0,
  },
}
