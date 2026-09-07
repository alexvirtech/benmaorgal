const API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_TIMEOUT = 20_000

class AIError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

async function attempt(body, headers, timeoutMs, signal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new AIError('AI_TIMEOUT', 'Request timed out')
    }
    throw err
  }
}

export async function callClaude({
  system,
  messages,
  tools,
  model,
  maxTokens = 1024,
  temperature = 0,
  signal,
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new AIError('AI_DISABLED', 'No API key configured')

  const resolvedModel = model
    || process.env.ROBOT_MODEL
    || 'claude-sonnet-4-20250514'

  const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  }

  const systemBlocks = Array.isArray(system) ? system : [{ type: 'text', text: system }]
  if (systemBlocks.length > 0 && !systemBlocks[0].cache_control) {
    systemBlocks[0].cache_control = { type: 'ephemeral' }
  }

  const body = {
    model: resolvedModel,
    max_tokens: maxTokens,
    temperature,
    system: systemBlocks,
    messages,
  }

  if (tools && tools.length > 0) {
    body.tools = tools
    body.tool_choice = { type: 'any' }
  }

  const start = Date.now()
  let res = await attempt(body, headers, DEFAULT_TIMEOUT, signal)

  if ((res.status === 429 || res.status >= 500) && res.status < 600) {
    await new Promise(r => setTimeout(r, 2000))
    res = await attempt(body, headers, DEFAULT_TIMEOUT, signal)
  }

  if (res.status === 429) {
    throw new AIError('AI_RATE_LIMIT', 'Rate limited by Anthropic')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new AIError('AI_BAD_OUTPUT', `Anthropic API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const latencyMs = Date.now() - start

  const usage = {
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
    cacheReadTokens: data.usage?.cache_read_input_tokens || 0,
  }

  let json = null
  let text = ''

  for (const block of data.content || []) {
    if (block.type === 'tool_use') {
      json = block.input
    } else if (block.type === 'text') {
      text += block.text
    }
  }

  if (tools && tools.length > 0 && !json) {
    throw new AIError('AI_BAD_OUTPUT', 'Model did not return tool use')
  }

  return { json, text, usage, model: data.model, latencyMs }
}
