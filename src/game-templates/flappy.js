import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'
import { getSprite } from '../game-data/schema.js'

const GRAVITY = 900
const FLAP_POWER = -320
const GAP_SIZE = 190
const PIPE_W = 65
const PIPE_SPEED = 3.2

export const flappyTemplate = {
  id: 'flappy',
  name: 'Flappy',
  icon: '🐦',
  description: 'Tap to fly through the gaps!',
  examplePrompt: 'Make a flappy bird game',
  suggestions: [
    { he: 'תעשה אותי מהר יותר', en: 'make the player faster', icon: '💨' },
    { he: 'יותר קשה', en: 'make it harder', icon: '⚡' },
    { he: 'תן לי 5 חיים', en: 'give me 5 lives', icon: '❤️' },
    { he: 'רקע של שמיים', en: 'make the background sky', icon: '☁️' },
  ],

  getDefaultDefinition() {
    return {
      template: 'flappy',
      title: 'Flappy Bird',
      theme: { background: 'sky' },
      player: { type: 'bird', size: 68, speed: 5 },
      objects: [],
      rules: { startingLives: 3, targetScore: 50, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    const size = def.player.size || 68
    engine.addEntity({
      role: 'player',
      type: def.player.type,
      sprite: getSprite(def.player.type || 'bird'),
      x: 150,
      y: GAME_HEIGHT / 2 - size / 2,
      width: size,
      height: size,
      speed: def.player.speed,
      vy: 0,
      angle: 0,
    })
    engine.state.lives = def.rules.startingLives
    engine.set('pipeTimer', 0)
    engine.set('pipeInterval', 1.8)
    engine.set('targetScore', def.rules.targetScore)
    engine.set('gameSpeed', 1)
    engine.set('invincible', 0)
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    if (input.actions.jump || input.pointer.clicked) {
      player.vy = FLAP_POWER
      engine.spawnParticles(player.x, player.y + player.height / 2, '#ffffff', 8, 2.5)
    }

    player.vy += GRAVITY * dt
    player.y += player.vy * dt
    player.angle = Math.max(-0.4, Math.min(0.6, player.vy * 0.003))

    if (player.y < 40) {
      player.y = 40
      player.vy = 0
    }

    engine.spawnTrail(player.x, player.y + player.height / 2, '#ffdd66', 2)

    let inv = engine.get('invincible')
    if (inv > 0) engine.set('invincible', inv - dt)

    if (player.y + player.height > GAME_HEIGHT - 40) {
      player.y = GAME_HEIGHT - 40 - player.height
      player.vy = FLAP_POWER * 0.5
      if (inv <= 0) {
        engine.loseLife()
        engine.set('invincible', 1.0)
        engine.screenShake(6, 0.1)
        engine.spawnParticles(player.x + player.width / 2, player.y + player.height, '#ff4444', 14, 4)
      }
    }

    const gameSpeed = engine.get('gameSpeed') || 1
    let pipeTimer = engine.get('pipeTimer') + dt
    const pipeInterval = engine.get('pipeInterval')
    if (pipeTimer >= pipeInterval) {
      pipeTimer -= pipeInterval
      const gapY = 100 + Math.random() * (GAME_HEIGHT - 240 - GAP_SIZE)
      engine.addEntity({
        role: 'hazard',
        type: 'pipe_top',
        x: GAME_WIDTH + 10,
        y: 40,
        width: PIPE_W,
        height: gapY - 40,
        vx: -(PIPE_SPEED * gameSpeed),
        scored: false,
      })
      engine.addEntity({
        role: 'hazard',
        type: 'pipe_bottom',
        x: GAME_WIDTH + 10,
        y: gapY + GAP_SIZE,
        width: PIPE_W,
        height: GAME_HEIGHT - 40 - (gapY + GAP_SIZE),
        vx: -(PIPE_SPEED * gameSpeed),
      })
    }
    engine.set('pipeTimer', pipeTimer)

    inv = engine.get('invincible')
    const toRemove = []
    for (const e of engine.entities.values()) {
      if (e.role !== 'hazard') continue
      e.x += e.vx * dt * 60
      if (e.x + e.width < -10) {
        toRemove.push(e.id)
        continue
      }

      if (e.type === 'pipe_top' && !e.scored && e.x + e.width < player.x) {
        e.scored = true
        engine.addScore(1)
        engine.spawnFloatingText(player.x + player.width, player.y, '+1')
        if (engine.state.score % 10 === 0) {
          engine.set('gameSpeed', (engine.get('gameSpeed') || 1) + 0.1)
        }
      }

      if (inv <= 0 &&
          player.x + player.width * 0.7 > e.x + 4 &&
          player.x + player.width * 0.3 < e.x + e.width - 4 &&
          player.y + player.height * 0.7 > e.y + 4 &&
          player.y + player.height * 0.3 < e.y + e.height - 4) {
        engine.loseLife()
        engine.set('invincible', 1.0)
        engine.screenShake(8, 0.15)
        engine.spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff4444', 18, 5)
        player.vy = FLAP_POWER * 0.6
      }
    }
    toRemove.forEach(id => engine.removeEntity(id))

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme || 'sky')

    ctx.fillStyle = '#5a3a1a'
    ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40)
    ctx.fillStyle = '#7ec850'
    ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 8)

    for (const e of engine.entities.values()) {
      if (!e.active || !e.visible) continue
      if (e.role === 'hazard') {
        const grad = ctx.createLinearGradient(e.x, 0, e.x + e.width, 0)
        grad.addColorStop(0, '#2ecc71')
        grad.addColorStop(0.5, '#27ae60')
        grad.addColorStop(1, '#229954')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(e.x, e.y, e.width, e.height, 4)
        ctx.fill()
        ctx.strokeStyle = '#1a7a40'
        ctx.lineWidth = 2
        ctx.stroke()

        if (e.type === 'pipe_top') {
          ctx.fillStyle = '#2ecc71'
          ctx.beginPath()
          ctx.roundRect(e.x - 4, e.y + e.height - 20, e.width + 8, 20, 3)
          ctx.fill()
          ctx.stroke()
        } else {
          ctx.fillStyle = '#2ecc71'
          ctx.beginPath()
          ctx.roundRect(e.x - 4, e.y, e.width + 8, 20, 3)
          ctx.fill()
          ctx.stroke()
        }
      }
    }

    const player = engine.getPlayer()
    if (player) {
      const inv = engine.get('invincible') || 0
      if (inv > 0 && Math.floor(inv * 10) % 2 === 0) {
        ctx.globalAlpha = 0.4
      }
      ctx.save()
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2)
      ctx.rotate(player.angle || 0)
      const wingFlap = 1 + Math.sin(engine.state.elapsed * 12) * 0.06
      ctx.scale(wingFlap, 1 / wingFlap)
      const sprite = getSprite(engine.definition?.player?.type || 'bird')
      ctx.font = `${player.width * 0.85}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sprite, 0, 0)
      ctx.restore()
      ctx.globalAlpha = 1
    }
  },
}
