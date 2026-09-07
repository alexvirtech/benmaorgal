import { GAME_WIDTH, GAME_HEIGHT, moveTowardsMouse } from '../game-sdk/engine.js'
import { checkAABB } from '../game-sdk/physics.js'
import { getSprite } from '../game-data/schema.js'

const ROAD_LEFT = 150
const ROAD_RIGHT = GAME_WIDTH - 150
const LANE_W = (ROAD_RIGHT - ROAD_LEFT) / 3

function drawF1Car(ctx, cx, cy, w, h, angle, color) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  const hw = w / 2
  const hh = h / 2

  ctx.fillStyle = '#222'
  ctx.fillRect(-hw * 0.95, -hh * 0.85, hw * 0.35, hh * 0.35)
  ctx.fillRect(hw * 0.6, -hh * 0.85, hw * 0.35, hh * 0.35)
  ctx.fillRect(-hw * 0.95, hh * 0.55, hw * 0.35, hh * 0.35)
  ctx.fillRect(hw * 0.6, hh * 0.55, hw * 0.35, hh * 0.35)

  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.85, -hh * 0.88, hw * 0.25, hh * 0.4, 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(hw * 0.6, -hh * 0.88, hw * 0.25, hh * 0.4, 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(-hw * 0.85, hh * 0.52, hw * 0.25, hh * 0.4, 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(hw * 0.6, hh * 0.52, hw * 0.25, hh * 0.4, 2)
  ctx.fill()

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -hh)
  ctx.lineTo(hw * 0.45, -hh * 0.65)
  ctx.lineTo(hw * 0.5, hh * 0.3)
  ctx.lineTo(hw * 0.55, hh * 0.7)
  ctx.lineTo(hw * 0.45, hh)
  ctx.lineTo(-hw * 0.45, hh)
  ctx.lineTo(-hw * 0.55, hh * 0.7)
  ctx.lineTo(-hw * 0.5, hh * 0.3)
  ctx.lineTo(-hw * 0.45, -hh * 0.65)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 1
  ctx.stroke()

  const darker = shadeColor(color, -30)
  ctx.fillStyle = darker
  ctx.beginPath()
  ctx.moveTo(-hw * 0.15, -hh * 0.95)
  ctx.lineTo(hw * 0.15, -hh * 0.95)
  ctx.lineTo(hw * 0.1, -hh * 0.55)
  ctx.lineTo(-hw * 0.1, -hh * 0.55)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.2, -hh * 0.15, hw * 0.4, hh * 0.3, 3)
  ctx.fill()

  ctx.fillStyle = 'rgba(100,180,255,0.5)'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.15, -hh * 0.1, hw * 0.3, hh * 0.15, 2)
  ctx.fill()

  ctx.fillStyle = darker
  ctx.beginPath()
  ctx.moveTo(-hw * 0.35, hh * 0.5)
  ctx.lineTo(hw * 0.35, hh * 0.5)
  ctx.lineTo(hw * 0.5, hh * 0.85)
  ctx.lineTo(-hw * 0.5, hh * 0.85)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-hw * 0.7, -hh * 0.7)
  ctx.lineTo(hw * 0.7, -hh * 0.7)
  ctx.lineTo(hw * 0.6, -hh * 0.6)
  ctx.lineTo(-hw * 0.6, -hh * 0.6)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-hw * 0.55, hh * 0.9)
  ctx.lineTo(hw * 0.55, hh * 0.9)
  ctx.lineTo(hw * 0.65, hh)
  ctx.lineTo(-hw * 0.65, hh)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

