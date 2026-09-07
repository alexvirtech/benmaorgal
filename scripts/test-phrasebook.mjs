import { matchHebrew } from '../src/ai/phrasebook.he.js'

let passed = 0
let failed = 0

function assert(input, expected, description) {
  const result = matchHebrew(input)
  const ok = !!result
  if (!ok && expected) {
    console.error(`FAIL: "${input}" — expected match, got null (${description})`)
    failed++
    return
  }
  if (ok && !expected) {
    console.error(`FAIL: "${input}" — expected null, got match (${description})`)
    failed++
    return
  }
  if (!expected) {
    passed++
    return
  }
  if (expected.english && result.english !== expected.english) {
    console.error(`FAIL: "${input}" — english: "${result.english}" !== "${expected.english}" (${description})`)
    failed++
    return
  }
  if (expected.actionType && result.action?.type !== expected.actionType) {
    console.error(`FAIL: "${input}" — action type: "${result.action?.type}" !== "${expected.actionType}" (${description})`)
    failed++
    return
  }
  if (expected.delta !== undefined && result.action?.delta !== expected.delta) {
    console.error(`FAIL: "${input}" — delta: ${result.action?.delta} !== ${expected.delta} (${description})`)
    failed++
    return
  }
  if (expected.value !== undefined && result.action?.value !== expected.value) {
    console.error(`FAIL: "${input}" — value: ${result.action?.value} !== ${expected.value} (${description})`)
    failed++
    return
  }
  if (expected.template && result.template !== expected.template) {
    console.error(`FAIL: "${input}" — template: "${result.template}" !== "${expected.template}" (${description})`)
    failed++
    return
  }
  passed++
}

// --- Speed ---
assert('יותר מהר', { english: 'make the player faster', actionType: 'SET_PROPERTY', delta: 2 }, 'faster basic')
assert('תעשה יותר מהר', { english: 'make the player faster', actionType: 'SET_PROPERTY', delta: 2 }, 'faster with prefix')
assert('מהר יותר', { english: 'make the player faster', actionType: 'SET_PROPERTY', delta: 2 }, 'faster reversed')
assert('שירוץ מהר', { english: 'make the player faster', actionType: 'SET_PROPERTY', delta: 2 }, 'run fast')

// --- Slower ---
assert('יותר לאט', { english: 'make the player slower', actionType: 'SET_PROPERTY', delta: -2 }, 'slower basic')
assert('לאט יותר', { english: 'make the player slower', actionType: 'SET_PROPERTY', delta: -2 }, 'slower reversed')
assert('שילך לאט', { english: 'make the player slower', actionType: 'SET_PROPERTY', delta: -2 }, 'go slow')

// --- Add bombs ---
assert('תוסיף פצצות', { english: 'add bombs', actionType: 'ADD_OBJECT' }, 'add bombs')
assert('שיהיו פצצות', { english: 'add bombs', actionType: 'ADD_OBJECT' }, 'there should be bombs')
assert('פצצות', { english: 'add bombs', actionType: 'ADD_OBJECT' }, 'just bombs')

// --- Remove bombs ---
assert('תוריד את הפצצות', { english: 'remove bombs', actionType: 'REMOVE_OBJECT' }, 'remove bombs')
assert('בלי פצצות', { english: 'remove bombs', actionType: 'REMOVE_OBJECT' }, 'no bombs')
assert('תמחק פצצות', { english: 'remove bombs', actionType: 'REMOVE_OBJECT' }, 'delete bombs')

// --- N lives ---
assert('תן לי 5 חיים', { english: 'give me 5 lives', actionType: 'SET_PROPERTY', value: 5 }, '5 lives digit')
assert('אני רוצה 10 חיים', { english: 'give me 10 lives', actionType: 'SET_PROPERTY', value: 10 }, '10 lives digit')
assert('תן לי עשר חיים', { english: 'give me 10 lives', actionType: 'SET_PROPERTY', value: 10 }, '10 lives word')
assert('תן לי שלוש חיים', { english: 'give me 3 lives', actionType: 'SET_PROPERTY', value: 3 }, '3 lives word')

