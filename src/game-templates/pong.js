import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'

const PADDLE_W = 120
const PADDLE_H = 14
const BALL_SIZE = 14
const HUD_H = 40

export const pongTemplate = {
  id: 'pong',
  name: 'Pong',
  icon: '🏓',
  description: 'Classic paddle & ball',
  examplePrompt: 'Make Pong',
  suggestions: [
    { text: 'Make me faster', icon: '💨' },
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Give me 5 lives', icon: '❤️' },
    { text: 'Make the background night', icon: '🌙' },
  ],

  getDefaultDefinition() {
    return {
      template: 'pong',
      title: 'Super Pong',
      theme: { background: 'night' },
      player: { type: 'paddle', size: PADDLE_W, speed: 7 },
      objects: [],
      rules: { startingLives: 5, targetScore: 15, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    engine.addEntity({
      role: 'player',
      type: 'paddle',
      color: '#fff',
      x: GAME_WIDTH / 2 - PADDLE_W / 2,
      y: GAME_HEIGHT - 30,
      width: PADDLE_W,
      height: PADDLE_H,
      speed: def.player.speed,
    })

    engine.addEntity({
      role: 'ball',
      type: 'ball',
      color: '#ffd700',
      shape: 'circle',
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT / 2,
      width: BALL_SIZE,
      height: BALL_SIZE,
      vx: 4 * (Math.random() > 0.5 ? 1 : -1),
      vy: 4,
    })

    engine.state.lives = def.rules.startingLives
    engine.set('targetScore', def.rules.targetScore)
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
      ball.vx = (hit - 0.5) * 10
      engine.addScore(1)
    }

    if (ball.y > GAME_HEIGHT + 20) {
      engine.loseLife()
      ball.x = GAME_WIDTH / 2 - BALL_SIZE / 2
      ball.y = GAME_HEIGHT / 2
      ball.vx = 4 * (Math.random() > 0.5 ? 1 : -1)
      ball.vy = 4
    }

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'night')

    ctx.setLineDash([8, 8])
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(GAME_WIDTH / 2, HUD_H)
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    for (const e of engine.entities.values()) {
      if (!e.active || !e.visible) continue
      ctx.fillStyle = e.color || '#fff'
      if (e.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.roundRect(e.x, e.y, e.width, e.height, 4)
        ctx.fill()
      }
    }
  },
}
