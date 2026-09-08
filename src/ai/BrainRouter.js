'use client'

import { matchHebrew } from '@/ai/phrasebook.he'
import { interpretPrompt } from '@/game-interpreter/LocalGameInterpreter'
import { interpretPromptAI } from '@/ai/AIGameInterpreter'
import { applyActions } from '@/game-data/actions'

let aiStatusCache = { enabled: false, at: 0 }
const STATUS_TTL = 60_000

async function checkAiEnabled() {
  if (typeof window === 'undefined') return false
  if (Date.now() - aiStatusCache.at < STATUS_TTL) return aiStatusCache.enabled
  try {
    const res = await fetch('/api/ai-status', { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    aiStatusCache = { enabled: data.enabled, at: Date.now() }
    return data.enabled
  } catch {
    return false
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    aiStatusCache.at = 0
  })
}

export async function routePrompt(prompt, currentGame = null, mode = 'modify') {
  if (!prompt || !prompt.trim()) {
    return {
      intent: 'UNKNOWN',
      robotMessage: 'Tell me what to change! 🤖',
      robotMessageHe: 'ספר לי מה לשנות! 🤖',
      suggestions: [],
      source: 'empty',
    }
  }

  const text = prompt.trim()

  const hebrewMatch = matchHebrew(text)
  if (hebrewMatch) {
    if (hebrewMatch.action && currentGame) {
      const result = applyActions(currentGame.definition, [hebrewMatch.action])
      if (result.success) {
        return {
          intent: 'MODIFY_GAME',
          actions: [hebrewMatch.action],
          definition: result.definition,
          robotMessage: hebrewMatch.english,
          robotMessageHe: hebrewMatch.responseHe || 'בוצע! ✨',
          suggestions: [],
          source: 'phrasebook',
        }
      }
    }
    if (hebrewMatch.english) {
      const localResult = interpretPrompt(hebrewMatch.english, currentGame)
      if (localResult.intent !== 'UNKNOWN') {
        return {
          ...localResult,
          robotMessageHe: hebrewMatch.responseHe || localResult.robotMessageHe || 'בוצע! ✨',
          source: 'phrasebook+local',
        }
      }
    }
  }

  const localResult = interpretPrompt(text, currentGame)
  if (localResult.intent !== 'UNKNOWN') {
    return {
      ...localResult,
      robotMessageHe: localResult.robotMessageHe || localResult.robotMessage,
      source: 'local',
    }
  }

  if (text.length > 300) {
    return {
      intent: 'UNKNOWN',
      robotMessage: 'That message is too long! Try something shorter. 🤖',
      robotMessageHe: 'ההודעה ארוכה מדי! נסה משהו קצר יותר 🤖',
      suggestions: [],
      source: 'rejected',
    }
  }

  const aiOn = await checkAiEnabled()
  if (!aiOn) {
    return {
      intent: 'UNKNOWN',
      robotMessage: localResult.robotMessage,
      robotMessageHe: 'אני לא מצליח להתחבר עכשיו, אבל אפשר לנסות פקודות פשוטות',
      suggestions: [],
      source: 'offline',
    }
  }

  const aiResult = await interpretPromptAI(text, currentGame)
  return { ...aiResult, source: aiResult.source || 'claude' }
}
