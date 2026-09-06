import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground, drawEntities } from '../game-sdk/renderer.js'
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
      player: { type: 'spaceship', size: 48, speed: 6 },
      objects: [
        { id: 'alien', role: 'enemy', type: 'alien', speed: 2, spawnRate: 1200, points: 1 },
      ],
      rules: { startingLives: 3, targetScore: 30, difficulty: 'normal' },
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

    if (input.actions.left) player.x -= player.speed * dt * 60
    if (input.actions.right) player.x += player.speed * dt * 60
    clampToBounds(player, 40)

    const fireTimer = (engine.get('fireTimer') || 0) + dt
    if (input.actions.fire && fireTimer > 0.25) {
      engine.set('fireTimer', 0)
      engine.addEntity({
        role: 'projectile',
        type: 'bullet',
        color: '#ffdd00',
        x: player.x + player.width / 2 - 3,
        y: player.y - 12,
        width: 6,
        height: 12,
        vy: -10,
      })
    } else {
      engine.set('fireTimer', fireTimer)
    }

    const def = engine.definition
    const enemyDef = def.objects.find(o => o.role === 'enemy') || def.objects[0] || { speed: 2, spawnRate: 1200, type: 'alien' }

    const timer = (engine.get('spawnTimer') || 0) + dt * 1000
    if (timer >= enemyDef.spawnRate) {
      engine.set('spawnTimer', 0)
      engine.addEntity({
        role: 'enemy',
        type: enemyDef.type,
        sprite: getSprite(enemyDef.type),
        x: Math.random() * (GAME_WIDTH - 40),
        y: -40,
        width: 38,
        height: 38,
        vy: enemyDef.speed,
        points: enemyDef.points || 1,
      })
    } else {
      engine.set('spawnTimer', timer)
    }

    const toRemove = []
    const projectiles = engine.getEntitiesByRole('projectile')
    const enemies = engine.getEntitiesByRole('enemy')
    const hazards = engine.getEntitiesByRole('hazard')

    for (const p of projectiles) {
      p.y += p.vy * dt * 60
      if (p.y < -20) { toRemove.push(p.id); continue }
      for (const e of enemies) {
        if (checkAABB(p, e)) {
          toRemove.push(p.id)
          toRemove.push(e.id)
          engine.addScore(e.points || 1)
          break
        }
      }
    }

    for (const e of enemies) {
      e.y += e.vy * dt * 60
      if (e.y > GAME_HEIGHT + 50) { toRemove.push(e.id); continue }
      if (checkAABB(e, player)) {
        toRemove.push(e.id)
        engine.loseLife()
      }
    }

    for (const h of hazards) {
      h.y += (h.vy || 3) * dt * 60
      if (h.y > GAME_HEIGHT + 50) { toRemove.push(h.id); continue }
      if (checkAABB(h, player)) {
        toRemove.push(h.id)
        engine.loseLife()
      }
    }

    new Set(toRemove).forEach(id => engine.removeEntity(id))

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'space')
    drawEntities(ctx, engine.entities)
  },
}
