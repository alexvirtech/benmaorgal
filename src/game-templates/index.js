import { catchTemplate } from './catch.js'
import { dodgeTemplate } from './dodge.js'
import { jumperTemplate } from './jumper.js'
import { shooterTemplate } from './shooter.js'
import { pongTemplate } from './pong.js'
import { breakoutTemplate } from './breakout.js'
import { snakeTemplate } from './snake.js'
import { memoryTemplate } from './memory.js'
import { clickerTemplate } from './clicker.js'
import { racerTemplate } from './racer.js'

const templates = {
  catch: catchTemplate,
  dodge: dodgeTemplate,
  jumper: jumperTemplate,
  shooter: shooterTemplate,
  pong: pongTemplate,
  breakout: breakoutTemplate,
  snake: snakeTemplate,
  memory: memoryTemplate,
  clicker: clickerTemplate,
  racer: racerTemplate,
}

export function getTemplate(id) {
  return templates[id] || null
}

export function getTemplateMetadata(id) {
  const t = templates[id]
  if (!t) return null
  return {
    id: t.id,
    name: t.name,
    icon: t.icon,
    description: t.description,
    examplePrompt: t.examplePrompt,
    suggestions: t.suggestions || [],
  }
}

export function getAllTemplates() {
  return Object.values(templates).map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    description: t.description,
    examplePrompt: t.examplePrompt,
  }))
}

export function getDefaultDefinition(templateId) {
  const t = templates[templateId]
  if (!t) return null
  const def = t.getDefaultDefinition()
  def.id = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return def
}
