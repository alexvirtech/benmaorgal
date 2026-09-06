import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground, drawEntities } from '../game-sdk/renderer.js'
import { checkAABB, clampToBounds } from '../game-sdk/physics.js'
import { getSprite } from '../game-data/schema.js'

export const catchTemplate = {
  id: 'catch',
  name: 'Catch',
  icon: '⭐',
  description: 'Catch falling objects',
  examplePrompt: 'Make a cat catch stars',
  suggestions: [
    { text: 'Make me faster', icon: '💨' },
    { text: 'Add bombs', icon: '💣' },
    { text: 'Give me 5 lives', icon: '❤️' },
    { text: 'Make the background space', icon: '🌌' },
  ],

  getDefaultDefinition() {
    return {
      template: 'catch',
      title: 'Star Catcher',
      theme: { background: 'sky' },
      player: { type: 'cat', size: 50, speed: 6 },
      objects: [
        { id: 'star', role: 'collectible', type: 'star', speed: 3, spawnRate: 1000, points: 1 },
      ],
      rules: { startingLives: 3, targetScore: 20, difficulty: 'normal' },
    }
  },

  setup(engine, def) {
    const player = engine.addEntity({
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
    engine.set('targetScore', def.rules.targetScore)
    engine.set('spawnTimers', {})

    for (const obj of def.objects) {
      engine.set(`timer_${obj.id}`, 0)
    }
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    if (input.actions.left) player.x -= player.speed * dt * 60
    if (input.actions.right) player.x += player.speed * dt * 60
    clampToBounds(player, 40)

    const def = engine.definition
    for (const obj of def.objects) {
      const timerKey = `timer_${obj.id}`
      const timer = (engine.get(timerKey) || 0) + dt * 1000
      if (timer >= obj.spawnRate) {
        engine.set(timerKey, 0)
        engine.addEntity({
          role: obj.role,
          type: obj.type,
          sprite: getSprite(obj.type),
          x: Math.random() * (GAME_WIDTH - 40),
          y: -40,
          width: 36,
          height: 36,
          vy: obj.speed,
          points: obj.points || 1,
        })
      } else {
        engine.set(timerKey, timer)
      }
    }

    const toRemove = []
    for (const e of engine.entities.values()) {
      if (e.role === 'player') continue
      e.y += e.vy * dt * 60
      if (e.y > GAME_HEIGHT + 50) {
        toRemove.push(e.id)
        if (e.role === 'collectible') {
          engine.loseLife()
        }
        continue
      }
      if (checkAABB(e, player)) {
        toRemove.push(e.id)
        if (e.role === 'collectible') {
          engine.addScore(e.points || 1)
        } else if (e.role === 'hazard') {
          engine.loseLife()
        }
      }
    }
    toRemove.forEach(id => engine.removeEntity(id))

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'sky')
    drawEntities(ctx, engine.entities)
  },
}
