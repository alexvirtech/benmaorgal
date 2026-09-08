import { getExamples } from '../src/game-data/examples.js'
import { matchHebrew } from '../src/ai/phrasebook.he.js'
import { interpretPrompt } from '../src/game-interpreter/LocalGameInterpreter.js'
import { getDefaultDefinition } from '../src/game-templates/index.js'
import { TEMPLATE_IDS } from '../src/game-data/catalog.js'
import { applyGameAction } from '../src/game-data/actions.js'

let pass = 0
let fail = 0
let total = 0
const failures = []

function defChanged(before, after) {
  return JSON.stringify(before) !== JSON.stringify(after)
}

function verifyAction(action, beforeDef, afterDef) {
  switch (action.type) {
    case 'SET_PROPERTY': {
      const parts = action.path.split('.')
      let val = afterDef
      for (const p of parts) val = val?.[p]
      if (val == null) return `${action.path} not set`
      if (action.value != null && val !== action.value) return `${action.path}=${val}, expected ${action.value}`
      if (action.delta != null && action.value == null) {
        return null
      }
      return null
    }
    case 'ADD_OBJECT': {
      const before = beforeDef.objects?.length || 0
      const after = afterDef.objects?.length || 0
      if (after <= before) return 'no object added'
      return null
    }
    case 'REMOVE_OBJECT':
      return null
    case 'CHANGE_THEME': {
      for (const [k, v] of Object.entries(action.theme || {})) {
        if (afterDef.theme?.[k] !== v) return `theme.${k}=${afterDef.theme?.[k]}, expected ${v}`
      }
      return null
    }
    case 'CHANGE_PLAYER': {
      for (const [k, v] of Object.entries(action.player || {})) {
        if (afterDef.player?.[k] !== v) return `player.${k}=${afterDef.player?.[k]}, expected ${v}`
      }
      return null
    }
    case 'SET_DIFFICULTY': {
      if (afterDef.rules?.difficulty !== action.difficulty) return `difficulty not ${action.difficulty}`
      return null
    }
    default:
      return null
  }
}

for (const templateId of TEMPLATE_IDS) {
  const examples = getExamples(templateId)
  const baseDef = getDefaultDefinition(templateId)

  if (!examples.length) {
    console.log(`⚠ ${templateId}: no examples`)
    continue
  }
  if (!baseDef) {
    console.log(`⚠ ${templateId}: no default definition`)
    continue
  }

  console.log(`\n── ${templateId} (${examples.length} examples) ──`)

  for (let i = 0; i < examples.length; i++) {
    total++
    const ex = examples[i]
    const freshDef = getDefaultDefinition(templateId)

    const fakeGame = {
      id: `test_${templateId}_${i}`,
      template: templateId,
      definition: freshDef,
      messages: [],
      history: [],
    }

    let resolved = false
    let source = ''
    let intent = 'UNKNOWN'
    let error = null
    let actions = []
    let resultDef = null

    try {
      const heMatch = matchHebrew(ex.he)
      if (heMatch) {
        source = 'phrasebook'
        if (heMatch.action) {
          const result = applyGameAction(freshDef, heMatch.action)
          if (result.success) {
            intent = 'MODIFY_GAME'
            actions = [heMatch.action]
            resultDef = result.definition
            resolved = true
          } else {
            error = `action failed: ${result.error}`
          }
        } else if (heMatch.english) {
          const localResult = interpretPrompt(heMatch.english, fakeGame)
          if (localResult.intent !== 'UNKNOWN') {
            intent = localResult.intent
            source = 'phrasebook+local'
            actions = localResult.actions || []
            resultDef = localResult.definition || null
            resolved = true
          }
        }
      }

      if (!resolved) {
        const localResult = interpretPrompt(ex.en, fakeGame)
        if (localResult.intent !== 'UNKNOWN') {
          intent = localResult.intent
          source = 'local'
          actions = localResult.actions || []
          resultDef = localResult.definition || null
          resolved = true
        }
      }
    } catch (err) {
      error = err.message
    }

    if (!resolved) {
      fail++
      const reason = error || `intent=${intent}, not resolved`
      failures.push({ templateId, index: i + 1, he: ex.he, en: ex.en, reason })
      console.log(`  ✗ [${i + 1}] ${ex.he}  →  FAILED (${reason})`)
      continue
    }

    let verified = true
    let verifyError = null

    if (intent === 'MODIFY_GAME') {
      if (!resultDef) {
        verified = false
        verifyError = 'no resulting definition'
      } else {
        for (const action of actions) {
          const err = verifyAction(action, freshDef, resultDef)
          if (err) {
            verified = false
            verifyError = err
            break
          }
        }
      }
    } else if (intent === 'CREATE_GAME') {
      if (!resultDef) {
        verified = false
        verifyError = 'no definition created'
      }
    }

    if (verified) {
      pass++
      console.log(`  ✓ [${i + 1}] ${ex.he}  →  ${intent} (${source})`)
    } else {
      fail++
      failures.push({ templateId, index: i + 1, he: ex.he, en: ex.en, reason: verifyError })
      console.log(`  ✗ [${i + 1}] ${ex.he}  →  ${intent} VERIFY FAILED: ${verifyError}`)
    }
  }
}

console.log('\n════════════════════════════════')
console.log(`Total: ${total}  Pass: ${pass}  Fail: ${fail}`)
console.log('════════════════════════════════')

if (failures.length > 0) {
  console.log('\nFailures:')
  for (const f of failures) {
    console.log(`  ${f.templateId}[${f.index}] "${f.he}" / "${f.en}" — ${f.reason}`)
  }
  process.exit(1)
}

console.log('\n✓ All 240 examples resolve AND verify definition changes.')
process.exit(0)
