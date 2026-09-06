export const TEMPLATES = ['catch', 'dodge', 'jumper', 'shooter', 'pong', 'breakout', 'snake', 'memory', 'clicker', 'racer']

export const SPRITES = {
  cat: '🐱', dog: '🐶', frog: '🐸', robot: '🤖', spaceship: '🚀',
  car: '🏎️', hero: '🦸', alien: '👾', monster: '👹', bird: '🐦',
  star: '⭐', coin: '🪙', apple: '🍎', bone: '🦴', gem: '💎',
  heart: '❤️', mushroom: '🍄', fish: '🐟', candy: '🍬', cookie: '🍪',
  bomb: '💣', fire: '🔥', skull: '💀', cactus: '🌵', rock: '🪨',
  lightning: '⚡', spike: '🔱', ghost: '👻',
  ball: '⚪', brick: '🟫', paddle: '', snake: '🟩', food: '🍎',
  card: '🃏', target: '🎯', tree: '🌲', barrel: '🛢️',
}

export const BACKGROUNDS = ['sky', 'space', 'forest', 'city', 'ocean', 'desert', 'grass', 'night']

export const DIFFICULTIES = {
  easy: { speedMul: 0.7, spawnMul: 0.7 },
  normal: { speedMul: 1.0, spawnMul: 1.0 },
  hard: { speedMul: 1.4, spawnMul: 1.3 },
}

export function createGameDefinition(overrides = {}) {
  return {
    id: overrides.id || `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    version: 1,
    template: overrides.template || 'catch',
    title: overrides.title || 'My Game',
    theme: {
      background: 'sky',
      ...(overrides.theme || {}),
    },
    player: {
      type: 'cat',
      size: 50,
      speed: 5,
      ...(overrides.player || {}),
    },
    objects: overrides.objects || [],
    rules: {
      startingLives: 3,
      targetScore: 20,
      difficulty: 'normal',
      ...(overrides.rules || {}),
    },
  }
}

export function getSprite(type) {
  return SPRITES[type] || type || '❓'
}
