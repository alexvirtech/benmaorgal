import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'
import { getSprite } from '../game-data/schema.js'

const COLS = 4
const ROWS = 3
const HOLE_W = 120
const HOLE_H = 68
const MOLE_SIZE = 82

export const whackTemplate = {
  id: 'whack',
  name: 'Whack-a-Mole',
  icon: '🔨',
  description: 'Whack the moles before they hide!',
  examplePrompt: 'Make a whack a mole game',
  suggestions: [
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Make it easier', icon: '😊' },
    { text: 'Make the background forest', icon: '🌲' },
  ],

  getDefaultDefinition() {
    return {
      template: 'whack',
      title: 'Whack-a-Mole',
      theme: { background: 'grass' },
      player: { type: 'hero', size: 50, speed: 5 },
      objects: [
        { id: 'mole', role: 'enemy', type: 'monster', points: 1 },
      ],
      rules: { startingLives: 5, targetScore: 60, difficulty: 'normal', gameDuration: 60 },
    }
  },

  setup(engine, def) {
    const holes = []
    const startX = (GAME_WIDTH - COLS * (HOLE_W + 20) + 20) / 2
    const startY = 90
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        holes.push({
          x: startX + c * (HOLE_W + 20),
          y: startY + r * (HOLE_H + 85),
          mole: null,
          timer: 0,
          cooldown: 0,
          hitAnim: 0,
        })
      }
    }
    engine.set('holes', holes)
    engine.set('spawnTimer', 0)
    engine.set('spawnInterval', 0.8)
    engine.set('moleDuration', 1.8)
    engine.set('maxMoles', 2)
    engine.set('timeLeft', def.rules.gameDuration || 60)
    engine.set('targetScore', def.rules.targetScore)
    engine.set('combo', 0)
    engine.state.lives = def.rules.startingLives
    engine.state.score = 0
  },

  update(engine, dt) {
    const input = engine.input
    let timeLeft = engine.get('timeLeft') - dt
    engine.set('timeLeft', timeLeft)

    if (timeLeft <= 0) {
      if (engine.state.score >= engine.get('targetScore')) {
        engine.win()
      } else {
        engine.lose()
      }
      return
    }

    const holes = engine.get('holes')
    const moleDuration = engine.get('moleDuration')

    if (engine.state.elapsed > 15) {
      engine.set('maxMoles', 3)
      engine.set('spawnInterval', 0.6)
      engine.set('moleDuration', Math.max(1.0, 1.8 - engine.state.elapsed * 0.008))
    }
    if (engine.state.elapsed > 30) {
      engine.set('maxMoles', 4)
      engine.set('spawnInterval', 0.45)
    }

    let activeMoles = 0
    for (const hole of holes) {
      if (hole.hitAnim > 0) hole.hitAnim = Math.max(0, hole.hitAnim - dt * 4)
      if (hole.cooldown > 0) {
        hole.cooldown -= dt
        continue
      }
      if (hole.mole) {
        hole.timer += dt
        activeMoles++
        if (hole.timer >= moleDuration) {
          hole.mole = null
          hole.timer = 0
          hole.cooldown = 0.3
          engine.set('combo', 0)
          engine.loseLife()
          engine.screenShake(8, 0.15)
        }
      }
    }

    let spawnTimer = engine.get('spawnTimer') + dt
    const maxMoles = engine.get('maxMoles')
    if (spawnTimer >= engine.get('spawnInterval') && activeMoles < maxMoles) {
      spawnTimer = 0
      const empty = holes.filter(h => !h.mole && h.cooldown <= 0)
      if (empty.length > 0) {
        const hole = empty[Math.floor(Math.random() * empty.length)]
        const objDef = engine.definition?.objects?.[0] || { type: 'monster' }
        hole.mole = objDef.type || 'monster'
        hole.timer = 0
      }
    }
    engine.set('spawnTimer', spawnTimer)

    if (input.pointer.clicked) {
      const px = input.pointer.x
      const py = input.pointer.y
      let hit = false
      for (const hole of holes) {
        if (!hole.mole) continue
        const mx = hole.x + HOLE_W / 2 - MOLE_SIZE / 2
        const my = hole.y - MOLE_SIZE * 0.6
        if (px >= mx && px <= mx + MOLE_SIZE && py >= my && py <= my + MOLE_SIZE) {
          const combo = (engine.get('combo') || 0) + 1
          engine.set('combo', combo)
          const points = 1 + Math.floor(combo / 4)
          engine.addScore(points)
          engine.screenShake(5, 0.1)
          engine.spawnParticles(hole.x + HOLE_W / 2, my + MOLE_SIZE / 2, '#ffd700', 16, 5)
          engine.spawnFloatingText(hole.x + HOLE_W / 2, my, `+${points}`)
          hole.mole = null
          hole.timer = 0
          hole.cooldown = 0.5
          hole.hitAnim = 1
          hit = true
          break
        }
      }
      if (!hit) {
        engine.set('combo', 0)
      }
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme || 'grass')

    const timeLeft = Math.max(0, engine.get('timeLeft') || 0)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, GAME_WIDTH, 40)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Score: ${engine.state.score} / ${engine.get('targetScore')}`, 12, 20)
    ctx.textAlign = 'center'
    ctx.fillText(`⏱ ${Math.ceil(timeLeft)}s`, GAME_WIDTH / 2, 20)
    ctx.textAlign = 'right'
    const combo = engine.get('combo') || 0
    if (combo > 2) ctx.fillText(`🔥 x${combo}`, GAME_WIDTH - 12, 20)

    const holes = engine.get('holes') || []
    const moleDuration = engine.get('moleDuration') || 1.8
    const elapsed = engine.state.elapsed

    for (const hole of holes) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath()
      ctx.ellipse(hole.x + HOLE_W / 2, hole.y + HOLE_H / 2, HOLE_W / 2, HOLE_H / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#3d2b1f'
      ctx.beginPath()
      ctx.ellipse(hole.x + HOLE_W / 2, hole.y + HOLE_H / 2 - 4, HOLE_W / 2 - 4, HOLE_H / 2 - 4, 0, 0, Math.PI * 2)
      ctx.fill()

      if (hole.mole) {
        const pct = 1 - hole.timer / moleDuration
        const raw = Math.min(1, hole.timer * 5)
        const popUp = raw < 1 ? 1 - Math.pow(1 - raw, 3) + Math.sin(raw * Math.PI * 2) * 0.1 * (1 - raw) : 1
        const offsetY = (1 - popUp) * MOLE_SIZE * 0.6

        ctx.save()
        ctx.beginPath()
        ctx.rect(hole.x - 5, hole.y - MOLE_SIZE, HOLE_W + 10, HOLE_H + MOLE_SIZE - 10)
        ctx.clip()

        const mx = hole.x + HOLE_W / 2
        const my = hole.y - MOLE_SIZE * 0.3 + offsetY

        const wobble = Math.sin(hole.timer * 14) * 0.08
        ctx.translate(mx, my)
        ctx.rotate(wobble)

        for (let s = 0; s < 3; s++) {
          const sa = elapsed * 3 + s * 2.1 + hole.x * 0.01
          const sr = MOLE_SIZE * 0.5
          const sx = Math.cos(sa) * sr
          const sy = Math.sin(sa) * sr * 0.5
          ctx.fillStyle = `rgba(255,215,0,${0.4 + Math.sin(sa * 2) * 0.3})`
          ctx.beginPath()
          ctx.arc(sx, sy, 2, 0, Math.PI * 2)
          ctx.fill()
        }

        const objDef = engine.definition?.objects?.[0] || { type: 'monster' }
        const sprite = getSprite(objDef.type || 'monster')
        ctx.font = `${MOLE_SIZE * 0.85}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(sprite, 0, 0)

        ctx.restore()

        ctx.fillStyle = pct > 0.3 ? '#e74c3c' : '#ff0000'
        const barW = HOLE_W * 0.7
        const barH = 5
        const barX = hole.x + (HOLE_W - barW) / 2
        const barY = hole.y + HOLE_H / 2 + 8
        ctx.beginPath()
        ctx.roundRect(barX, barY, barW * pct, barH, 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.roundRect(barX, barY, barW, barH, 2)
        ctx.stroke()
      }

      if (hole.hitAnim > 0) {
        ctx.globalAlpha = hole.hitAnim
        ctx.font = `${40 + hole.hitAnim * 20}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('💥', hole.x + HOLE_W / 2, hole.y - 20)
        ctx.globalAlpha = 1
      }
    }
  },
}
