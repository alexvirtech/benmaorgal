import { validateGameDefinition } from './validation.js'
import { DIFFICULTIES } from './schema.js'

export const ACTION_TYPES = [
  'SET_PROPERTY',
  'ADD_OBJECT',
  'REMOVE_OBJECT',
  'CHANGE_THEME',
  'CHANGE_PLAYER',
  'SET_DIFFICULTY',
  'RESET_GAME',
]

export function applyGameAction(definition, action) {
  const def = JSON.parse(JSON.stringify(definition))

  switch (action.type) {
    case 'SET_PROPERTY': {
      const parts = action.path.split('.')
      let target = def
      for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]]) target[parts[i]] = {}
        target = target[parts[i]]
      }
      target[parts[parts.length - 1]] = action.value
      break
    }

    case 'ADD_OBJECT': {
      if (!def.objects) def.objects = []
      const obj = {
        id: action.object.id || `obj_${Math.random().toString(36).slice(2, 8)}`,
        ...action.object,
      }
      def.objects.push(obj)
      break
    }

    case 'REMOVE_OBJECT': {
      if (def.objects) {
        def.objects = def.objects.filter(o =>
          o.type !== action.objectType && o.role !== action.objectType && o.id !== action.objectType
        )
      }
      break
    }

    case 'CHANGE_THEME': {
      def.theme = { ...def.theme, ...action.theme }
      break
    }

    case 'CHANGE_PLAYER': {
      def.player = { ...def.player, ...action.player }
      break
    }

    case 'SET_DIFFICULTY': {
      const diff = DIFFICULTIES[action.difficulty] || DIFFICULTIES.normal
      def.rules.difficulty = action.difficulty
      if (def.objects) {
        def.objects = def.objects.map(o => ({
          ...o,
          speed: (o._baseSpeed || o.speed) * diff.speedMul,
          spawnRate: (o._baseSpawnRate || o.spawnRate) / diff.spawnMul,
          _baseSpeed: o._baseSpeed || o.speed,
          _baseSpawnRate: o._baseSpawnRate || o.spawnRate,
        }))
      }
      break
    }

    case 'RESET_GAME': {
      break
    }

    default:
      return { success: false, error: `Unknown action: ${action.type}`, definition }
  }

  const result = validateGameDefinition(def)
  if (!result.valid) {
    return { success: false, error: result.errors.join(', '), definition }
  }

  return { success: true, definition: result.definition }
}

export function applyActions(definition, actions) {
  let current = definition
  for (const action of actions) {
    const result = applyGameAction(current, action)
    if (!result.success) return result
    current = result.definition
  }
  return { success: true, definition: current }
}

export function describeAction(action) {
  switch (action.type) {
    case 'SET_PROPERTY':
      return `Changed ${action.path} to ${action.value}`
    case 'ADD_OBJECT':
      return `Added ${action.object.type || action.object.role}`
    case 'REMOVE_OBJECT':
      return `Removed ${action.objectType}`
    case 'CHANGE_THEME':
      return `Changed theme`
    case 'CHANGE_PLAYER':
      return `Changed player`
    case 'SET_DIFFICULTY':
      return `Set difficulty to ${action.difficulty}`
    case 'RESET_GAME':
      return `Reset game`
    default:
      return `Unknown action`
  }
}
