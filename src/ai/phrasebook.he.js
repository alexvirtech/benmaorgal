const HEB_NUMBERS = {
  'אחד': 1, 'אחת': 1, 'שניים': 2, 'שתיים': 2, 'שנים': 2,
  'שלוש': 3, 'שלושה': 3, 'ארבע': 4, 'ארבעה': 4,
  'חמש': 5, 'חמישה': 5, 'שש': 6, 'שישה': 6,
  'שבע': 7, 'שבעה': 7, 'שמונה': 8, 'תשע': 9, 'תשעה': 9,
  'עשר': 10, 'עשרה': 10, 'אחד עשר': 11, 'שנים עשר': 12,
  'שלוש עשרה': 13, 'ארבע עשרה': 14, 'חמש עשרה': 15,
  'שש עשרה': 16, 'שבע עשרה': 17, 'שמונה עשרה': 18,
  'תשע עשרה': 19, 'עשרים': 20,
}

const CHARACTERS = {
  'חתול': 'cat', 'חתולה': 'cat',
  'כלב': 'dog', 'כלבה': 'dog',
  'צפרדע': 'frog',
  'רובוט': 'robot',
  'חללית': 'spaceship',
  'מכונית': 'car', 'אוטו': 'car',
  'גיבור': 'hero', 'גיבורת': 'hero',
  'חייזר': 'alien', 'חייזרית': 'alien',
  'ציפור': 'bird',
  'דג': 'fish',
  'קוף': 'monkey',
  'ארנב': 'bunny', 'ארנבת': 'bunny',
}

const BACKGROUNDS_LIST = [
  ['שמיים', 'sky'],
  ['חלל', 'space'],
  ['יער', 'forest'],
  ['מדבר', 'desert'],
  ['לילה', 'night'],
  ['דשא', 'grass'],
  ['עיר', 'city'],
  ['ים', 'ocean'],
]

const TEMPLATE_KEYWORDS = {
  'תופס': 'catch', 'לתפוס': 'catch', 'אוסף': 'catch', 'לאסוף': 'catch',
  'מתחמק': 'dodge', 'להתחמק': 'dodge', 'בורח': 'dodge', 'לברוח': 'dodge',
  'קופץ': 'jumper', 'לקפוץ': 'jumper', 'רץ': 'jumper', 'לרוץ': 'jumper',
  'יורה': 'shooter', 'לירות': 'shooter', 'משמיד': 'shooter',
  'פונג': 'pong', 'טניס': 'pong', 'פינג פונג': 'pong',
  'שובר': 'breakout', 'לבנים': 'breakout', 'בלוקים': 'breakout',
  'נחש': 'snake',
  'זיכרון': 'memory', 'זוגות': 'memory', 'קלפים': 'memory',
  'לוחץ': 'clicker', 'ללחוץ': 'clicker',
  'מכונית': 'racer', 'מרוץ': 'racer', 'נהיגה': 'racer',
  'עף': 'flappy', 'טס': 'flappy', 'לעוף': 'flappy',
  'שומה': 'whack', 'חפרפרת': 'whack', 'פטיש': 'whack',
}

const COLLECTIBLES_HE = {
  'כוכבים': { type: 'star', sprite: '⭐' },
  'כוכב': { type: 'star', sprite: '⭐' },
  'מטבעות': { type: 'coin', sprite: '🪙' },
  'מטבע': { type: 'coin', sprite: '🪙' },
  'תפוחים': { type: 'apple', sprite: '🍎' },
  'תפוח': { type: 'apple', sprite: '🍎' },
  'עצמות': { type: 'bone', sprite: '🦴' },
  'עצם': { type: 'bone', sprite: '🦴' },
  'יהלומים': { type: 'gem', sprite: '💎' },
  'יהלום': { type: 'gem', sprite: '💎' },
  'לבבות': { type: 'heart', sprite: '❤️' },
  'לב': { type: 'heart', sprite: '❤️' },
  'פטריות': { type: 'mushroom', sprite: '🍄' },
  'פטריה': { type: 'mushroom', sprite: '🍄' },
  'דגים': { type: 'fish', sprite: '🐟' },
  'ממתקים': { type: 'candy', sprite: '🍬' },
  'ממתק': { type: 'candy', sprite: '🍬' },
  'עוגיות': { type: 'cookie', sprite: '🍪' },
  'עוגיה': { type: 'cookie', sprite: '🍪' },
}

