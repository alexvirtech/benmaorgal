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
