// Per-instance ring buffer — lost on cold start. This is a spot check, not an audit log.
const LOG_SIZE = 50
const ring = []

export function logAiCall(entry) {
  ring.push({ ...entry, timestamp: Date.now() })
  if (ring.length > LOG_SIZE) ring.shift()
}

export function getLog() {
  return [...ring]
}