// --- Add a life ---
assert('עוד חיים', { english: 'add a life', actionType: 'SET_PROPERTY', delta: 1 }, 'more lives')
assert('תוסיף לי חיים', { english: 'add a life', actionType: 'SET_PROPERTY', delta: 1 }, 'add life')

// --- Difficulty ---
assert('יותר קשה', { english: 'make it harder', actionType: 'SET_DIFFICULTY' }, 'harder')
assert('תעשה שיהיה קשה', { english: 'make it harder', actionType: 'SET_DIFFICULTY' }, 'make hard')
assert('יותר קל', { english: 'make it easier', actionType: 'SET_DIFFICULTY' }, 'easier')
assert('תעשה שיהיה קל', { english: 'make it easier', actionType: 'SET_DIFFICULTY' }, 'make easy')

// --- Size ---
assert('יותר גדול', { english: 'make the player bigger', actionType: 'SET_PROPERTY', delta: 15 }, 'bigger')
assert('תעשה אותי גדול', { english: 'make the player bigger', actionType: 'SET_PROPERTY', delta: 15 }, 'make me big')
assert('יותר קטן', { english: 'make the player smaller', actionType: 'SET_PROPERTY', delta: -10 }, 'smaller')
assert('תעשה אותי קטן', { english: 'make the player smaller', actionType: 'SET_PROPERTY', delta: -10 }, 'make me small')

// --- Background ---
assert('רקע חלל', { english: 'make the background space', actionType: 'CHANGE_THEME' }, 'bg space')
assert('תעשה רקע של יער', { english: 'make the background forest', actionType: 'CHANGE_THEME' }, 'bg forest')
assert('רקע ים', { english: 'make the background ocean', actionType: 'CHANGE_THEME' }, 'bg ocean')
assert('רקע של עיר', { english: 'make the background city', actionType: 'CHANGE_THEME' }, 'bg city')
assert('רקע מדבר', { english: 'make the background desert', actionType: 'CHANGE_THEME' }, 'bg desert')
assert('רקע לילה', { english: 'make the background night', actionType: 'CHANGE_THEME' }, 'bg night')
assert('רקע דשא', { english: 'make the background grass', actionType: 'CHANGE_THEME' }, 'bg grass')
assert('רקע שמיים', { english: 'make the background sky', actionType: 'CHANGE_THEME' }, 'bg sky')

// --- Change player ---
assert('תחליף אותי לחתול', { english: 'change the player to cat', actionType: 'CHANGE_PLAYER' }, 'player cat')
assert('אני רוצה להיות כלב', { english: 'change the player to dog', actionType: 'CHANGE_PLAYER' }, 'player dog')
assert('תחליף אותי לחללית', { english: 'change the player to spaceship', actionType: 'CHANGE_PLAYER' }, 'player spaceship')
assert('תעשה אותי רובוט', { english: 'change the player to robot', actionType: 'CHANGE_PLAYER' }, 'player robot')
assert('אני רוצה להיות ארנב', { english: 'change the player to bunny', actionType: 'CHANGE_PLAYER' }, 'player bunny')

// --- Target score ---
assert('ניקוד 100', { english: 'set target score to 100', actionType: 'SET_PROPERTY', value: 100 }, 'score 100')
assert('צריך 50 נקודות', { english: 'set target score to 50', actionType: 'SET_PROPERTY', value: 50 }, 'score 50')

// --- Creation ---
assert('תעשה משחק שחתול תופס כוכבים', { english: 'make a game where a cat catches stars' }, 'create cat catches stars')
assert('תעשה לי משחק שכלב תופס עצמות ביער', { english: 'make a game where a dog catches bones in forest' }, 'create dog bones forest')

console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed} tests`)

if (failed > 0) {
  process.exit(1)
} else {
  console.log('All phrasebook tests passed!')
}
