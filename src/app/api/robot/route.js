import { NextResponse } from 'next/server'
import { aiEnabled, bumpGlobalCount } from '@/ai/state'
import { callClaude } from '@/ai/claude'
import { buildSystemPrompt, getResponseTool, summarizeGame } from '@/ai/prompts/system.games'
import { validateGameDefinition } from '@/game-data/validation'
import { applyActions } from '@/game-data/actions'
import { RANGES } from '@/game-data/catalog'
import { logAiCall } from '@/ai/log'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT || '300', 10)
const DEVICE_LIMIT = parseInt(process.env.AI_DEVICE_DAILY_LIMIT || '100', 10)
const deviceCounts = new Map()

function getDeviceCount(deviceId) {
  const today = new Date().toISOString().slice(0, 10)
  const key = `${deviceId}:${today}`
  return deviceCounts.get(key) || 0
}

function bumpDeviceCount(deviceId) {
  const today = new Date().toISOString().slice(0, 10)
  const key = `${deviceId}:${today}`
  const count = (deviceCounts.get(key) || 0) + 1
  deviceCounts.set(key, count)
  for (const k of deviceCounts.keys()) {
    if (!k.endsWith(today)) deviceCounts.delete(k)
  }
  return count
}

const FALLBACK_SUGGESTIONS = [
  { he: 'תעשה אותי מהר יותר', en: 'make the player faster', icon: '💨' },
  { he: 'תוסיף פצצות', en: 'add bombs', icon: '💣' },
  { he: 'תן לי 5 חיים', en: 'give me 5 lives', icon: '❤️' },
]

function offlineResponse(messageHe, messageEn) {
  return NextResponse.json({
    intent: 'CLARIFY',
    actions: [],
    message: { he: messageHe, en: messageEn },
    suggestions: FALLBACK_SUGGESTIONS,
    meta: { source: 'fallback', latencyMs: 0 },
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { mode, prompt, promptHe, game, deviceId } = body

    if (!prompt || prompt.length > 300) {
      return offlineResponse(
        'לא הבנתי, אפשר לנסות שוב? 🤔',
        "I didn't understand, can you try again?"
      )
    }

    const enabled = await aiEnabled()
    if (!enabled) {
      return offlineResponse(
        'אני לא מצליח להתחבר עכשיו, אבל אפשר לנסות פקודות פשוטות',
        'I cannot connect right now, but you can try simple commands'
      )
    }

    const globalCount = await bumpGlobalCount().catch(() => DAILY_LIMIT + 1)
    if (globalCount > DAILY_LIMIT) {
      return offlineResponse(
        'הרובוט צריך לנוח 😴 ננסה שוב מחר',
        'The robot needs to rest 😴 Try again tomorrow'
      )
    }

    if (deviceId) {
      const deviceCount = bumpDeviceCount(deviceId)
      if (deviceCount > DEVICE_LIMIT) {
        return offlineResponse(
          'הרובוט צריך לנוח 😴 ננסה שוב מחר',
          'The robot needs to rest 😴 Try again tomorrow'
        )
      }
    }

    const gameSummary = game ? summarizeGame(game) : null
    const system = buildSystemPrompt(gameSummary)
    const tool = getResponseTool()

    const userMessage = mode === 'create'
      ? `Create a new game: "${prompt}"`
      : `Modify the current game: "${prompt}"`

    let result
    try {
      result = await callClaude({
        system,
        messages: [{ role: 'user', content: userMessage }],
        tools: [tool],
        model: process.env.ROBOT_MODEL,
      })
    } catch (err) {
      logAiCall({
        hebrewText: promptHe, englishText: prompt, mode,
        tier: 'claude', intent: 'ERROR', latencyMs: 0,
        tokens: null, repaired: false, error: err.code || err.message,
      })
      if (err.code === 'AI_RATE_LIMIT') {
        return offlineResponse(
          'הרובוט צריך לנוח 😴 ננסה שוב מחר',
          'The robot needs to rest 😴 Try again tomorrow'
        )
      }
      return offlineResponse(
        'אופס, משהו לא עבד. אפשר לנסות שוב 🤖',
        'Oops, something went wrong. Try again'
      )
    }

    let aiResponse = result.json
    let repaired = false

    if (!aiResponse || !aiResponse.intent) {
      return offlineResponse(
        'לא הצלחתי להבין, אפשר לנסות שוב? 🤔',
        "I couldn't understand, try again?"
      )
    }

    if (aiResponse.actions?.length > RANGES.maxActionsPerResponse) {
      aiResponse.actions = aiResponse.actions.slice(0, RANGES.maxActionsPerResponse)
    }

    if (aiResponse.intent === 'MODIFY_GAME' && game && aiResponse.actions?.length > 0) {
      const applied = applyActions(game.definition, aiResponse.actions)
      if (!applied.success) {
        try {
          const repairResult = await callClaude({
            system,
            messages: [
              { role: 'user', content: userMessage },
              { role: 'assistant', content: [{ type: 'tool_use', id: 'repair', name: 'game_response', input: aiResponse }] },
              { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'repair', content: `Validation failed: ${applied.error}. Fix your response.` }] },
            ],
            tools: [tool],
            model: process.env.ROBOT_MODEL,
          })
          if (repairResult.json) {
            aiResponse = repairResult.json
            repaired = true
            const reapplied = applyActions(game.definition, aiResponse.actions || [])
            if (!reapplied.success) {
              return offlineResponse(
                'לא הצלחתי לעשות את זה, אפשר לנסות משהו אחר? 🤔',
                "I couldn't do that, try something else?"
              )
            }
          }
        } catch {
          return offlineResponse(
            'לא הצלחתי לעשות את זה, אפשר לנסות משהו אחר? 🤔',
            "I couldn't do that, try something else?"
          )
        }
      }
    }

    if (aiResponse.intent === 'CREATE_GAME' && aiResponse.definition) {
      const validated = validateGameDefinition(aiResponse.definition)
      aiResponse.definition = validated.definition
    }

    logAiCall({
      hebrewText: promptHe, englishText: prompt, mode,
      tier: 'claude', intent: aiResponse.intent,
      latencyMs: result.latencyMs,
      tokens: result.usage, repaired,
    })

    return NextResponse.json({
      intent: aiResponse.intent,
      actions: aiResponse.actions || [],
      definition: aiResponse.definition || null,
      message: aiResponse.message || { he: 'בוצע! ✨', en: 'Done! ✨' },
      suggestions: (aiResponse.suggestions || FALLBACK_SUGGESTIONS).slice(0, 3),
      meta: {
        source: 'claude',
        model: result.model,
        latencyMs: result.latencyMs,
        repaired,
      },
    })
  } catch {
    return offlineResponse(
      'אופס, משהו לא עבד. אפשר לנסות שוב 🤖',
      'Oops, something went wrong. Try again'
    )
  }
}
