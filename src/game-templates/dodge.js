import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground, drawEntities } from '../game-sdk/renderer.js'
import { checkAABB, clampToBounds } from '../game-sdk/physics.js'
import { getSprite } from '../game-data/schema.js'

export const dodgeTemplate = {
  id: 'dodge',
  name: 'Dodge',
  icon: '💣',
  description: 'Avoid falling hazards',
  examplePrompt: 'Make a game where I avoid bombs',
  suggestions: [
    { text: 'Make me faster', icon: '💨' },
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Give me 5 lives', icon: '❤️' },
    { text: 'Make the background night', icon: '🌙' },
  ],

  getDefaultDefinition() {
    return {
      template: 'dodge',
      title: 'Bomb Dodger',
      theme: { background: 'city' },
      player: { type: 'hero', size: 45, speed: 6 },
      objects: [
        { id: 'bomb', role: 'hazard', type: 'bomb', speed: 3.5, spawnRate: 800, effect: 'loseLife' },
      ],
      rules: { startingLives: 3, targetScore: 100, difficulty: 'normal' },
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
    engine.set('scoreTimer', 0)
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    if (input.actions.left) player.x -= player.speed * dt * 60
    if (input.actions.right) player.x += player.speed * dt * 60
    clampToBounds(player, 40)

    const def = engine.definition
    const hazard = def.objects[0] || { speed: 3.5, spawnRate: 800, type: 'bomb' }

    const timer = (engine.get('spawnTimer') || 0) + dt * 1000
    if (timer >= hazard.spawnRate) {
      engine.set('spawnTimer', 0)
      engine.addEntity({
        role: 'hazard',
        type: hazard.type,
        sprite: getSprite(hazard.type),
        x: Math.random() * (GAME_WIDTH - 36),
        y: -40,
        width: 36,
        height: 36,
        vy: hazard.speed + Math.random() * 1.5,
      })
    } else {
      engine.set('spawnTimer', timer)
    }

    const scoreTimer = (engine.get('scoreTimer') || 0) + dt
    if (scoreTimer >= 0.5) {
      engine.set('scoreTimer', 0)
      engine.addScore(1)
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
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'city')
    drawEntities(ctx, engine.entities)
  },
}