function drawTrafficCar(ctx, cx, cy, w, h, color) {
  ctx.save()
  ctx.translate(cx, cy)

  const hw = w / 2
  const hh = h / 2

  ctx.fillStyle = '#222'
  ctx.fillRect(-hw * 0.9, -hh * 0.8, hw * 0.3, hh * 0.3)
  ctx.fillRect(hw * 0.6, -hh * 0.8, hw * 0.3, hh * 0.3)
  ctx.fillRect(-hw * 0.9, hh * 0.5, hw * 0.3, hh * 0.3)
  ctx.fillRect(hw * 0.6, hh * 0.5, hw * 0.3, hh * 0.3)

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(-hw * 0.5, -hh, hw, hh * 2, [hw * 0.4, hw * 0.4, hw * 0.15, hw * 0.15])
  ctx.fill()

  ctx.fillStyle = 'rgba(100,180,255,0.4)'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.3, -hh * 0.6, hw * 0.6, hh * 0.35, 3)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,100,100,0.5)'
  ctx.beginPath()
  ctx.roundRect(-hw * 0.3, hh * 0.55, hw * 0.25, hh * 0.15, 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(hw * 0.05, hh * 0.55, hw * 0.25, hh * 0.15, 2)
  ctx.fill()

  ctx.restore()
}

function shadeColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)
}

const TRAFFIC_COLORS = ['#3498db', '#e67e22', '#9b59b6', '#1abc9c', '#e74c3c', '#f39c12']

