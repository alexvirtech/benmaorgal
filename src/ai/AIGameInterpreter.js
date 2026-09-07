export async function interpretPromptAI(prompt, currentGame = null) {
  const mode = currentGame ? 'modify' : 'create'

  const body = {
    mode,
    prompt,
    promptHe: null,
    deviceId: getDeviceId(),
  }

  if (currentGame) {
    body.game = {
      template: currentGame.template,
      definition: currentGame.definition,
    }
  }

  try {
    const res = await fetch('/api/robot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      return fallback(prompt)
    }

    const data = await res.json()

    return {
      intent: data.intent,
      actions: data.actions || [],
      definition: data.definition || null,
      robotMessage: data.message?.en || 'Done! ✨',
      robotMessageHe: data.message?.he || 'בוצע! ✨',
      suggestions: data.suggestions || [],
      source: data.meta?.source || 'claude',
    }
  } catch {
    return fallback(prompt)
  }
}

function fallback(prompt) {
  return {
    intent: 'UNKNOWN',
    actions: [],
    definition: null,
    robotMessage: `I'm not sure how to do "${prompt}" right now. Try a simpler command!`,
    robotMessageHe: 'לא הבנתי, אפשר לנסות פקודה פשוטה יותר? 🤔',
    suggestions: [
      { he: 'תעשה אותי מהר יותר', en: 'make the player faster', icon: '💨' },
      { he: 'תוסיף פצצות', en: 'add bombs', icon: '💣' },
      { he: 'רקע של חלל', en: 'make the background space', icon: '🌌' },
    ],
    source: 'fallback',
  }
}

function getDeviceId() {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = localStorage.getItem('benmaorgal-device-id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('benmaorgal-device-id', id)
    }
    return id
  } catch {
    return 'unknown'
  }
}
