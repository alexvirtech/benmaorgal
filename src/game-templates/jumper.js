import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground, drawEntity } from '../game-sdk/renderer.js'
import { checkAABB } from '../game-sdk/physics.js'
import { getSprite } from '../game-data/schema.js'

const GROUND_Y = GAME_HEIGHT - 80
const GRAVITY = 1200

export const jumperTemplate = {
  id: 'jumper',
  name: 'Jumper',
  icon: '🐸',
  description: 'Jump over obstacles',
  examplePrompt: 'Make a frog jump over monsters',
  suggestions: [
    { text: 'Make me faster', icon: '💨' },
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Give me 5 lives', icon: '❤️' },
    { text: 'Make the background desert', icon: '🏜️' },
  ],

  getDefaultDefinition() {
    return {
      template: 'jumper',
      title: 'Super Jumper',
      theme: { background: 'grass' },
      player: { type: 'frog', size: 65, speed: 5 },
      objects: [
        { id: 'obstacle', role: 'hazard', type: 'cactus', speed: 4, spawnRate: 1400 },
      ],
      rules: { startingLives: 5, targetScore: 100, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    engine.addEntity({
      role: 'player',
      type: def.player.type,
      sprite: getSprite(def.player.type),
      x: 120,
      y: GROUND_Y - def.player.size,
      width: def.player.size,
      height: def.player.size,
      speed: def.player.speed,
      vy: 0,
      grounded: true,
    })
    engine.state.lives = def.rules.startingLives
    engine.set('spawnTimer', 0)
    engine.set('scoreTimer', 0)
    engine.set('gameSpeed', 1)
    engine.set('targetScore', def.rules.targetScore)
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    if ((input.actions.jump || input.pointer.clicked) && player.grounded) {
      player.vy = -580
      player.grounded = false
      engine.spawnParticles(player.x + player.width / 2, GROUND_Y, '#8B6914', 6, 2)
    }

    player.vy += GRAVITY * dt
    player.y += player.vy * dt

    if (player.y >= GROUND_Y - player.height) {
      player.y = GROUND_Y - player.height
      player.vy = 0
      player.grounded = true
    }

    const def = engine.definition
    const obs = def.objects[0] || { speed: 4, spawnRate: 1400, type: 'cactus' }
    const gameSpeed = engine.get('gameSpeed') || 1

    const timer = (engine.get('spawnTimer') || 0) + dt * 1000
    if (timer >= obs.spawnRate) {
      engine.set('spawnTimer', 0)
      const h = 45 + Math.random() * 20
      engine.addEntity({
        role: 'hazard',
        type: obs.type,
        sprite: getSprite(obs.type),
        x: GAME_WIDTH + 20,
        y: GROUND_Y - h,
        width: 50,
        height: h,
        vx: -(obs.speed * gameSpeed),
      })
    } else {
      engine.set('spawnTimer', timer)
    }

    const scoreTimer = (engine.get('scoreTimer') || 0) + dt
    if (scoreTimer >= 0.3) {
      engine.set('scoreTimer', 0)
      engine.addScore(1)
      if (engine.state.score % 20 === 0) {
        engine.set('gameSpeed', (engine.get('gameSpeed') || 1) + 0.12)
      }
    } else {
      engine.set('scoreTimer', scoreTimer)
    }

    const toRemove = []
    for (const e of engine.entities.values()) {
      if (e.role === 'player') continue
      e.x += e.vx * dt * 60
      if (e.x + e.width < -20) {
        toRemove.push(e.id)
        continue
      }
      if (checkAABB(e, player)) {
        toRemove.push(e.id)
        engine.loseLife()
        engine.spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff4444', 12, 4)
        player.y = GROUND_Y - player.height
        player.vy = 0
        player.grounded = true
      }
    }
    toRemove.forEach(id => engine.removeEntity(id))

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'grass')

    ctx.fillStyle = '#5a3a1a'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y)
    ctx.fillStyle = '#7ec850'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 6)

    for (const e of engine.entities.values()) {
      if (e.active && e.visible) drawEntity(ctx, e)
    }
  },
}
