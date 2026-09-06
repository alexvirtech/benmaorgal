import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'
import { getSprite } from '../game-data/schema.js'

export const clickerTemplate = {
  id: 'clicker',
  name: 'Clicker',
  icon: '🎯',
  description: 'Click before it disappears',
  examplePrompt: 'Make a game where I click the monster',
  suggestions: [
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Make it easier', icon: '😊' },
    { text: 'Make the background forest', icon: '🌲' },
  ],

  getDefaultDefinition() {
    return {
      template: 'clicker',
      title: 'Monster Clicker',
      theme: { background: 'forest' },
      player: { type: 'hero', size: 50, speed: 5 },
      objects: [
        { id: 'target', role: 'enemy', type: 'monster', speed: 1, spawnRate: 1500, points: 1 },
      ],
      rules: { startingLives: 5, targetScore: 50, difficulty: 'normal', gameDuration: 60 },
    }
  },

  setup(engine, def) {
    engine.state.lives = def.rules.startingLives
    engine.set('targetScore', def.rules.targetScore)
    engine.set('timeLeft', def.rules.gameDuration || 60)
    engine.set('currentTarget', null)
    engine.set('targetTimer', 0)
    engine.set('targetDuration', 2.0)
    engine.set('spawnDelay', 0.3)
    engine.set('spawnTimer', 0)
    engine.set('combo', 0)
    spawnTarget(engine)
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

    const target = engine.get('currentTarget')
    if (!target) {
      const spawnTimer = (engine.get('spawnTimer') || 0) + dt
      if (spawnTimer >= engine.get('spawnDelay')) {
        spawnTarget(engine)
        engine.set('spawnTimer', 0)
      } else {
        engine.set('spawnTimer', spawnTimer)
      }
      return
    }

    const targetTimer = (engine.get('targetTimer') || 0) + dt
    engine.set('targetTimer', targetTimer)

    if (targetTimer >= engine.get('targetDuration')) {
      engine.spawnParticles(
        target.x + target.size / 2, target.y + target.size / 2, '#888888', 8, 3
      )
      engine.set('currentTarget', null)
      engine.set('targetTimer', 0)
      engine.set('combo', 0)
      engine.loseLife()
      return
    }

    if (input.pointer.clicked) {
      const px = input.pointer.x
      const py = input.pointer.y
      if (px >= target.x && px <= target.x + target.size &&
          py >= target.y && py <= target.y + target.size) {
        const combo = (engine.get('combo') || 0) + 1
        engine.set('combo', combo)
        const points = 1 + Math.floor(combo / 5)
        engine.addScore(points)
        engine.spawnParticles(
          target.x + target.size / 2, target.y + target.size / 2, '#ffd700', 12, 4
        )
        engine.spawnFloatingText(
          target.x + target.size / 2, target.y, `+${points}`
        )
        engine.set('currentTarget', null)
        engine.set('targetTimer', 0)

        const dur = Math.max(0.6, engine.get('targetDuration') - 0.04)
        engine.set('targetDuration', dur)
      }
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'forest')

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

    const target = engine.get('currentTarget')
    if (target) {
      const targetTimer = engine.get('targetTimer') || 0
      const duration = engine.get('targetDuration') || 2
      const pct = 1 - targetTimer / duration

      ctx.save()
      const pulse = 0.85 + Math.sin(targetTimer * 8) * 0.08
      ctx.translate(target.x + target.size / 2, target.y + target.size / 2)
      ctx.scale(pulse, pulse)

      ctx.fillStyle = `rgba(255,100,100,${0.2 + pct * 0.3})`
      ctx.beginPath()
      ctx.arc(0, 0, target.size * 0.7, 0, Math.PI * 2)
      ctx.fill()

      const objDef = engine.definition?.objects?.[0]
      const sprite = getSprite(objDef?.type || 'monster')
      ctx.font = `${target.size * 0.7}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(sprite, 0, 0)

      ctx.restore()

      ctx.fillStyle = pct > 0.3 ? '#e74c3c' : '#ff0000'
      const barW = target.size
      const barH = 8
      ctx.beginPath()
      ctx.roundRect(target.x, target.y + target.size + 10, barW * pct, barH, 3)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(target.x, target.y + target.size + 10, barW, barH, 3)
      ctx.stroke()
    }
  },
}

function spawnTarget(engine) {
  const size = 70 + Math.random() * 25
  const margin = 60
  engine.set('currentTarget', {
    x: margin + Math.random() * (GAME_WIDTH - size - margin * 2),
    y: margin + Math.random() * (GAME_HEIGHT - size - margin * 2),
    size,
  })
  engine.set('targetTimer', 0)
}
