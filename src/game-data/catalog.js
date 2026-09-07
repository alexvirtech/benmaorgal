export const TEMPLATE_IDS = [
  'catch', 'dodge', 'jumper', 'shooter', 'pong', 'breakout',
  'snake', 'memory', 'clicker', 'racer', 'flappy', 'whack',
]

export const SPRITE_KEYS = {
  cat: '🐱', dog: '🐶', frog: '🐸', robot: '🤖', spaceship: '🚀',
  car: '🏎️', hero: '🦸', alien: '👾', monster: '👹', bird: '🐦',
  star: '⭐', coin: '🪙', apple: '🍎', bone: '🦴', gem: '💎',
  heart: '❤️', mushroom: '🍄', fish: '🐟', candy: '🍬', cookie: '🍪',
  bomb: '💣', fire: '🔥', skull: '💀', cactus: '🌵', rock: '🪨',
  lightning: '⚡', spike: '🔱', ghost: '👻',
  ball: '⚪', brick: '🟫', paddle: '', snake: '🟩', food: '🍎',
  card: '🃏', target: '🎯', tree: '🌲', barrel: '🛢️',
  mole: '🐹', hammer: '🔨', pipe: '🟩',
}

export const BACKGROUND_IDS = ['sky', 'space', 'forest', 'city', 'ocean', 'desert', 'grass', 'night']

export const PLAYER_IDS = ['cat', 'dog', 'frog', 'robot', 'spaceship', 'car', 'hero', 'alien', 'bird', 'fish', 'monkey', 'bunny']

export const ROLES = ['collectible', 'hazard', 'enemy', 'obstacle', 'decoration']

export const EFFECTS = ['loseLife', 'addScore', 'addLife', null]

export const MOTIONS = ['fall', 'zigzag', 'drift', 'spin']

export const RANGES = {
  playerSpeed: { min: 1, max: 15, default: 5 },
  playerSize: { min: 20, max: 120, default: 50 },
  objectSpeed: { min: 0.5, max: 15, default: 3 },
  objectSize: { min: 30, max: 120, default: 45 },
  objectSpawnRate: { min: 200, max: 10000, default: 1200 },
  objectPoints: { min: 0, max: 100, default: 1 },
  startingLives: { min: 1, max: 20, default: 3 },
  targetScore: { min: 1, max: 999, default: 20 },
  timeLimit: { min: 10, max: 300, default: 0 },
  titleMaxLength: 50,
  maxObjects: 6,
  maxActionsPerResponse: 8,
}

export const DIFFICULTIES = {
  easy: { speedMul: 0.7, spawnMul: 0.7 },
  normal: { speedMul: 1.0, spawnMul: 1.0 },
  hard: { speedMul: 1.4, spawnMul: 1.3 },
}

export const ACTION_TYPES = [
  'SET_PROPERTY',
  'ADD_OBJECT',
  'REMOVE_OBJECT',
  'CHANGE_THEME',
  'CHANGE_PLAYER',
  'SET_DIFFICULTY',
  'MODIFY_OBJECT',
  'SET_TITLE',
  'RESET_GAME',
]
