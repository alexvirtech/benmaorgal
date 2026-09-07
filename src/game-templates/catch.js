import { GAME_WIDTH, GAME_HEIGHT, moveTowardsMouse } from '../game-sdk/engine.js'
import { drawBackground, drawEntity } from '../game-sdk/renderer.js'
import { checkAABB, clampToBounds } from '../game-sdk/physics.js'
import { getSprite } from '../game-data/schema.js'

export const catchTemplate = {
  id: 'catch',
  name: 'Catch',
  icon: '⭐',
  description: 'Catch falling objects',
  examplePrompt: 'Make a cat catch stars',
  suggestions: [
    { he: 'תעשה אותי מהר יותר', en: 'make the player faster', icon: '💨' },
    { he: 'תוסיף פצצות', en: 'add bombs', icon: '💣' },
    { he: 'תן לי 5 חיים', en: 'give me 5 lives', icon: '❤️' },
    { he: 'רקע של חלל', en: 'make the background space', icon: '🌌' },
  ],

  getDefaultDefinition() {
    return {
      template: 'catch',
      title: 'Star Catcher',
      theme: { background: 'sky' },
      player: { type: 'cat', size: 90, speed: 6 },
      objects: [
        { id: 'star', role: 'collectible', type: 'star', speed: 3, spawnRate: 900, points: 1 },
      ],
      rules: { startingLives: 5, targetScore: 50, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    engine.addEntity({
      role: 'player',
      type: def.player.type,
      sprite: getSprite(def.player.type),
      x: GAME_WIDTH / 2 - def.player.size / 2,
      y: GAME_HEIGHT - def.player.size - 10,
      width: def.player.size,
      height: def.player.size,
      speed: def.player.speed,
    })
    engine.state.lives = def.rules.startingLives
    for (const obj of def.objects) {
      engine.set(`timer_${obj.id}`, 0)
    }
    engine.set('targetScore', def.rules.targetScore)
    engine.set('sparkleTimer', 0)
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    moveTowardsMouse(player, input, dt)
    clampToBounds(player, 40)

    if (input.pointer.down || input.actions.left || input.actions.right) {
      engine.spawnTrail(player.x + player.width / 2, player.y + player.height, '#ffaa44', 2)
    }

    const def = engine.definition
    for (const obj of def.objects) {
      const timerKey = `timer_${obj.id}`
      const timer = (engine.get(timerKey) || 0) + dt * 1000
      if (timer >= obj.spawnRate) {
        engine.set(timerKey, 0)
        const size = 65
        const isHazard = obj.role === 'hazard'
        engine.addEntity({
          role: obj.role,
          type: obj.type,
          sprite: getSprite(obj.type),
          x: Math.random() * (GAME_WIDTH - size),
          y: -size,
          width: size,
          height: size,
          vy: obj.speed + Math.random() * 0.5,
          points: obj.points || 1,
          bob: true,
          bobPhase: Math.random() * 6,
          bobAmount: isHazard ? 3 : 5,
          glow: !isHazard,
          glowColor: '#ffd700',
          glowSize: 10,
          spin: isHazard,
          spinSpeed: isHazard ? 3 : 0,
        })
      } else {
        engine.set(timerKey, timer)
      }
    }

    const sparkleTimer = (engine.get('sparkleTimer') || 0) + dt
    if (sparkleTimer >= 0.3) {
      engine.set('sparkleTimer', 0)
      const collectibles = engine.getEntitiesByRole('collectible')
      if (collectibles.length > 0) {
        const c = collectibles[Math.floor(Math.random() * collectibles.length)]
        engine.spawnParticles(c.x + c.width / 2, c.y + c.height / 2, '#ffd700', 2, 1)
      }
    } else {
      engine.set('sparkleTimer', sparkleTimer)
    }

    const toRemove = []
    for (const e of engine.entities.values()) {
      if (e.role === 'player') continue
      e.y += e.vy * dt * 60
      if (e.y > GAME_HEIGHT + 50) {
        toRemove.push(e.id)
        if (e.role === 'collectible') {
          engine.loseLife()
          engine.spawnParticles(e.x + e.width / 2, GAME_HEIGHT, '#ff4444', 8, 2)
        }
        continue
      }
      if (checkAABB(e, player)) {
        toRemove.push(e.id)
        if (e.role === 'collectible') {
          engine.addScore(e.points || 1)
          engine.spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffd700', 14, 3)
          engine.spawnFloatingText(e.x + e.width / 2, e.y, `+${e.points || 1}`)
        } else if (e.role === 'hazard') {
          engine.loseLife()
          engine.screenShake(8, 0.15)
          engine.spawnParticles(player.x + player.width / 2, player.y, '#ff0000', 16, 4)
        }
      }
    }
    toRemove.forEach(id => engine.removeEntity(id))

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme || 'sky')
    const t = engine.state.elapsed
    for (const e of engine.entities.values()) {
      if (e.active && e.visible) drawEntity(ctx, e, t)
    }
  },
}
