import { GAME_WIDTH, GAME_HEIGHT } from './engine.js'

const BACKGROUNDS = {
  sky: { top: '#87CEEB', bottom: '#e0f0ff', ground: '#7ec850' },
  space: { top: '#0a0a2e', bottom: '#1a1a4e', ground: null, stars: true },
  forest: { top: '#4a7c30', bottom: '#2d5016', ground: '#3d2b1f' },
  city: { top: '#6c7a89', bottom: '#3a3a4a', ground: '#555' },
  ocean: { top: '#1a6b8a', bottom: '#0a4a6e', ground: '#c4a35a' },
  desert: { top: '#f5c542', bottom: '#c4a35a', ground: '#a07030' },
  grass: { top: '#87CEEB', bottom: '#b0e0ff', ground: '#4a8a2a' },
  night: { top: '#0f0f2e', bottom: '#1a1a3e', ground: '#2a2a2a', stars: true },
}

function drawThemeDecor(ctx, bgName) {
  const G = GAME_HEIGHT - 40
  switch (bgName) {
    case 'city': {
      const bldg = [
        [30, 60, 120], [100, 40, 180], [150, 70, 100], [250, 50, 200],
        [310, 80, 140], [420, 45, 170], [480, 65, 110], [560, 55, 190],
        [630, 70, 130], [720, 50, 160],
      ]
      for (const [bx, bw, bh] of bldg) {
        ctx.fillStyle = '#2a2a3a'
        ctx.fillRect(bx, G - bh, bw, bh)
        ctx.fillStyle = 'rgba(255,215,0,0.5)'
        for (let wy = G - bh + 15; wy < G - 15; wy += 25) {
          for (let wx = bx + 8; wx < bx + bw - 8; wx += 18) {
            ctx.fillRect(wx, wy, 8, 10)
          }
        }
      }
      break
    }
    case 'forest': {
      const treeX = [50, 150, 280, 400, 520, 650, 750]
      for (const tx of treeX) {
        ctx.fillStyle = '#5c3a1e'
        ctx.fillRect(tx - 6, G - 50, 12, 50)
        ctx.fillStyle = '#1a5c1a'
        ctx.beginPath()
        ctx.moveTo(tx, G - 110)
        ctx.lineTo(tx - 28, G - 50)
        ctx.lineTo(tx + 28, G - 50)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(tx, G - 140)
        ctx.lineTo(tx - 22, G - 90)
        ctx.lineTo(tx + 22, G - 90)
        ctx.closePath()
        ctx.fill()
      }
      break
    }
    case 'ocean': {
      for (let wy = G - 100; wy < G; wy += 30) {
        ctx.fillStyle = `rgba(255,255,255,${0.08 + (wy - G + 100) * 0.001})`
        ctx.beginPath()
        ctx.moveTo(0, wy)
        for (let wx = 0; wx <= GAME_WIDTH; wx += 40) {
          ctx.quadraticCurveTo(wx + 10, wy - 8, wx + 20, wy)
          ctx.quadraticCurveTo(wx + 30, wy + 8, wx + 40, wy)
        }
        ctx.lineTo(GAME_WIDTH, wy + 20)
        ctx.lineTo(0, wy + 20)
        ctx.closePath()
        ctx.fill()
      }
      break
    }
    case 'desert': {
      ctx.fillStyle = '#d4a350'
      ctx.beginPath()
      ctx.moveTo(0, G - 20)
      ctx.quadraticCurveTo(200, G - 80, 400, G - 20)
      ctx.quadraticCurveTo(600, G - 60, GAME_WIDTH, G - 20)
      ctx.lineTo(GAME_WIDTH, G)
      ctx.lineTo(0, G)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#2d8a3e'
      ctx.fillRect(150, G - 70, 8, 30)
      ctx.fillRect(140, G - 60, 8, 15)
      ctx.fillRect(158, G - 55, 8, 12)
      ctx.fillRect(600, G - 65, 8, 25)
      ctx.fillRect(590, G - 55, 8, 12)
      ctx.fillRect(608, G - 58, 8, 10)
      break
    }
    case 'sky': {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      const clouds = [[100, 80, 60], [300, 50, 45], [550, 100, 55], [700, 60, 40]]
      for (const [cx, cy, r] of clouds) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.7, 0, Math.PI * 2)
        ctx.arc(cx - r * 0.6, cy + r * 0.1, r * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'grass': {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      const cl = [[120, 70, 50], [450, 90, 40], [680, 60, 35]]
      for (const [cx, cy, r] of cl) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.arc(cx + r * 0.6, cy - r * 0.15, r * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'night': {
      ctx.fillStyle = '#ffe066'
      ctx.beginPath()
      ctx.arc(650, 80, 30, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f0f2e'
      ctx.beginPath()
      ctx.arc(638, 72, 26, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'space': {
      ctx.fillStyle = '#553388'
      ctx.globalAlpha = 0.15
      ctx.beginPath()
      ctx.arc(600, 200, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 0.1
      ctx.fillStyle = '#886633'
      ctx.beginPath()
      ctx.arc(180, 120, 25, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      break
    }
  }
}

export function drawBackground(ctx, theme) {
  let bgName, groundColor
  if (typeof theme === 'object' && theme !== null) {
    bgName = theme.background || 'sky'
    groundColor = theme.groundColor
  } else {
    bgName = theme || 'sky'
  }

  const bg = BACKGROUNDS[bgName] || BACKGROUNDS.sky
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  grad.addColorStop(0, bg.top)
  grad.addColorStop(1, bg.bottom)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  if (bg.stars) {
    ctx.fillStyle = '#ffffff'
    const seed = bgName === 'space' ? 42 : 99
    for (let i = 0; i < 80; i++) {
      const x = ((seed * (i + 1) * 7919) % GAME_WIDTH)
      const y = ((seed * (i + 1) * 104729) % (GAME_HEIGHT - 100))
      const r = ((i * 3) % 3) + 1
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawThemeDecor(ctx, bgName)

  const gColor = groundColor || bg.ground
  if (gColor) {
    ctx.fillStyle = gColor
    ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40)
  }
}

export function drawEntity(ctx, entity, time) {
  if (!entity.visible || !entity.active) return

  ctx.save()

  if (entity.opacity !== undefined) {
    ctx.globalAlpha = entity.opacity
  }

  const cx = entity.x + entity.width / 2
  const cy = entity.y + entity.height / 2

  let offsetY = 0
  let scale = 1
  let rotation = 0

  if (time !== undefined) {
    if (entity.bob) {
      offsetY = Math.sin(time * (entity.bobSpeed || 3) + (entity.bobPhase || 0)) * (entity.bobAmount || 5)
    }
    if (entity.pulse) {
      scale = 1 + Math.sin(time * (entity.pulseSpeed || 4) + (entity.pulsePhase || 0)) * (entity.pulseAmount || 0.08)
    }
    if (entity.spin) {
      rotation = time * (entity.spinSpeed || 2)
    }
  }

  if (entity.glow) {
    ctx.shadowColor = entity.glowColor || '#ffd700'
    ctx.shadowBlur = entity.glowSize || 12
  }

  ctx.translate(cx, cy + offsetY)
  if (scale !== 1) ctx.scale(scale, scale)
  if (rotation) ctx.rotate(rotation)

  if (entity.sprite) {
    const size = Math.max(entity.width, entity.height)
    ctx.font = `${size * 0.85}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(entity.sprite, 0, 0)
  } else if (entity.color) {
    ctx.fillStyle = entity.color
    if (entity.shape === 'circle') {
      ctx.beginPath()
      ctx.arc(0, 0, entity.width / 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(-entity.width / 2, -entity.height / 2, entity.width, entity.height)
    }
  }

  ctx.shadowBlur = 0
  ctx.restore()
}

export function drawEntities(ctx, entities, time) {
  for (const e of entities.values()) {
    drawEntity(ctx, e, time)
  }
}
