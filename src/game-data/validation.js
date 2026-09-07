import { TEMPLATES, BACKGROUNDS, SPRITES } from './schema.js'

export function validateGameDefinition(def) {
  const errors = []
  const safe = { ...def }

  if (!def.template || !TEMPLATES.includes(def.template)) {
    errors.push(`Unknown template: ${def.template}`)
    safe.template = 'catch'
  }

  if (!def.title || typeof def.title !== 'string') {
    safe.title = 'My Game'
  } else if (def.title.length > 50) {
    safe.title = def.title.slice(0, 50)
  }

  if (!safe.theme) safe.theme = {}
  if (safe.theme.background && !BACKGROUNDS.includes(safe.theme.background)) {
    safe.theme.background = 'sky'
  }

  if (!safe.player) safe.player = {}
  safe.player.speed = clamp(safe.player.speed ?? 5, 1, 15)
  safe.player.size = clamp(safe.player.size ?? 50, 20, 100)

  if (!safe.rules) safe.rules = {}
  safe.rules.startingLives = clamp(safe.rules.startingLives ?? 3, 1, 20)
  safe.rules.targetScore = clamp(safe.rules.targetScore ?? 20, 1, 999)

  if (!Array.isArray(safe.objects)) safe.objects = []
  safe.objects = safe.objects.map(validateObject).filter(Boolean)

  return { valid: errors.length === 0, errors, definition: safe }
}

function validateObject(obj) {
  if (!obj || typeof obj !== 'object') return null
  return {
    ...obj,
    id: obj.id || `obj_${Math.random().toString(36).slice(2, 8)}`,
    role: ['collectible', 'hazard', 'enemy', 'obstacle', 'decoration'].includes(obj.role) ? obj.role : 'obstacle',
    type: obj.type || 'star',
    speed: clamp(obj.speed ?? 3, 0.5, 15),
    spawnRate: clamp(obj.spawnRate ?? 1200, 200, 10000),
    points: clamp(obj.points ?? 1, 0, 100),
    effect: obj.effect || null,
  }
}

function clamp(val, min, max) {
  if (typeof val !== 'number' || isNaN(val)) return min
  return Math.max(min, Math.min(max, val))
}