function normalize(text) {
  return text
    .trim()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[.,!?;:'"()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function parseNumber(str) {
  const trimmed = str.trim()
  const digit = parseInt(trimmed, 10)
  if (!isNaN(digit) && digit > 0) return digit
  return HEB_NUMBERS[trimmed] || null
}

function findCharacter(text) {
  for (const [heb, eng] of Object.entries(CHARACTERS)) {
    if (text.includes(heb)) return eng
  }
  return null
}

function findBackground(text) {
  for (const [heb, eng] of BACKGROUNDS_LIST) {
    const re = new RegExp(`(?:^|\\s)(?:ב|ל|ה)?${heb}(?:\\s|$)`)
    if (re.test(text)) return eng
  }
  return null
}

const MODIFICATION_PATTERNS = [
  // Speed faster
  {
    match: /(?:יותר\s+מהר|מהר\s+יותר|תעשה\s+(?:אותי\s+|שאני\s+|יותר\s+|ש(?:זה\s+)?(?:יהיה\s+)?)מהר|שירוץ\s+מהר|תגביר\s+מהירות)/,
    english: 'make the player faster',
    action: { type: 'SET_PROPERTY', path: 'player.speed', delta: 2 },
  },
  // Speed slower
  {
    match: /(?:יותר\s+לאט|לאט\s+יותר|תעשה\s+(?:אותי\s+|שאני\s+|יותר\s+|ש(?:זה\s+)?(?:יהיה\s+)?)לאט|שילך\s+לאט|תוריד\s+מהירות)/,
    english: 'make the player slower',
    action: { type: 'SET_PROPERTY', path: 'player.speed', delta: -2 },
  },
  // Remove bombs — must be before add bombs
  {
    match: /(?:תוריד\s+(?:את\s+)?(?:ה)?פצצות|בלי\s+פצצות|תמחק\s+(?:את\s+)?(?:ה)?פצצות|תסיר\s+(?:את\s+)?(?:ה)?פצצות)/,
    english: 'remove bombs',
    action: { type: 'REMOVE_OBJECT', objectType: 'bomb' },
  },
  // Add bombs
  {
    match: /(?:תוסיף\s+פצצות|שיהיו\s+פצצות|תעשה\s+פצצות|^פצצות$)/,
    english: 'add bombs',
    action: { type: 'ADD_OBJECT', object: { role: 'hazard', type: 'bomb', speed: 3, spawnRate: 2000, effect: 'loseLife' } },
  },
  // N lives (specific number)
  {
    match: /(?:תן\s+לי|אני\s+רוצה)\s+(.+?)\s+חיים/,
    handler(m) {
      const n = parseNumber(m[1])
      if (!n) return null
      return {
        english: `give me ${n} lives`,
        action: { type: 'SET_PROPERTY', path: 'rules.startingLives', value: n },
      }
    },
  },
  // Add a life
  {
    match: /(?:עוד\s+חיים|תוסיף\s+(?:לי\s+)?חיים|חיים?\s+נוספים|עוד\s+חיי)/,
    english: 'add a life',
    action: { type: 'SET_PROPERTY', path: 'rules.startingLives', delta: 1 },
  },
  // Harder
  {
    match: /(?:יותר\s+קשה|תעשה\s+(?:ש(?:יהיה|זה\s+יהיה)\s+)?קשה|קשה\s+יותר)/,
    english: 'make it harder',
    action: { type: 'SET_DIFFICULTY', difficulty: 'hard' },
  },
  // Easier
  {
    match: /(?:יותר\s+קל|תעשה\s+(?:ש(?:יהיה|זה\s+יהיה)\s+)?קל|קל\s+יותר)/,
    english: 'make it easier',
    action: { type: 'SET_DIFFICULTY', difficulty: 'easy' },
  },
  // Bigger
  {
    match: /(?:יותר\s+גדול|גדול\s+יותר|תעשה\s+(?:אותי\s+)?גדול|תגדיל\s+(?:אותי|את\s+השחקן))/,
    english: 'make the player bigger',
    action: { type: 'SET_PROPERTY', path: 'player.size', delta: 15 },
  },
  // Smaller
  {
    match: /(?:יותר\s+קטן|קטן\s+יותר|תעשה\s+(?:אותי\s+)?קטן|תקטין\s+(?:אותי|את\s+השחקן))/,
    english: 'make the player smaller',
    action: { type: 'SET_PROPERTY', path: 'player.size', delta: -10 },
  },
  // Background
  {
    match: /(?:רקע\s+(?:של\s+)?(.+)|תעשה\s+רקע\s+(?:של\s+)?(.+)|תחליף\s+רקע\s+ל(.+)|שנה\s+רקע\s+ל(.+))/,
    handler(m) {
      const raw = (m[1] || m[2] || m[3] || m[4] || '').trim()
      const bg = findBackground(raw)
      if (!bg) return null
      return {
        english: `make the background ${bg}`,
        action: { type: 'CHANGE_THEME', theme: { background: bg } },
      }
    },
  },
  // Change player
  {
    match: /(?:תחליף\s+אותי\s+ל(.+)|אני\s+רוצה\s+להיות\s+(.+)|תעשה\s+(?:אותי|שאני)\s+(.+)|שנה\s+(?:את\s+)?(?:ה)?שחקן\s+ל(.+))/,
    handler(m) {
      const raw = (m[1] || m[2] || m[3] || m[4] || '').trim()
      const char = findCharacter(raw)
      if (!char) return null
      return {
        english: `change the player to ${char}`,
        action: { type: 'CHANGE_PLAYER', player: { type: char } },
      }
    },
  },
  // Target score
  {
    match: /(?:(?:ניקוד|יעד)\s+(?:של\s+)?(.+)|צריך\s+(.+?)\s+נקודות|(?:תשנה|שנה|תעשה)\s+(?:את\s+)?(?:ה)?ניקוד\s+(?:ל)?(.+))/,
    handler(m) {
      const raw = (m[1] || m[2] || m[3] || '').trim()
      const n = parseNumber(raw)
      if (!n) return null
      return {
        english: `set target score to ${n}`,
        action: { type: 'SET_PROPERTY', path: 'rules.targetScore', value: n },
      }
    },
  },
]

const CREATION_PATTERNS = [
  // "make a game where X catches Y"
  {
    match: /(?:תעשה|תבנה|צור)\s+(?:לי\s+)?משחק\s+(?:ש|ש(?:בו|ל)\s*)/,
    handler(text) {
      const after = text.replace(/^.*?משחק\s+(?:ש|ש(?:בו|ל)\s*)/, '').trim()

      const player = findCharacter(after)
      const bg = findBackground(after)

      let template = null
      for (const [kw, tmpl] of Object.entries(TEMPLATE_KEYWORDS)) {
        if (after.includes(kw)) { template = tmpl; break }
      }

      let collectible = null
      for (const [heb, obj] of Object.entries(COLLECTIBLES_HE)) {
        if (after.includes(heb)) { collectible = obj; break }
      }

      if (!template && collectible) template = 'catch'
      if (!template) template = 'catch'

      const parts = []
      if (player) parts.push(`a ${player}`)
      if (collectible) parts.push(`catches ${collectible.type}s`)
      if (bg) parts.push(`in ${bg}`)

      const english = parts.length
        ? `make a game where ${parts.join(' ')}`
        : `make a ${template} game`

      return { english, template, player, collectible, background: bg }
    },
  },
  // "game of X" / "X game"
  {
    match: /(?:תעשה|תבנה|צור)\s+(?:לי\s+)?(?:משחק)/,
    handler(text) {
      const player = findCharacter(text)
      const bg = findBackground(text)
      let template = null
      for (const [kw, tmpl] of Object.entries(TEMPLATE_KEYWORDS)) {
        if (text.includes(kw)) { template = tmpl; break }
      }
      if (!template) return null
      const english = `make a ${template} game`
      return { english, template, player, background: bg }
    },
  },
]

export function matchHebrew(text) {
  const norm = normalize(text)
  if (!norm) return null

  for (const pattern of MODIFICATION_PATTERNS) {
    const m = norm.match(pattern.match)
    if (!m) continue
    if (pattern.handler) {
      const result = pattern.handler(m)
      if (result) return result
    } else {
      return { english: pattern.english, action: pattern.action }
    }
  }

  for (const pattern of CREATION_PATTERNS) {
    const m = norm.match(pattern.match)
    if (!m) continue
    const result = pattern.handler(norm)
    if (result) return result
  }

  return null
}
