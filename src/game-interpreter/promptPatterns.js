export const TEMPLATE_PATTERNS = [
  {
    template: 'catch',
    keywords: ['catch', 'collect', 'falling stars', 'catch stars', 'collect apples', 'catch bones', 'gather', 'pick up'],
    icon: '⭐',
  },
  {
    template: 'dodge',
    keywords: ['avoid', 'dodge', 'bomb', 'avoid monsters', "don't get hit", 'survive', 'escape'],
    icon: '💣',
  },
  {
    template: 'jumper',
    keywords: ['jump', 'jump over', 'frog', 'runner', 'obstacles', 'run', 'hop'],
    icon: '🐸',
  },
  {
    template: 'shooter',
    keywords: ['shoot', 'laser', 'spaceship', 'aliens', 'fire', 'blast', 'destroy'],
    icon: '🚀',
  },
  {
    template: 'pong',
    keywords: ['pong', 'paddle', 'ping pong', 'table tennis'],
    icon: '🏓',
  },
  {
    template: 'breakout',
    keywords: ['break blocks', 'break bricks', 'breakout', 'bricks', 'brick breaker', 'smash blocks'],
    icon: '🧱',
  },
  {
    template: 'snake',
    keywords: ['snake', 'eat apples', 'snake game', 'grow', 'worm'],
    icon: '🐍',
  },
  {
    template: 'memory',
    keywords: ['memory', 'match', 'matching cards', 'pairs', 'card game', 'find pairs'],
    icon: '🧠',
  },
  {
    template: 'clicker',
    keywords: ['click', 'tap', 'hit monster', 'catch monster', 'before it disappears', 'whack'],
    icon: '🎯',
  },
  {
    template: 'racer',
    keywords: ['car', 'race', 'racing', 'drive', 'avoid cars', 'road', 'highway'],
    icon: '🏎️',
  },
  {
    template: 'flappy',
    keywords: ['flappy', 'fly', 'flying', 'flap', 'pipes', 'wings', 'fly through'],
    icon: '🐦',
  },
  {
    template: 'whack',
    keywords: ['whack', 'mole', 'whack-a-mole', 'whack a mole', 'pop up', 'hammer', 'smash moles'],
    icon: '🔨',
  },
]

export const PLAYER_TYPES = {
  cat: { sprite: '🐱', themes: ['sky', 'grass'] },
  dog: { sprite: '🐶', themes: ['grass', 'forest'] },
  frog: { sprite: '🐸', themes: ['grass', 'forest'] },
  robot: { sprite: '🤖', themes: ['city', 'space'] },
  spaceship: { sprite: '🚀', themes: ['space'] },
  car: { sprite: '🏎️', themes: ['city'] },
  hero: { sprite: '🦸', themes: ['city', 'sky'] },
  alien: { sprite: '👾', themes: ['space'] },
  bird: { sprite: '🐦', themes: ['sky'] },
  fish: { sprite: '🐟', themes: ['ocean'] },
  monkey: { sprite: '🐵', themes: ['forest'] },
  bunny: { sprite: '🐰', themes: ['grass'] },
}

export const COLLECTIBLE_TYPES = {
  star: '⭐', stars: '⭐', coin: '🪙', coins: '🪙',
  apple: '🍎', apples: '🍎', bone: '🦴', bones: '🦴',
  gem: '💎', gems: '💎', heart: '❤️', hearts: '❤️',
  mushroom: '🍄', fish: '🐟', candy: '🍬', cookie: '🍪',
  diamond: '💎', fruit: '🍎',
}

export const HAZARD_TYPES = {
  bomb: '💣', bombs: '💣', fire: '🔥',
  skull: '💀', cactus: '🌵', rock: '🪨', rocks: '🪨',
  lightning: '⚡', spike: '🔱', ghost: '👻',
  meteor: '☄️',
}

