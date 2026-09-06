import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'

const PADDLE_W = 100
const PADDLE_H = 12
const BALL_SIZE = 12
const BRICK_ROWS = 5
const BRICK_COLS = 10
const BRICK_W = (GAME_WIDTH - 40) / BRICK_COLS
const BRICK_H = 22
const HUD_H = 40

const BRICK_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db']

export const breakoutTemplate = {
  id: 'breakout',
  name: 'Breakout',
  icon: '🧱',
  description: 'Break all the bricks',
  examplePrompt: 'Make a game where I break bricks',
  suggestions: [
    { text: 'Make me faster', icon: '💨' },
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Give me 5 lives', icon: '❤️' },
    { text: 'Make the background space', icon: '🌌' },
  ],

  getDefaultDefinition() {
    return {
      template: 'breakout',
      title: 'Brick Breaker',
      theme: { background: 'night' },
      player: { type: 'paddle', size: PADDLE_W, speed: 7 },
      objects: [],
      rules: { startingLives: 3, targetScore: BRICK_ROWS * BRICK_COLS, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    engine.addEntity({
      role: 'player',
      type: 'paddle',
      color: '#ecf0f1',
      x: GAME_WIDTH / 2 - PADDLE_W / 2,
      y: GAME_HEIGHT - 40,
      width: PADDLE_W,
      height: PADDLE_H,
      speed: def.player.speed,
    })

    engine.addEntity({
      role: 'ball',
      type: 'ball',
      color: '#fff',
      shape: 'circle',
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT - 60,
      width: BALL_SIZE,
      height: BALL_SIZE,
      vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
      vy: -4.5,
    })

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        engine.addEntity({
          role: 'block',
          type: 'brick',
          color: BRICK_COLORS[row % BRICK_COLORS.length],
          x: 20 + col * BRICK_W,
          y: HUD_H + 20 + row * (BRICK_H + 4),
          width: BRICK_W - 4,
          height: BRICK_H,
          points: BRICK_ROWS - row,
        })
      }
    }

    engine.state.lives = def.rules.startingLives
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    const balls = engine.getEntitiesByRole('ball')
    if (!player || balls.length === 0) return
    const ball = balls[0]

    if (input.actions.left) player.x -= player.speed * dt * 60
    if (input.actions.right) player.x += player.speed * dt * 60
    if (player.x < 0) player.x = 0
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width

    ball.x += ball.vx * dt * 60
    ball.y += ball.vy * dt * 60

    if (ball.x <= 0) { ball.vx = Math.abs(ball.vx); ball.x = 0 }
    if (ball.x + ball.width >= GAME_WIDTH) { ball.vx = -Math.abs(ball.vx); ball.x = GAME_WIDTH - ball.width }
    if (ball.y <= HUD_H) { ball.vy = Math.abs(ball.vy); ball.y = HUD_H }

    if (
      ball.vy > 0 &&
      ball.y + ball.height >= player.y &&
      ball.x + ball.width > player.x &&
      ball.x < player.x + player.width
    ) {
      ball.vy = -Math.abs(ball.vy)
      ball.y = player.y - ball.height
      const hit = (ball.x + ball.width / 2 - player.x) / player.width
      ball.vx = (hit - 0.5) * 8
    }

    if (ball.y > GAME_HEIGHT + 20) {
      engine.loseLife()
      ball.x = GAME_WIDTH / 2 - BALL_SIZE / 2
      ball.y = GAME_HEIGHT - 60
      ball.vx = 3.5 * (Math.random() > 0.5 ? 1 : -1)
      ball.vy = -4.5
    }

    const blocks = engine.getEntitiesByRole('block')
    for (const block of blocks) {
      if (
        ball.x + ball.width > block.x &&
        ball.x < block.x + block.width &&
        ball.y + ball.height > block.y &&
        ball.y < block.y + block.height
      ) {
        engine.removeEntity(block.id)
        engine.addScore(block.points || 1)

        const overlapLeft = ball.x + ball.width - block.x
        const overlapRight = block.x + block.width - ball.x
        const overlapTop = ball.y + ball.height - block.y
        const overlapBottom = block.y + block.height - ball.y
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
          ball.vy *= -1
        } else {
          ball.vx *= -1
        }
        break
      }
    }

    if (engine.getEntitiesByRole('block').length === 0) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'night')

    for (const e of engine.entities.values()) {
      if (!e.active || !e.visible) continue
      ctx.fillStyle = e.color || '#fff'
      if (e.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (e.role === 'block') {
        ctx.beginPath()
        ctx.roundRect(e.x, e.y, e.width, e.height, 4)
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
        ctx.lineWidth = 1
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.roundRect(e.x, e.y, e.width, e.height, 4)
        ctx.fill()
      }
    }
  },
}
