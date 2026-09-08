import { getExamples } from '../src/game-data/examples.js'
import { matchHebrew } from '../src/ai/phrasebook.he.js'
import { interpretPrompt } from '../src/game-interpreter/LocalGameInterpreter.js'
import { getDefaultDefinition } from '../src/game-templates/index.js'
import { TEMPLATE_IDS } from '../src/game-data/catalog.js'

let pass = 0
let fail = 0
let total = 0
const failures = []

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

    try {
      const heMatch = matchHebrew(ex.he)
      if (heMatch) {
        source = 'phrasebook'
        if (heMatch.action) {
          intent = 'MODIFY_GAME'
          resolved = true
        } else if (heMatch.english) {
          const localResult = interpretPrompt(heMatch.english, fakeGame)
          if (localResult.intent !== 'UNKNOWN') {
            intent = localResult.intent
            source = 'phrasebook+local'
            resolved = true
          }
        }
      }

      if (!resolved) {
        const localResult = interpretPrompt(ex.en, fakeGame)
        if (localResult.intent !== 'UNKNOWN') {
          intent = localResult.intent
          source = 'local'
          resolved = true
        }
      }
    } catch (err) {
      error = err.message
    }

    if (resolved) {
      pass++
      console.log(`  ✓ [${i + 1}] ${ex.he}  →  ${intent} (${source})`)
    } else {
      fail++
      const reason = error || `intent=${intent}, not resolved`
      failures.push({ templateId, index: i + 1, he: ex.he, en: ex.en, reason })
      console.log(`  ✗ [${i + 1}] ${ex.he}  →  FAILED (${reason})`)
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

console.log('\n✓ All 240 examples resolve through phrasebook or local interpreter.')
process.exit(0)
