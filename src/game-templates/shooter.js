import { GAME_WIDTH, GAME_HEIGHT, moveTowardsMouse } from '../game-sdk/engine.js'
import { drawBackground, drawEntity } from '../game-sdk/renderer.js'
import { checkAABB, clampToBounds } from '../game-sdk/physics.js'
import { getSprite } from '../game-data/schema.js'

export const shooterTemplate = {
  id: 'shooter',
  name: 'Shooter',
  icon: '🚀',
  description: 'Shoot enemies',
  examplePrompt: 'Make a spaceship shoot aliens',
  suggestions: [
    { text: 'Make me faster', icon: '💨' },
    { text: 'Add bombs', icon: '💣' },
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Give me 5 lives', icon: '❤️' },
  ],

  getDefaultDefinition() {
    return {
      template: 'shooter',
      title: 'Space Shooter',
      theme: { background: 'space' },
      player: { type: 'spaceship', size: 85, speed: 6 },
      objects: [
        { id: 'alien', role: 'enemy', type: 'alien', speed: 2, spawnRate: 1100, points: 1 },
      ],
      rules: { startingLives: 5, targetScore: 60, difficulty: 'normal' },
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
    engine.set('spawnTimer', 0)
    engine.set('fireTimer', 0)
    engine.set('targetScore', def.rules.targetScore)
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    moveTowardsMouse(player, input, dt)
    clampToBounds(player, 40)

    if (input.pointer.down || input.actions.left || input.actions.right) {
      engine.spawnTrail(player.x + player.width / 2, player.y + player.height, '#4488ff', 2)
    }

    const fireTimer = (engine.get('fireTimer') || 0) + dt
    const shouldFire = input.actions.fire || input.pointer.down
    if (shouldFire && fireTimer > 0.22) {
      engine.set('fireTimer', 0)
      engine.addEntity({
        role: 'projectile',
        type: 'bullet',
        color: '#ffdd00',
        x: player.x + player.width / 2 - 6,
        y: player.y - 18,
        width: 12,
        height: 18,
        vy: -12,
        glow: true,
        glowColor: '#ffdd00',
        glowSize: 10,
      })
      engine.spawnParticles(player.x + player.width / 2, player.y, '#ffaa00', 5, 2)
    } else {
      engine.set('fireTimer', fireTimer)
    }

    const def = engine.definition
    const enemyDef = def.objects.find(o => o.role === 'enemy') || def.objects[0] || { speed: 2, spawnRate: 1100, type: 'alien' }

    const timer = (engine.get('spawnTimer') || 0) + dt * 1000
    if (timer >= enemyDef.spawnRate) {
      engine.set('spawnTimer', 0)
      const size = 68
      engine.addEntity({
        role: 'enemy',
        type: enemyDef.type,
        sprite: getSprite(enemyDef.type),
        x: Math.random() * (GAME_WIDTH - size),
        y: -size,
        width: size,
        height: size,
        vy: enemyDef.speed,
        points: enemyDef.points || 1,
        bob: true,
        bobSpeed: 2,
        bobPhase: Math.random() * 6,
        bobAmount: 4,
        glow: true,
        glowColor: '#ff6600',
        glowSize: 8,
      })
    } else {
      engine.set('spawnTimer', timer)
    }

    const toRemove = new Set()
    const projectiles = engine.getEntitiesByRole('projectile')
    const enemies = engine.getEntitiesByRole('enemy')
    const hazards = engine.getEntitiesByRole('hazard')

    for (const p of projectiles) {
      p.y += p.vy * dt * 60
      if (p.y < -20) { toRemove.add(p.id); continue }
      for (const e of enemies) {
        if (toRemove.has(e.id)) continue
        if (checkAABB(p, e)) {
          toRemove.add(p.id)
          toRemove.add(e.id)
          engine.addScore(e.points || 1)
          engine.spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ff6600', 18, 4)
          engine.spawnFloatingText(e.x + e.width / 2, e.y, `+${e.points || 1}`)
          break
        }
      }
    }

    for (const e of enemies) {
      if (toRemove.has(e.id)) continue
      e.y += e.vy * dt * 60
      if (e.y > GAME_HEIGHT + 50) { toRemove.add(e.id); continue }
      if (checkAABB(e, player)) {
        toRemove.add(e.id)
        engine.loseLife()
        engine.screenShake(8, 0.15)
        engine.spawnParticles(player.x + player.width / 2, player.y, '#ff0000', 14, 3)
      }
    }

    for (const h of hazards) {
      h.y += (h.vy || 3) * dt * 60
      if (h.y > GAME_HEIGHT + 50) { toRemove.add(h.id); continue }
      if (checkAABB(h, player)) {
        toRemove.add(h.id)
        engine.loseLife()
        engine.screenShake(8, 0.15)
        engine.spawnParticles(player.x + player.width / 2, player.y, '#ff0000', 14, 3)
      }
    }

    toRemove.forEach(id => engine.removeEntity(id))

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'space')
    const t = engine.state.elapsed
    for (const e of engine.entities.values()) {
      if (!e.active || !e.visible) continue
      if (e.role === 'projectile') {
        ctx.fillStyle = e.color || '#ffdd00'
        ctx.shadowColor = '#ffdd00'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.roundRect(e.x, e.y, e.width, e.height, 3)
        ctx.fill()
        ctx.shadowBlur = 0
      } else {
        drawEntity(ctx, e, t)
      }
    }
  },
}