export const racerTemplate = {
  id: 'racer',
  name: 'Racer',
  icon: '🏎️',
  description: 'Dodge traffic',
  examplePrompt: 'Make a car racing game',
  suggestions: [
    { he: 'תעשה אותי מהר יותר', en: 'make the player faster', icon: '💨' },
    { he: 'יותר קשה', en: 'make it harder', icon: '⚡' },
    { he: 'תן לי 5 חיים', en: 'give me 5 lives', icon: '❤️' },
    { he: 'רקע של לילה', en: 'make the background night', icon: '🌙' },
  ],

  getDefaultDefinition() {
    return {
      template: 'racer',
      title: 'Road Racer',
      theme: { background: 'city' },
      player: { type: 'car', size: 72, speed: 6 },
      objects: [
        { id: 'traffic', role: 'hazard', type: 'barrel', speed: 3, spawnRate: 900 },
      ],
      rules: { startingLives: 5, targetScore: 100, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    const size = def.player.size || 72
    engine.addEntity({
      role: 'player',
      type: 'f1car',
      x: GAME_WIDTH / 2 - size / 2,
      y: GAME_HEIGHT - size * 1.4 - 30,
      width: size,
      height: size * 1.4,
      speed: def.player.speed,
      angle: 0,
      prevX: GAME_WIDTH / 2 - size / 2,
    })
    engine.state.lives = def.rules.startingLives
    engine.set('spawnTimer', 0)
    engine.set('scoreTimer', 0)
    engine.set('roadOffset', 0)
    engine.set('gameSpeed', 1)
    engine.set('targetScore', def.rules.targetScore)
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    const prevX = player.prevX || player.x
    moveTowardsMouse(player, input, dt, 0.15)
    if (player.x < ROAD_LEFT + 5) player.x = ROAD_LEFT + 5
    if (player.x + player.width > ROAD_RIGHT - 5) player.x = ROAD_RIGHT - player.width - 5

    const dx = player.x - prevX
    const targetAngle = Math.max(-0.35, Math.min(0.35, dx * 0.08))
    player.angle = player.angle * 0.85 + targetAngle * 0.15
    player.prevX = player.x

    engine.spawnTrail(player.x + player.width * 0.25, player.y + player.height, '#ff4400', 3)
    engine.spawnTrail(player.x + player.width * 0.75, player.y + player.height, '#ff4400', 3)

    const gameSpeed = engine.get('gameSpeed') || 1
    engine.set('roadOffset', (engine.get('roadOffset') + dt * 200 * gameSpeed) % 40)

    const def = engine.definition
    const obs = def.objects[0] || { speed: 3, spawnRate: 900, type: 'barrel' }

    const timer = (engine.get('spawnTimer') || 0) + dt * 1000
    if (timer >= obs.spawnRate) {
      engine.set('spawnTimer', 0)
      const lane = Math.floor(Math.random() * 3)
      const w = 54
      const h = 74
      engine.addEntity({
        role: 'hazard',
        type: 'traffic',
        carColor: TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)],
        x: ROAD_LEFT + lane * LANE_W + (LANE_W - w) / 2,
        y: -h - 10,
        width: w,
        height: h,
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
        engine.set('gameSpeed', (engine.get('gameSpeed') || 1) + 0.12)
      }
    } else {
      engine.set('scoreTimer', scoreTimer)
    }

    const toRemove = []
    for (const e of engine.entities.values()) {
      if (e.role === 'player') continue
      e.y += e.vy * dt * 60
      if (e.y > GAME_HEIGHT + 70) {
        toRemove.push(e.id)
        continue
      }
      if (checkAABB(e, player)) {
        toRemove.push(e.id)
        engine.loseLife()
        engine.screenShake(10, 0.2)
        engine.spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ff4400', 20, 5)
        engine.spawnParticles(player.x + player.width / 2, player.y, '#ff0000', 14, 4)
      }
    }
    toRemove.forEach(id => engine.removeEntity(id))

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    const bg = engine.definition?.theme?.background || 'city'
    const isNight = bg === 'night'

    ctx.fillStyle = isNight ? '#1a1a2e' : '#4a7c30'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    if (!isNight) {
      ctx.fillStyle = '#3d6b20'
      for (let y = -20; y < GAME_HEIGHT; y += 80) {
        ctx.fillRect(20, y + ((engine.get('roadOffset') || 0) * 2) % 80, 8, 30)
        ctx.fillRect(GAME_WIDTH - 28, y + ((engine.get('roadOffset') || 0) * 2 + 40) % 80, 8, 30)
      }
    }

    ctx.fillStyle = isNight ? '#333' : '#555'
    ctx.fillRect(ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, GAME_HEIGHT)

    ctx.fillStyle = isNight ? '#ff4444' : '#cc0000'
    for (let y = 0; y < GAME_HEIGHT; y += 30) {
      const stripe = Math.floor((y + (engine.get('roadOffset') || 0) * 2) / 15) % 2
      ctx.fillStyle = stripe ? (isNight ? '#ff4444' : '#cc0000') : '#eee'
      ctx.fillRect(ROAD_LEFT - 8, y, 8, 15)
      ctx.fillRect(ROAD_RIGHT, y, 8, 15)
    }

    ctx.fillStyle = '#eee'
    ctx.fillRect(ROAD_LEFT, 0, 3, GAME_HEIGHT)
    ctx.fillRect(ROAD_RIGHT - 3, 0, 3, GAME_HEIGHT)

    const offset = engine.get('roadOffset') || 0
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
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

    const gameSpeed = engine.get('gameSpeed') || 1
    if (gameSpeed > 1.3) {
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.3, (gameSpeed - 1.3) * 0.3)})`
      ctx.lineWidth = 1.5
      const speedOffset = (engine.state.elapsed * 600 * gameSpeed) % GAME_HEIGHT
      for (let i = 0; i < 6; i++) {
        const lx = ROAD_LEFT + 20 + i * ((ROAD_RIGHT - ROAD_LEFT - 40) / 5)
        const ly = ((speedOffset + i * 110) % (GAME_HEIGHT + 60)) - 30
        ctx.beginPath()
        ctx.moveTo(lx, ly)
        ctx.lineTo(lx, ly + 25 + gameSpeed * 8)
        ctx.stroke()
      }
    }

    for (const e of engine.entities.values()) {
      if (!e.active || !e.visible) continue
      if (e.role === 'player') {
        drawF1Car(ctx, e.x + e.width / 2, e.y + e.height / 2, e.width, e.height, e.angle || 0, '#e00000')
      } else if (e.type === 'traffic') {
        drawTrafficCar(ctx, e.x + e.width / 2, e.y + e.height / 2, e.width, e.height, e.carColor || '#3498db')
      } else if (e.sprite) {
        ctx.font = `${Math.max(e.width, e.height) * 0.85}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(e.sprite, e.x + e.width / 2, e.y + e.height / 2)
      }
    }
  },
}
