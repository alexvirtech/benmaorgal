import { GAME_WIDTH, GAME_HEIGHT, moveTowardsMouse } from '../game-sdk/engine.js'
import { drawBackground, drawEntity } from '../game-sdk/renderer.js'
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
      player: { type: 'hero', size: 85, speed: 6 },
      objects: [
        { id: 'bomb', role: 'hazard', type: 'bomb', speed: 3.5, spawnRate: 800, effect: 'loseLife' },
      ],
      rules: { startingLives: 5, targetScore: 200, difficulty: 'normal' },
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
    engine.set('targetScore', def.rules.targetScore)
  },

  update(engine, dt) {
    const input = engine.input
    const player = engine.getPlayer()
    if (!player) return

    moveTowardsMouse(player, input, dt)
    clampToBounds(player, 40)

    if (input.pointer.down || input.actions.left || input.actions.right) {
      engine.spawnTrail(player.x + player.width / 2, player.y + player.height, '#66aaff', 2)
    }

    const def = engine.definition
    const hazard = def.objects[0] || { speed: 3.5, spawnRate: 800, type: 'bomb' }

    const timer = (engine.get('spawnTimer') || 0) + dt * 1000
    if (timer >= hazard.spawnRate) {
      engine.set('spawnTimer', 0)
      const size = 65
      engine.addEntity({
        role: 'hazard',
        type: hazard.type,
        sprite: getSprite(hazard.type),
        x: Math.random() * (GAME_WIDTH - size),
        y: -size,
        width: size,
        height: size,
        vy: hazard.speed + Math.random() * 1.5,
        spin: true,
        spinSpeed: 2 + Math.random() * 2,
        bob: true,
        bobAmount: 3,
        bobPhase: Math.random() * 6,
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
        engine.screenShake(10, 0.2)
        engine.spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ff4400', 18, 4)
        engine.spawnParticles(player.x + player.width / 2, player.y, '#ff0000', 12, 2)
      }
    }
    toRemove.forEach(id => engine.removeEntity(id))

    if (engine.state.score >= engine.get('targetScore')) {
      engine.win()
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'city')
    const t = engine.state.elapsed
    for (const e of engine.entities.values()) {
      if (e.active && e.visible) drawEntity(ctx, e, t)
    }
  },
}
