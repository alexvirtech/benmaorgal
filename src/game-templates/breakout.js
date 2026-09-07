import { GAME_WIDTH, GAME_HEIGHT, moveTowardsMouse } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'

const PADDLE_W = 155
const PADDLE_H = 18
const BALL_SIZE = 20
const BRICK_ROWS = 6
const BRICK_COLS = 10
const BRICK_W = (GAME_WIDTH - 40) / BRICK_COLS
const BRICK_H = 24
const HUD_H = 40

const BRICK_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6']

export const breakoutTemplate = {
  id: 'breakout',
  name: 'Breakout',
  icon: '🧱',
  description: 'Break all the bricks',
  examplePrompt: 'Make a game where I break bricks',
  suggestions: [
    { he: 'תעשה אותי מהר יותר', en: 'make the player faster', icon: '💨' },
    { he: 'יותר קשה', en: 'make it harder', icon: '⚡' },
    { he: 'תן לי 5 חיים', en: 'give me 5 lives', icon: '❤️' },
    { he: 'רקע של חלל', en: 'make the background space', icon: '🌌' },
  ],

  getDefaultDefinition() {
    return {
      template: 'breakout',
      title: 'Brick Breaker',
      theme: { background: 'night' },
      player: { type: 'paddle', size: PADDLE_W, speed: 7 },
      objects: [],
      rules: { startingLives: 5, targetScore: BRICK_ROWS * BRICK_COLS, difficulty: 'normal' },
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
      y: GAME_HEIGHT - 70,
      width: BALL_SIZE,
      height: BALL_SIZE,
      vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
      vy: -5,
      glow: true,
      glowColor: '#fff',
      glowSize: 10,
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

    moveTowardsMouse(player, input, dt, 0.18)
    if (player.x < 0) player.x = 0
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width

    ball.x += ball.vx * dt * 60
    ball.y += ball.vy * dt * 60

    engine.spawnTrail(ball.x + ball.width / 2, ball.y + ball.height / 2, '#ffffff', 2)

    if (ball.x <= 0) {
      ball.vx = Math.abs(ball.vx)
      ball.x = 0
      engine.spawnParticles(ball.x + ball.width / 2, ball.y + ball.height / 2, '#aaaaff', 3, 2)
    }
    if (ball.x + ball.width >= GAME_WIDTH) {
      ball.vx = -Math.abs(ball.vx)
      ball.x = GAME_WIDTH - ball.width
      engine.spawnParticles(ball.x + ball.width / 2, ball.y + ball.height / 2, '#aaaaff', 3, 2)
    }
    if (ball.y <= HUD_H) {
      ball.vy = Math.abs(ball.vy)
      ball.y = HUD_H
      engine.spawnParticles(ball.x + ball.width / 2, HUD_H, '#aaaaff', 3, 2)
    }

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
      engine.spawnParticles(ball.x + ball.width / 2, player.y, '#ecf0f1', 8, 2)
    }

    if (ball.y > GAME_HEIGHT + 20) {
      engine.loseLife()
      engine.screenShake(8, 0.15)
      engine.spawnParticles(ball.x + ball.width / 2, GAME_HEIGHT, '#ff4444', 14, 3)
      ball.x = GAME_WIDTH / 2 - BALL_SIZE / 2
      ball.y = GAME_HEIGHT - 70
      ball.vx = 3.5 * (Math.random() > 0.5 ? 1 : -1)
      ball.vy = -5
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
        engine.screenShake(4, 0.08)
        engine.spawnParticles(block.x + block.width / 2, block.y + block.height / 2, block.color, 16, 3)
        engine.spawnFloatingText(block.x + block.width / 2, block.y, `+${block.points || 1}`)

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
    drawBackground(ctx, engine.definition?.theme || 'night')

    for (const e of engine.entities.values()) {
      if (!e.active || !e.visible) continue
      ctx.fillStyle = e.color || '#fff'
      if (e.shape === 'circle') {
        ctx.shadowColor = '#fff'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      } else if (e.role === 'block') {
        ctx.beginPath()
        ctx.roundRect(e.x, e.y, e.width, e.height, 4)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 1
        ctx.stroke()
      } else {
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.roundRect(e.x, e.y, e.width, e.height, 4)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }
  },
}
