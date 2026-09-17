const PRICING = {
  'claude-sonnet-4-20250514': {
    input: 3.00,
    output: 15.00,
    cacheRead: 0.30,
    cacheWrite: 3.75,
  },
  'claude-haiku-4-5-20251001': {
    input: 0.80,
    output: 4.00,
    cacheRead: 0.08,
    cacheWrite: 1.00,
  },
}

const DEFAULT_PRICING = PRICING['claude-sonnet-4-20250514']

export function estimateCost(usage, model) {
  const p = PRICING[model] || DEFAULT_PRICING
  const input = ((usage.inputTokens || 0) / 1_000_000) * p.input
  const output = ((usage.outputTokens || 0) / 1_000_000) * p.output
  const cacheRead = ((usage.cacheReadTokens || 0) / 1_000_000) * p.cacheRead
  return input + output + cacheRead
}

export function estimateCostCents(usage, model) {
  return Math.round(estimateCost(usage, model) * 100)
}
