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

export const MODIFICATION_PATTERNS = [
  {
    match: /(?:make|set)\s+(?:it|the\s+\w+|player|cat|dog|frog|car|spaceship|robot)?\s*faster/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'player.speed', value: null, delta: 2 }),
    description: 'Made it faster! 💨',
  },
  {
    match: /(?:make|set)\s+(?:it|the\s+\w+|player)?\s*slower/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'player.speed', value: null, delta: -2 }),
    description: 'Made it slower! 🐌',
  },
  {
    match: /(?:give\s+me|i\s+want|set)\s+(\d+)\s+lives?/i,
    action: (m) => ({ type: 'SET_PROPERTY', path: 'rules.startingLives', value: parseInt(m[1]) }),
    description: (m) => `You now have ${m[1]} lives! ❤️`,
  },
  {
    match: /add\s+(?:a\s+)?(?:more\s+)?life/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'rules.startingLives', value: null, delta: 1 }),
    description: 'Added an extra life! ❤️',
  },
  {
    match: /(?:make\s+it|make\s+the\s+game)\s+harder/i,
    action: () => ({ type: 'SET_DIFFICULTY', difficulty: 'hard' }),
    description: 'Made it harder! ⚡ Good luck!',
  },
  {
    match: /(?:make\s+it|make\s+the\s+game)\s+easier/i,
    action: () => ({ type: 'SET_DIFFICULTY', difficulty: 'easy' }),
    description: 'Made it easier! 😊',
  },
  {
    match: /add\s+(?:dangerous\s+)?bombs?/i,
    action: () => ({
      type: 'ADD_OBJECT',
      object: { role: 'hazard', type: 'bomb', speed: 3, spawnRate: 2000, effect: 'loseLife' },
    }),
    description: 'Added bombs! 💣 Watch out!',
  },
  {
    match: /(?:remove|no)\s+bombs?/i,
    action: () => ({ type: 'REMOVE_OBJECT', objectType: 'bomb' }),
    description: 'Removed the bombs! 😌',
  },
  {
    match: /(?:make|change|set)\s+(?:the\s+)?background\s+(?:to\s+)?(\w+)/i,
    action: (m) => ({ type: 'CHANGE_THEME', theme: { background: m[1].toLowerCase() } }),
    description: (m) => `Changed the background to ${m[1]}! 🎨`,
  },
  {
    match: /(?:change|make)\s+(?:the\s+)?(?:player|character)\s+(?:to\s+)?(?:a\s+)?(\w+)/i,
    action: (m) => ({ type: 'CHANGE_PLAYER', player: { type: m[1].toLowerCase() } }),
    description: (m) => `Changed player to ${m[1]}! 🎭`,
  },
  {
    match: /(?:set|change)\s+(?:target\s+)?score\s+(?:to\s+)?(\d+)/i,
    action: (m) => ({ type: 'SET_PROPERTY', path: 'rules.targetScore', value: parseInt(m[1]) }),
    description: (m) => `Target score set to ${m[1]}! 🎯`,
  },
  {
    match: /(?:make|set)\s+(?:it\s+)?(?:the\s+\w+\s+)?bigger/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'player.size', value: null, delta: 15 }),
    description: 'Made the player bigger! 🔍',
  },
  {
    match: /(?:make|set)\s+(?:it\s+)?(?:the\s+\w+\s+)?smaller/i,
    action: () => ({ type: 'SET_PROPERTY', path: 'player.size', value: null, delta: -10 }),
    description: 'Made the player smaller! 🔬',
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