const DECORATION_SPRITES = {
  spaceship: '🚀', rocket: '🚀', ufo: '🛸', satellite: '🛰️',
  star: '⭐', planet: '🪐', moon: '🌙', sun: '☀️', comet: '☄️',
  cloud: '☁️', butterfly: '🦋', balloon: '🎈', flower: '🌸',
  snowflake: '❄️', rainbow: '🌈', tree: '🌲', mountain: '⛰️',
  bird: '🐦', fish: '🐟', octopus: '🐙', jellyfish: '🪼',
  robot: '🤖', alien: '👾', ghost: '👻', monster: '👹',
  cat: '🐱', dog: '🐶', bunny: '🐰', frog: '🐸',
  crown: '👑', diamond: '💎', gem: '💎', crystal: '💎',
  note: '🎵', music: '🎶', heart: '❤️', fire: '🔥',
  lightning: '⚡', sparkle: '✨', candy: '🍬', cookie: '🍪',
}

function lookupSprite(type) {
  return DECORATION_SPRITES[type] || COLLECTIBLE_TYPES[type] || HAZARD_TYPES[type] || PLAYER_TYPES[type]?.sprite || '✨'
}

export const MODIFICATION_PATTERNS = [
  {
    match: /(?:make|set)\s+(?:it|the\s+\w+|player|cat|dog|frog|car|spaceship|robot)?\s*faster/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'player.speed', value: null, delta: 2 }),
    description: 'Made it faster! 💨',
    descriptionHe: 'עשיתי מהר יותר! 💨',
  },
  {
    match: /(?:make|set)\s+(?:it|the\s+\w+|player)?\s*slower/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'player.speed', value: null, delta: -2 }),
    description: 'Made it slower! 🐌',
    descriptionHe: 'עשיתי לאט יותר! 🐌',
  },
  {
    match: /(?:give\s+me|i\s+want|set)\s+(\d+)\s+lives?/i,
    action: (m) => ({ type: 'SET_PROPERTY', path: 'rules.startingLives', value: parseInt(m[1]) }),
    description: (m) => `You now have ${m[1]} lives! ❤️`,
    descriptionHe: (m) => `יש לך ${m[1]} חיים! ❤️`,
  },
  {
    match: /add\s+(?:a\s+)?(?:more\s+)?life/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'rules.startingLives', value: null, delta: 1 }),
    description: 'Added an extra life! ❤️',
    descriptionHe: 'הוספתי חיים! ❤️',
  },
  {
    match: /(?:make\s+it|make\s+the\s+game)\s+harder/i,
    action: () => ({ type: 'SET_DIFFICULTY', difficulty: 'hard' }),
    description: 'Made it harder! ⚡ Good luck!',
    descriptionHe: 'עשיתי יותר קשה! ⚡ בהצלחה!',
  },
  {
    match: /(?:make\s+it|make\s+the\s+game)\s+easier/i,
    action: () => ({ type: 'SET_DIFFICULTY', difficulty: 'easy' }),
    description: 'Made it easier! 😊',
    descriptionHe: 'עשיתי יותר קל! 😊',
  },
  {
    match: /add\s+(?:dangerous\s+)?bombs?/i,
    action: () => ({
      type: 'ADD_OBJECT',
      object: { role: 'hazard', type: 'bomb', speed: 3, spawnRate: 2000, effect: 'loseLife' },
    }),
    description: 'Added bombs! 💣 Watch out!',
    descriptionHe: 'הוספתי פצצות! 💣 תיזהר!',
  },
  {
    match: /(?:remove|no)\s+bombs?/i,
    action: () => ({ type: 'REMOVE_OBJECT', objectType: 'bomb' }),
    description: 'Removed the bombs! 😌',
    descriptionHe: 'הורדתי את הפצצות! 😌',
  },
  {
    match: /(?:make|change|set)\s+(?:the\s+)?background\s+(?:to\s+)?(\w+)/i,
    action: (m) => ({ type: 'CHANGE_THEME', theme: { background: m[1].toLowerCase() } }),
    description: (m) => `Changed the background to ${m[1]}! 🎨`,
    descriptionHe: (m) => `שיניתי רקע ל-${m[1]}! 🎨`,
  },
  {
    match: /(?:make|change|set)\s+(?:the\s+)?ground\s+(?:color\s+)?(?:to\s+)?(?:a\s+)?([\w\s]+?)$/i,
    action: (m) => {
      const COLOR_MAP = {
        red: '#cc3333', 'dark red': '#8b0000',
        green: '#33cc33', 'dark green': '#1a5c1a', 'light green': '#90ee90',
        blue: '#3333cc', 'dark blue': '#00008b', 'light blue': '#add8e6',
        yellow: '#cccc33', brown: '#8b4513', 'dark brown': '#3e2723',
        black: '#222', white: '#eee', gray: '#888', grey: '#888',
        orange: '#ff8c00', purple: '#6a0dad', pink: '#ff69b4',
        sand: '#c4a35a', dirt: '#6b4423',
      }
      const name = m[1].trim().toLowerCase()
      const color = COLOR_MAP[name] || name
      return { type: 'CHANGE_THEME', theme: { groundColor: color } }
    },
    description: (m) => `Changed the ground to ${m[1].trim()}! 🎨`,
    descriptionHe: (m) => `שיניתי את הקרקע ל-${m[1].trim()}! 🎨`,
  },
  {
    match: /(?:change|make)\s+(?:the\s+)?(?:player|character)\s+(?:to\s+)?(?:a\s+)?(\w+)/i,
    action: (m) => ({ type: 'CHANGE_PLAYER', player: { type: m[1].toLowerCase() } }),
    description: (m) => `Changed player to ${m[1]}! 🎭`,
    descriptionHe: (m) => `שיניתי שחקן ל-${m[1]}! 🎭`,
  },
  {
    match: /(?:set|change)\s+(?:target\s+)?score\s+(?:to\s+)?(\d+)/i,
    action: (m) => ({ type: 'SET_PROPERTY', path: 'rules.targetScore', value: parseInt(m[1]) }),
    description: (m) => `Target score set to ${m[1]}! 🎯`,
    descriptionHe: (m) => `ניקוד יעד: ${m[1]}! 🎯`,
  },
  {
    match: /(?:make|set)\s+(?:it\s+)?(?:the\s+\w+\s+)?bigger/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'player.size', value: null, delta: 15 }),
    description: 'Made the player bigger! 🔍',
    descriptionHe: 'הגדלתי את השחקן! 🔍',
  },
  {
    match: /(?:make|set)\s+(?:it\s+)?(?:the\s+\w+\s+)?smaller/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'player.size', value: null, delta: -10 }),
    description: 'Made the player smaller! 🔬',
    descriptionHe: 'הקטנתי את השחקן! 🔬',
  },
  {
    match: /add\s+(?:some\s+|a\s+few\s+|more\s+)?(\w+)/i,
    action: (m) => {
      const full = m.input || ''
      let type = m[1].toLowerCase().replace(/s$/, '')
      const sprite = lookupSprite(type)
      const spinning = /spin/i.test(full)
      return {
        type: 'ADD_OBJECT',
        object: {
          role: 'decoration',
          type,
          sprite,
          count: 5,
          speed: 1,
          size: 45,
          spin: spinning,
        },
      }
    },
    description: (m) => `Added ${m[1]} to the background! ✨`,
    descriptionHe: (m) => `הוספתי ${m[1]} לרקע! ✨`,
  },
]

export function extractThemeFromPrompt(prompt) {
  const lower = prompt.toLowerCase()
  const backgrounds = ['space', 'forest', 'city', 'ocean', 'desert', 'grass', 'night']
  for (const bg of backgrounds) {
    if (lower.includes(bg)) return bg
  }
  return null
}

export function extractPlayerFromPrompt(prompt) {
  const lower = prompt.toLowerCase()
  for (const [type] of Object.entries(PLAYER_TYPES)) {
    if (lower.includes(type)) return type
  }
  return null
}

export function extractCollectibleFromPrompt(prompt) {
  const lower = prompt.toLowerCase()
  for (const [name, sprite] of Object.entries(COLLECTIBLE_TYPES)) {
    if (lower.includes(name)) return { type: name.replace(/s$/, ''), sprite }
  }
  return null
}
