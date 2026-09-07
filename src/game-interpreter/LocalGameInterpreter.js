import {
  TEMPLATE_PATTERNS,
  PLAYER_TYPES,
  MODIFICATION_PATTERNS,
  extractPlayerFromPrompt,
  extractCollectibleFromPrompt,
  extractThemeFromPrompt,
} from './promptPatterns.js'
import { createGameDefinition, getSprite } from '../game-data/schema.js'
import { applyGameAction } from '../game-data/actions.js'
import { getTemplateMetadata, getDefaultDefinition } from '../game-templates/index.js'

export function interpretPrompt(prompt, currentGame = null) {
  const lower = prompt.toLowerCase().trim()

  if (!lower) {
    return {
      intent: 'UNKNOWN',
      robotMessage: "Hmm... 🤖\n\nI didn't hear anything! Try telling me what game you want to make.",
    }
  }

  if (currentGame) {
    const modResult = tryModification(lower, prompt, currentGame.definition)
    if (modResult) return modResult
  }

  const createResult = tryCreateGame(lower, prompt)
  if (createResult) return createResult

  if (currentGame) {
    return {
      intent: 'UNKNOWN',
      robotMessage: "Hmm... 🤖\n\nI'm not sure how to do that yet.\n\nTry:\n⭐ \"Make me faster\"\n💣 \"Add bombs\"\n🚀 \"Add spaceships\"\n❤️ \"Give me 5 lives\"\n🌌 \"Make the background space\"",
    }
  }

  return {
    intent: 'UNKNOWN',
    robotMessage: "Hmm... 🤖\n\nI'm not sure what game you mean.\n\nTry something like:\n⭐ \"Make a cat catch stars\"\n🚀 \"Make a spaceship shoot aliens\"\n🐍 \"Make a snake game\"",
  }
}

function tryCreateGame(lower, prompt) {
  const isCreate = /^(?:make|create|build|start|new|i want)\b/i.test(lower) || !lower.includes(' ')

  let bestTemplate = null
  let bestScore = 0

  for (const tp of TEMPLATE_PATTERNS) {
    let score = 0
    for (const kw of tp.keywords) {
      if (lower.includes(kw)) {
        score += kw.split(' ').length
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestTemplate = tp
    }
  }

  if (!bestTemplate || (bestScore === 0 && !isCreate)) return null
  if (bestScore === 0) return null

  const templateId = bestTemplate.template
  const meta = getTemplateMetadata(templateId)
  const baseDef = getDefaultDefinition(templateId)

  const playerType = extractPlayerFromPrompt(prompt)
  if (playerType && PLAYER_TYPES[playerType]) {
    baseDef.player.type = playerType
    const theme = PLAYER_TYPES[playerType].themes?.[0]
    if (theme) baseDef.theme.background = theme
  }

  const collectible = extractCollectibleFromPrompt(prompt)
  if (collectible && baseDef.objects) {
    const collectibles = baseDef.objects.filter(o => o.role === 'collectible')
    if (collectibles.length > 0) {
      collectibles[0].type = collectible.type
    }
  }

  const bgTheme = extractThemeFromPrompt(prompt)
  if (bgTheme) baseDef.theme.background = bgTheme

  const playerSprite = getSprite(baseDef.player.type)
  const title = generateTitle(baseDef)
  baseDef.title = title

  return {
    intent: 'CREATE_GAME',
    template: templateId,
    title,
    definition: baseDef,
    robotMessage: `Great idea! ${meta?.icon || '🎮'}\n\nI made "${title}" for you! ${playerSprite}\n\nPress ▶ Play to try it!`,
    suggestions: meta?.suggestions || [],
  }
}

function tryModification(lower, prompt, currentDef) {
  for (const pattern of MODIFICATION_PATTERNS) {
    const match = lower.match(pattern.match)
    if (!match) continue

    const actionTemplate = pattern.action(match)
    let action = { ...actionTemplate }

    if (action.delta !== undefined && action.value === null) {
      const parts = action.path.split('.')
      let current = currentDef
      for (const p of parts) current = current?.[p]
      action.value = (current || 0) + action.delta
      delete action.delta
    }

    const result = applyGameAction(currentDef, action)
    if (!result.success) {
      return {
        intent: 'ERROR',
        robotMessage: `Oops! 🤖🔧 Something went wrong: ${result.error}`,
      }
    }

    const desc = typeof pattern.description === 'function'
      ? pattern.description(match)
      : pattern.description

    return {
      intent: 'MODIFY_GAME',
      actions: [action],
      definition: result.definition,
      robotMessage: `Done! ${desc}`,
    }
  }

  return null
}

function generateTitle(def) {
  const playerNames = {
    cat: 'Cat', dog: 'Dog', frog: 'Frog', robot: 'Robot',
    spaceship: 'Space', car: 'Car', hero: 'Hero', alien: 'Alien',
    bird: 'Bird', fish: 'Fish',
  }
  const templateNames = {
    catch: 'Catcher', dodge: 'Dodger', jumper: 'Jumper',
    shooter: 'Shooter', pong: 'Pong', breakout: 'Breaker',
    snake: 'Snake', memory: 'Memory', clicker: 'Clicker', racer: 'Racer',
  }
  const player = playerNames[def.player?.type] || 'Super'
  const template = templateNames[def.template] || 'Game'
  return `${player} ${template}`
}
