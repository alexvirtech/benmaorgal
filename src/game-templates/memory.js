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
      rules: { startingLives: 99, targetScore: 8, difficulty: 'normal', pairs: 8 },
    }
  },

  setup(engine, def) {
    const pairs = Math.min(def.rules?.pairs || 8, CARD_EMOJIS.length)
    const emojis = CARD_EMOJIS.slice(0, pairs)
    const deck = [...emojis, ...emojis]

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }

    const cols = pairs <= 4 ? 4 : pairs <= 6 ? 4 : 4
    const rows = Math.ceil(deck.length / cols)
    const cardW = Math.min(90, (GAME_WIDTH - 80) / cols)
    const cardH = Math.min(100, (GAME_HEIGHT - 120) / rows)
    const startX = (GAME_WIDTH - cols * (cardW + 10)) / 2
    const startY = 60

    engine.set('cards', deck.map((emoji, i) => ({
      id: i,
      emoji,
      col: i % cols,
      row: Math.floor(i / cols),
      x: startX + (i % cols) * (cardW + 10),
      y: startY + Math.floor(i / cols) * (cardH + 10),
      w: cardW,
      h: cardH,
      revealed: false,
      matched: false,
    })))

    engine.set('selected', [])
    engine.set('lockTimer', 0)
    engine.set('attempts', 0)
    engine.state.score = 0
    engine.set('targetPairs', pairs)
    engine.state.lives = 99
  },

  update(engine, dt) {
    const lockTimer = engine.get('lockTimer') || 0
    if (lockTimer > 0) {
      const remaining = lockTimer - dt
      if (remaining <= 0) {
        engine.set('lockTimer', 0)
        const cards = engine.get('cards')
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

    const cards = engine.get('cards')
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
            engine.addScore(1)
            engine.set('selected', [])
            if (engine.state.score >= engine.get('targetPairs')) {
              engine.win()
            }
          } else {
            engine.set('lockTimer', 0.8)
          }
        }
        break
      }
    }
  },

  render(engine, ctx) {
    drawBackground(ctx, engine.definition?.theme?.background || 'sky')

    const cards = engine.get('cards') || []
    for (const card of cards) {
      if (card.matched) {
        ctx.fillStyle = 'rgba(46, 204, 113, 0.3)'
        ctx.beginPath()
        ctx.roundRect(card.x, card.y, card.w, card.h, 10)
        ctx.fill()
        ctx.font = `${card.w * 0.5}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = 0.5
        ctx.fillText(card.emoji, card.x + card.w / 2, card.y + card.h / 2)
        ctx.globalAlpha = 1
        continue
      }

      if (card.revealed) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.roundRect(card.x, card.y, card.w, card.h, 10)
        ctx.fill()
        ctx.strokeStyle = '#6c5ce7'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.font = `${card.w * 0.5}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(card.emoji, card.x + card.w / 2, card.y + card.h / 2)
      } else {
        const grad = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.h)
        grad.addColorStop(0, '#6c5ce7')
        grad.addColorStop(1, '#a29bfe')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(card.x, card.y, card.w, card.h, 10)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = `${card.w * 0.35}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('?', card.x + card.w / 2, card.y + card.h / 2)
      }
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
