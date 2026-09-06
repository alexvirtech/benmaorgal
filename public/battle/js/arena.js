const Arena = {
  obstacles: [],
  width: 0,
  height: 0,

  init() {
    const c = GAME_CONFIG.arena
    this.width = c.width
    this.height = c.height

    this.obstacles = [
      { x: 150, y: 130, w: 120, h: 20, type: 'wall' },
      { x: 690, y: 130, w: 120, h: 20, type: 'wall' },
      { x: 370, y: 230, w: 220, h: 20, type: 'wall' },
      { x: 370, y: 390, w: 220, h: 20, type: 'wall' },
      { x: 150, y: 490, w: 120, h: 20, type: 'wall' },
      { x: 690, y: 490, w: 120, h: 20, type: 'wall' },
      { x: 380, y: 290, w: 44, h: 44, type: 'box' },
      { x: 536, y: 290, w: 44, h: 44, type: 'box' },
    ]
  },

  draw(ctx) {
    if (typeof drawThemedArena !== 'undefined') {
      drawThemedArena(ctx, this.width, this.height, this.obstacles)
      return
    }
    const c = GAME_CONFIG.arena
    ctx.fillStyle = c.grassColor
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.strokeStyle = c.borderColor
    ctx.lineWidth = 6
    ctx.strokeRect(3, 3, this.width - 6, this.height - 6)
    this.obstacles.forEach(obs => {
      ctx.fillStyle = obs.type === 'wall' ? c.wallColor : c.boxColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.strokeStyle = obs.type === 'wall' ? c.wallStroke : c.boxStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    })
  },

  pushOut(cx, cy, radius) {
    let x = cx
    let y = cy

    for (const obs of this.obstacles) {
      const nearX = Math.max(obs.x, Math.min(x, obs.x + obs.w))
      const nearY = Math.max(obs.y, Math.min(y, obs.y + obs.h))
      const dx = x - nearX
      const dy = y - nearY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < radius) {
        if (dist === 0) {
          x = obs.x - radius
        } else {
          const push = radius - dist
          x += (dx / dist) * push
          y += (dy / dist) * push
        }
      }
    }

    x = Math.max(radius + 4, Math.min(this.width - radius - 4, x))
    y = Math.max(radius + 4, Math.min(this.height - radius - 4, y))

    return { x, y }
  },

  pointInWall(px, py) {
    for (const obs of this.obstacles) {
      if (px >= obs.x && px <= obs.x + obs.w &&
          py >= obs.y && py <= obs.y + obs.h) {
        return true
      }
    }
    return false
  },
}
