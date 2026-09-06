import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { checkAABB } from '../game-sdk/physics.js'
import { getSprite } from '../game-data/schema.js'

const ROAD_LEFT = 150
const ROAD_RIGHT = GAME_WIDTH - 150
const LANE_W = (ROAD_RIGHT - ROAD_LEFT) / 3

export const racerTemplate = {
  id: 'racer',
  name: 'Racer',
  icon: '🏎️',
  description: 'Dodge traffic',
  examplePrompt: 'Make a car racing game',
  suggestions: [
    { text: 'Make me faster', icon: '💨' },
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Give me 5 lives', icon: '❤️' },
    { text: 'Make the background night', icon: '🌙' },
  ],

  getDefaultDefinition() {
    return {
      template: 'racer',
      title: 'Road Racer',
      theme: { background: 'city' },
      player: { type: 'car', size: 45, speed: 6 },
      objects: [
        { id: 'traffic', role: 'hazard', type: 'barrel', speed: 3, spawnRate: 1000 },
      ],
      rules: { startingLives: 3, targetScore: 50, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    engine.addEntity({
      role: 'player',
      type: def.player.type,
      sprite: getSprite(def.player.type),
      x: GAME_WIDTH / 2 - def.player.size / 2,
      y: GAME_HEIGHT - def.player.size - 30,
      width: def.player.size,
      height: def.player.size,
      speed: def.player.speed,
    })
    engine.state.lives = def.rules.startingLives
    engine.set('spawnTimer', 0)
    engine.set('scoreTimer', 0)
    engine.set('roadOffset', 0)
    engine.set('gameSpeed', 1)
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    if (input.actions.left) player.x -= player.speed * dt * 60
    if (input.actions.right) player.x += player.speed * dt * 60
    if (player.x < ROAD_LEFT + 5) player.x = ROAD_LEFT + 5
    if (player.x + player.width > ROAD_RIGHT - 5) player.x = ROAD_RIGHT - player.width - 5

    const gameSpeed = engine.get('gameSpeed') || 1
    engine.set('roadOffset', (engine.get('roadOffset') + dt * 200 * gameSpeed) % 40)

    const def = engine.definition
    const obs = def.objects[0] || { speed: 3, spawnRate: 1000, type: 'barrel' }

    const timer = (engine.get('spawnTimer') || 0) + dt * 1000
    if (timer >= obs.spawnRate) {
      engine.set('spawnTimer', 0)
      const lane = Math.floor(Math.random() * 3)
      engine.addEntity({
        role: 'hazard',
        type: obs.type,
        sprite: getSprite(obs.type),
        x: ROAD_LEFT + lane * LANE_W + (LANE_W - 36) / 2,
        y: -50,
        width: 36,
        height: 40,
        vy: obs.speed * gameSpeed,
      })
    } else {
      engine.set('spawnTimer', timer)
    }

    const scoreTimer = (engine.get('scoreTimer') || 0) + dt
    if (scoreTimer >= 0.4) {
      engine.set('scoreTimer', 0)
      engine.addScore(1)
      if (engine.state.score % 15 === 0) {
        engine.set('gameSpeed', (engine.get('gameSpeed') || 1) + 0.15)
      }
    } else {
      engine.set('scoreTimer', scoreTimer)
    }

    const toRemove = []
    for (const e of engine.entities.values()) {
      if (e.role === 'player') continue
      e.y += e.vy * dt * 60
      if (e.y > GAME_HEIGHT + 50) {
        toRemove.push(e.id)
        continue
      }
      if (checkAABB(e, player)) {
        toRemove.push(e.id)
        engine.loseLife()
      }
    }
    toRemove.forEach(id => engine.removeEntity(id))

    if (engine.state.score >= (def.rules?.targetScore || 50)) {
      engine.win()
    }
  },

  render(engine, ctx) {
    const bg = engine.definition?.theme?.background || 'city'
    const isNight = bg === 'night'
    ctx.fillStyle = isNight ? '#1a1a2e' : '#4a7c30'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    ctx.fillStyle = '#555'
    ctx.fillRect(ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, GAME_HEIGHT)

    ctx.fillStyle = '#eee'
    ctx.fillRect(ROAD_LEFT, 0, 4, GAME_HEIGHT)
    ctx.fillRect(ROAD_RIGHT - 4, 0, 4, GAME_HEIGHT)

    const offset = engine.get('roadOffset') || 0
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.setLineDash([20, 20])
    ctx.lineDashOffset = -offset
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(ROAD_LEFT + i * LANE_W, 0)
      ctx.lineTo(ROAD_LEFT + i * LANE_W, GAME_HEIGHT)
      ctx.stroke()
    }
    ctx.setLineDash([])

    for (const e of engine.entities.values()) {
      if (!e.active || !e.visible) continue
      if (e.sprite) {
        ctx.font = `${Math.max(e.width, e.height) * 0.85}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(e.sprite, e.x + e.width / 2, e.y + e.height / 2)
      } else if (e.color) {
        ctx.fillStyle = e.color
        ctx.fillRect(e.x, e.y, e.width, e.height)
      }
    }
  },
}
