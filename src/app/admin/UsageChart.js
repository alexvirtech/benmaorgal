'use client'

export default function UsageChart({ daily, daysInMonth, percentUsed }) {
  if (!daily || !daysInMonth) return null

  const today = new Date().getDate()
  const entries = []
  let maxCount = 1

  for (let d = 1; d <= daysInMonth; d++) {
    const count = daily[d] || 0
    if (count > maxCount) maxCount = count
    entries.push({ day: d, count })
  }

  const W = 520
  const H = 140
  const PAD_LEFT = 30
  const PAD_BOTTOM = 22
  const PAD_TOP = 10
  const chartW = W - PAD_LEFT - 8
  const chartH = H - PAD_BOTTOM - PAD_TOP
  const barW = Math.max(2, (chartW / daysInMonth) - 2)
  const gap = (chartW - barW * daysInMonth) / (daysInMonth - 1 || 1)

  function barColor(day) {
    if (day === today) return '#6c5ce7'
    if (percentUsed >= 80) return '#d63031'
    if (percentUsed >= 50) return '#fdcb6e'
    return '#00b894'
  }

  const yTicks = []
  const tickCount = 4
  for (let i = 0; i <= tickCount; i++) {
    const val = Math.round((maxCount / tickCount) * i)
    const y = PAD_TOP + chartH - (chartH * (val / maxCount))
    yTicks.push({ val, y })
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block' }}
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD_LEFT}
              y1={t.y}
              x2={W - 8}
              y2={t.y}
              stroke="#f0f0f5"
              strokeWidth={1}
            />
            <text
              x={PAD_LEFT - 4}
              y={t.y + 3}
              textAnchor="end"
              fontSize={9}
              fill="#b2bec3"
            >
              {t.val}
            </text>
          </g>
        ))}

        {entries.map((e, i) => {
          const x = PAD_LEFT + i * (barW + gap)
          const h = maxCount > 0 ? (e.count / maxCount) * chartH : 0
          const y = PAD_TOP + chartH - h

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 0)}
                rx={Math.min(barW / 2, 3)}
                fill={barColor(e.day)}
                opacity={e.day === today ? 1 : 0.7}
              >
                <title>Day {e.day}: {e.count} requests</title>
              </rect>
              {(e.day === 1 || e.day % 5 === 0 || e.day === daysInMonth) && (
                <text
                  x={x + barW / 2}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#b2bec3"
                >
                  {e.day}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
