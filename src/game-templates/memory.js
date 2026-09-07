import { GAME_WIDTH, GAME_HEIGHT } from '../game-sdk/engine.js'
import { drawBackground } from '../game-sdk/renderer.js'

const CARD_EMOJIS = ['🐱', '🐶', '🐸', '🦊', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐵', '🐰']

export const memoryTemplate = {
  id: 'memory',
  name: 'Memory',
  icon: '🧠',
  description: 'Match the pairs',
  examplePrompt: 'Make a matching cards game',
  suggestions: [
    { text: 'Make it harder', icon: '⚡' },
    { text: 'Make it easier', icon: '😊' },
    { text: 'Make the background ocean', icon: '🌊' },
  ],

  getDefaultDefinition() {
    return {
      template: 'memory',
      title: 'Memory Match',
      theme: { background: 'sky' },
      player: { type: 'hero', size: 50, speed: 5 },
      objects: [],
      rules: { startingLives: 99, targetScore: 10, difficulty: 'normal', pairs: 10 },
    }
  },

  setup(engine, def) {
    const pairs = Math.min(def.rules?.pairs || 10, CARD_EMOJIS.length)
    const emojis = CARD_EMOJIS.slice(0, pairs)
    const deck = [...emojis, ...emojis]

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }

    const cols = pairs <= 4 ? 4 : pairs <= 6 ? 4 : 5
    const rows = Math.ceil(deck.length / cols)
    const cardW = Math.min(125, (GAME_WIDTH - 80) / cols)
    const cardH = Math.min(135, (GAME_HEIGHT - 120) / rows)
    const startX = (GAME_WIDTH - cols * (cardW + 12)) / 2
    const startY = 60

    engine.set('cards', deck.map((emoji, i) => ({
      id: i,
      emoji,
      col: i % cols,
      row: Math.floor(i / cols),
      x: startX + (i % cols) * (cardW + 12),
      y: startY + Math.floor(i / cols) * (cardH + 12),
      w: cardW,
      h: cardH,
      revealed: false,
      matched: false,
      matchAnim: 0,
    })))

    engine.set('selected', [])
    engine.set('lockTimer', 0)
    engine.set('attempts', 0)
    engine.state.score = 0
    engine.set('targetPairs', pairs)
    engine.state.lives = 99
  },

  update(engine, dt) {
    const cards = engine.get('cards')
    for (const card of cards) {
      if (card.matchAnim > 0) {
        card.matchAnim = Math.max(0, card.matchAnim - dt * 2)
      }
    }

    const lockTimer = engine.get('lockTimer') || 0
    if (lockTimer > 0) {
      const remaining = lockTimer - dt
      if (remaining <= 0) {
        engine.set('lockTimer', 0)
        const selected = engine.get('selected')
        if (selected.length === 2) {
          const [a, b] = selected
          if (cards[a].emoji !== cards[b].emoji) {
            cards[a].revealed = false
            cards[b].revealed = false
          }
        }
        engine.set('selected', [])
      } else {
        engine.set('lockTimer', remaining)
      }
      return
    }

    const input = engine.input
    if (!input.pointer.clicked) return

    const selected = engine.get('selected')
    const px = input.pointer.x
    const py = input.pointer.y

    for (const card of cards) {
      if (card.matched || card.revealed) continue
      if (px >= card.x && px <= card.x + card.w && py >= card.y && py <= card.y + card.h) {
        card.revealed = true
        selected.push(card.id)

        if (selected.length === 2) {
          const [a, b] = selected
          engine.set('attempts', (engine.get('attempts') || 0) + 1)
          if (cards[a].emoji === cards[b].emoji) {
            cards[a].matched = true
            cards[b].matched = true
            cards[a].matchAnim = 1
            cards[b].matchAnim = 1
            engine.addScore(1)
            engine.spawnParticles(
              cards[a].x + cards[a].w / 2, cards[a].y + cards[a].h / 2, '#2ecc71', 14, 4
            )
            engine.spawnParticles(
              cards[b].x + cards[b].w / 2, cards[b].y + cards[b].h / 2, '#2ecc71', 14, 4
            )
            engine.spawnFloatingText(
              (cards[a].x + cards[b].x) / 2 + cards[a].w / 2,
              (cards[a].y + cards[b].y) / 2,
              'Match!'
            )
            engine.set('selected', [])
            if (engine.state.score >= engine.get('targetPairs')) {
              engine.win()
            }
          } else {
            engine.screenShake(4, 0.1)
            engine.set('lockTimer', 0.8)
          }
        }
        break
      }
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme || 'sky')

    const cards = engine.get('cards') || []
    const t = engine.state.elapsed

    for (const card of cards) {
      const scale = 1 + card.matchAnim * 0.25

      ctx.save()
      ctx.translate(card.x + card.w / 2, card.y + card.h / 2)
      ctx.scale(scale, scale)

      if (card.matched) {
        ctx.globalAlpha = 0.3 + Math.sin(t * 3 + card.id) * 0.2
        ctx.fillStyle = 'rgba(46, 204, 113, 0.3)'
        ctx.beginPath()
        ctx.roundRect(-card.w / 2, -card.h / 2, card.w, card.h, 10)
        ctx.fill()
        ctx.shadowColor = '#2ecc71'
        ctx.shadowBlur = 8
        ctx.font = `${card.w * 0.55}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(card.emoji, 0, 0)
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      } else if (card.revealed) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.roundRect(-card.w / 2, -card.h / 2, card.w, card.h, 10)
        ctx.fill()
        ctx.strokeStyle = '#6c5ce7'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.rotate(Math.sin(t * 8 + card.id) * 0.03)
        ctx.font = `${card.w * 0.55}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(card.emoji, 0, 0)
      } else {
        const grad = ctx.createLinearGradient(0, -card.h / 2, 0, card.h / 2)
        grad.addColorStop(0, '#6c5ce7')
        grad.addColorStop(1, '#a29bfe')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(-card.w / 2, -card.h / 2, card.w, card.h, 10)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = `${card.w * 0.5}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('?', 0, 0)
      }

      ctx.restore()
    }

    const attempts = engine.get('attempts') || 0
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, GAME_WIDTH, 40)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Pairs: ${engine.state.score}/${engine.get('targetPairs')}`, 12, 20)
    ctx.textAlign = 'right'
    ctx.fillText(`Attempts: ${attempts}`, GAME_WIDTH - 12, 20)
  },
}
