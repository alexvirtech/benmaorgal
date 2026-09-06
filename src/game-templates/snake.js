import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'
import { getSprite } from '../game-data/schema.js'

const CELL = 20
const COLS = Math.floor(GAME_WIDTH / CELL)
const ROWS = Math.floor((GAME_HEIGHT - 40) / CELL)
const HUD_H = 40

export const snakeTemplate = {
  id: 'snake',
  name: 'Snake',
  icon: '🐍',
  description: 'Eat food and grow',
  examplePrompt: 'Make a snake that eats apples',
  suggestions: [
    { text: 'Make me faster', icon: '💨' },
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Give me 5 lives', icon: '❤️' },
    { text: 'Make the background forest', icon: '🌲' },
  ],

  getDefaultDefinition() {
    return {
      template: 'snake',
      title: 'Super Snake',
      theme: { background: 'grass' },
      player: { type: 'snake', size: CELL, speed: 5 },
      objects: [
        { id: 'food', role: 'collectible', type: 'apple', points: 1 },
      ],
      rules: { startingLives: 1, targetScore: 20, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    const startX = Math.floor(COLS / 2)
    const startY = Math.floor(ROWS / 2)
    engine.set('snake', [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ])
    engine.set('dir', { x: 1, y: 0 })
    engine.set('nextDir', { x: 1, y: 0 })
    engine.set('moveTimer', 0)
    engine.set('moveInterval', 0.12)
    engine.state.lives = def.rules.startingLives
    engine.set('targetScore', def.rules.targetScore)
    placeFood(engine, def)
  },

  update(engine, dt) {
    const input = engine.input
    const dir = engine.get('dir')
    const nextDir = engine.get('nextDir')

    if (input.actions.left && dir.x !== 1) engine.set('nextDir', { x: -1, y: 0 })
    else if (input.actions.right && dir.x !== -1) engine.set('nextDir', { x: 1, y: 0 })
    else if (input.actions.up && dir.y !== 1) engine.set('nextDir', { x: 0, y: -1 })
    else if (input.actions.down && dir.y !== -1) engine.set('nextDir', { x: 0, y: 1 })

    const timer = engine.get('moveTimer') + dt
    const interval = engine.get('moveInterval')
    if (timer < interval) {
      engine.set('moveTimer', timer)
      return
    }
    engine.set('moveTimer', 0)

    const snake = engine.get('snake')
    const d = engine.get('nextDir')
    engine.set('dir', { ...d })

    const head = { x: snake[0].x + d.x, y: snake[0].y + d.y }

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      engine.lose()
      return
    }

    for (const seg of snake) {
      if (seg.x === head.x && seg.y === head.y) {
        engine.lose()
        return
      }
    }

    snake.unshift(head)

    const food = engine.get('food')
    if (food && head.x === food.x && head.y === food.y) {
      engine.addScore(1)
      placeFood(engine, engine.definition)
      const newInterval = Math.max(0.05, engine.get('moveInterval') - 0.003)
      engine.set('moveInterval', newInterval)
    } else {
      snake.pop()
    }

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'grass')

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(0, HUD_H, COLS * CELL, ROWS * CELL)

    const snake = engine.get('snake') || []
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i]
      const brightness = i === 0 ? '#27ae60' : '#2ecc71'
      ctx.fillStyle = brightness
      ctx.beginPath()
      ctx.roundRect(seg.x * CELL + 1, HUD_H + seg.y * CELL + 1, CELL - 2, CELL - 2, 4)
      ctx.fill()
    }

    if (snake.length > 0) {
      const head = snake[0]
      ctx.font = `${CELL * 0.7}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🐍', head.x * CELL + CELL / 2, HUD_H + head.y * CELL + CELL / 2)
    }

    const food = engine.get('food')
    if (food) {
      const foodObj = engine.definition?.objects?.[0]
      const sprite = getSprite(foodObj?.type || 'apple')
      ctx.font = `${CELL * 0.8}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sprite, food.x * CELL + CELL / 2, HUD_H + food.y * CELL + CELL / 2)
    }
  },
}

function placeFood(engine, def) {
  const snake = engine.get('snake') || []
  let x, y, attempts = 0
  do {
    x = Math.floor(Math.random() * COLS)
    y = Math.floor(Math.random() * ROWS)
    attempts++
  } while (snake.some(s => s.x === x && s.y === y) && attempts < 100)
  engine.set('food', { x, y })
}
