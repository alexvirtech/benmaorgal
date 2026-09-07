import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'
import { getSprite } from '../game-data/schema.js'

const CELL = 30
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
    { he: 'תעשה אותי מהר יותר', en: 'make the player faster', icon: '💨' },
    { he: 'יותר קשה', en: 'make it harder', icon: '⚡' },
    { he: 'תן לי 5 חיים', en: 'give me 5 lives', icon: '❤️' },
    { he: 'רקע של יער', en: 'make the background forest', icon: '🌲' },
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
      rules: { startingLives: 1, targetScore: 40, difficulty: 'normal' },
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
    placeFood(engine)
  },

  update(engine, dt) {
    const input = engine.input
    const dir = engine.get('dir')

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
      engine.spawnParticles(
        snake[0].x * CELL + CELL / 2,
        HUD_H + snake[0].y * CELL + CELL / 2,
        '#ff4444', 20, 5
      )
      engine.screenShake(10, 0.2)
      engine.lose()
      return
    }

    for (const seg of snake) {
      if (seg.x === head.x && seg.y === head.y) {
        engine.spawnParticles(
          head.x * CELL + CELL / 2,
          HUD_H + head.y * CELL + CELL / 2,
          '#ff4444', 20, 5
        )
        engine.screenShake(10, 0.2)
        engine.lose()
        return
      }
    }

    const tail = snake[snake.length - 1]
    const tailX = tail.x * CELL + CELL / 2
    const tailY = HUD_H + tail.y * CELL + CELL / 2

    snake.unshift(head)

    const food = engine.get('food')
    if (food && head.x === food.x && head.y === food.y) {
      engine.addScore(1)
      engine.spawnParticles(
        food.x * CELL + CELL / 2,
        HUD_H + food.y * CELL + CELL / 2,
        '#ffd700', 14, 4
      )
      engine.spawnFloatingText(
        food.x * CELL + CELL / 2,
        HUD_H + food.y * CELL,
        '+1'
      )
      placeFood(engine)
      const newInterval = Math.max(0.05, engine.get('moveInterval') - 0.003)
      engine.set('moveInterval', newInterval)
    } else {
      engine.spawnTrail(tailX, tailY, '#2ecc71', 3)
      snake.pop()
    }

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme || 'grass')

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(0, HUD_H, COLS * CELL, ROWS * CELL)

    const snake = engine.get('snake') || []
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i]
      const segSize = Math.max(CELL * 0.5, CELL - 2 - i * 0.3)
      const offset = (CELL - segSize) / 2
      const brightness = i === 0 ? '#27ae60' : '#2ecc71'
      ctx.fillStyle = brightness
      ctx.beginPath()
      ctx.roundRect(seg.x * CELL + offset, HUD_H + seg.y * CELL + offset, segSize, segSize, 6)
      ctx.fill()
    }

    if (snake.length > 0) {
      const head = snake[0]
      ctx.font = `${CELL * 0.85}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🐍', head.x * CELL + CELL / 2, HUD_H + head.y * CELL + CELL / 2)
    }

    const food = engine.get('food')
    if (food) {
      const foodObj = engine.definition?.objects?.[0]
      const sprite = getSprite(foodObj?.type || 'apple')
      const foodCx = food.x * CELL + CELL / 2
      const foodCy = HUD_H + food.y * CELL + CELL / 2

      ctx.save()
      ctx.translate(foodCx, foodCy)
      const s = 1 + Math.sin(engine.state.elapsed * 5) * 0.12
      ctx.scale(s, s)
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 12
      ctx.font = `${CELL}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sprite, 0, 0)
      ctx.shadowBlur = 0
      ctx.restore()
    }
  },
}

function placeFood(engine) {
  const snake = engine.get('snake') || []
  let x, y, attempts = 0
  do {
    x = Math.floor(Math.random() * COLS)
    y = Math.floor(Math.random() * ROWS)
    attempts++
  } while (snake.some(s => s.x === x && s.y === y) && attempts < 100)
  engine.set('food', { x, y })
}
