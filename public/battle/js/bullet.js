const Effects = {
  list: [],
  explosionRings: [],
  explosionParticles: [],

  create(x, y, color) {
    this.list.push({ x, y, color, radius: 4, alpha: 1 })
  },

  createExplosion(x, y, color, splashRadius) {
    const r = splashRadius || 35

    this.explosionRings.push({
      x, y,
      color,
      radius: r * 0.15,
      maxRadius: r,
      alpha: 0.8,
      type: 'ring',
    })

    this.explosionRings.push({
      x, y,
      color: '#ffffff',
      radius: r * 0.1,
      maxRadius: r * 0.5,
      alpha: 0.6,
      type: 'flash',
    })

    this.explosionRings.push({
      x, y,
      color: '#ffaa22',
      radius: r * 0.2,
      maxRadius: r * 0.7,
      alpha: 0.5,
      type: 'flash',
    })

    const count = 6 + Math.floor(r / 8)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 60 + Math.random() * 160
      this.explosionParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 3 === 0 ? '#ffcc22' : i % 3 === 1 ? color : '#ff6622',
        size: 1.5 + Math.random() * 3,
        alpha: 1,
        life: 0.2 + Math.random() * 0.3,
      })
    }
  },

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i]
      e.radius += dt * 80
      e.alpha -= dt * 4
      if (e.alpha <= 0) this.list.splice(i, 1)
    }

    for (let i = this.explosionRings.length - 1; i >= 0; i--) {
      const e = this.explosionRings[i]
      e.radius += dt * 250
      e.alpha -= dt * 4.5
      if (e.alpha <= 0 || e.radius > e.maxRadius) this.explosionRings.splice(i, 1)
    }

    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      const p = this.explosionParticles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.94
      p.vy *= 0.94
      p.life -= dt
      p.alpha = Math.max(0, p.life / 0.4)
      p.size *= 0.97
      if (p.life <= 0) this.explosionParticles.splice(i, 1)
    }
  },

  draw(ctx) {
    this.list.forEach(e => {
      ctx.globalAlpha = Math.max(0, e.alpha)
      ctx.strokeStyle = e.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
      ctx.stroke()
    })

    this.explosionRings.forEach(e => {
      ctx.globalAlpha = Math.max(0, e.alpha)
      if (e.type === 'flash') {
        ctx.fillStyle = e.color
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.strokeStyle = e.color
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
        ctx.stroke()
      }
    })

    this.explosionParticles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.globalAlpha = 1
  },

  clear() {
    this.list = []
    this.explosionRings = []
    this.explosionParticles = []
  },
}

const Bullets = {
  list: [],
  _smokeTrails: [],
  _pendingExplosions: [],

  clear() {
    this.list = []
    this._smokeTrails = []
    this._pendingExplosions = []
    Effects.clear()
  },

  create(x, y, dirX, dirY, isPlayer, weaponId) {
    const len = Math.sqrt(dirX * dirX + dirY * dirY)
    if (len === 0) return

    const w = weaponId ? getWeapon(weaponId) : null
    const cfg = GAME_CONFIG.bullet

    const speed = w ? w.speed : cfg.speed
    const damage = w ? w.damage : (isPlayer ? cfg.playerDamage : cfg.enemyDamage)
    const size = w ? w.size : cfg.size
    const color = w ? w.color : (isPlayer ? cfg.playerColor : cfg.enemyColor)
    const angle = Math.atan2(dirY, dirX)

    if (w && w.pellets && w.pellets > 1) {
      for (let i = 0; i < w.pellets; i++) {
        const spread = (i - (w.pellets - 1) / 2) * w.spread
        const a = angle + spread
        this.list.push({
          x, y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          size: size,
          damage: damage,
          color: color,
          isPlayer, weaponId: w.id,
          angle: a,
          life: (w.range / speed) * 1000,
          splash: w.splash || 35,
        })
      }
      return
    }

    this.list.push({
      x, y,
      vx: (dirX / len) * speed,
      vy: (dirY / len) * speed,
      size,
      damage,
      color,
      isPlayer,
      weaponId: w ? w.id : 'pistol',
      angle,
      life: w ? (w.range / speed) * 1000 : cfg.lifetime,
      splash: w ? (w.splash || 35) : 35,
    })
  },

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i]
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.life -= dt * 1000

      if (b.weaponId === 'rocket' || b.weaponId === 'grenade' || b.weaponId === 'flamethrower') {
        this._smokeTrails.push({
          x: b.x + (Math.random() - 0.5) * 4,
          y: b.y + (Math.random() - 0.5) * 4,
          alpha: b.weaponId === 'flamethrower' ? 0.4 : 0.5,
          size: b.weaponId === 'rocket' ? 4 : b.weaponId === 'flamethrower' ? 5 : 3,
          color: b.weaponId === 'rocket' ? '#888' : b.weaponId === 'flamethrower' ? '#ff4400' : '#5a5',
        })
      }

      if (
        b.life <= 0 ||
        b.x < 0 || b.x > Arena.width ||
        b.y < 0 || b.y > Arena.height ||
        Arena.pointInWall(b.x, b.y)
      ) {
        Effects.createExplosion(b.x, b.y, b.color, b.splash)
        this._pendingExplosions.push({
          x: b.x, y: b.y,
          isPlayer: b.isPlayer,
          splashDamage: Math.ceil(b.damage * 0.4),
          splashRadius: b.splash,
        })
        this.list.splice(i, 1)
      }
    }

    for (let i = this._smokeTrails.length - 1; i >= 0; i--) {
      const s = this._smokeTrails[i]
      s.alpha -= dt * 3
      s.size += dt * 8
      if (s.alpha <= 0) this._smokeTrails.splice(i, 1)
    }

    Effects.update(dt)
  },

  draw(ctx) {
    this._smokeTrails.forEach(s => {
      ctx.globalAlpha = Math.max(0, s.alpha)
      ctx.fillStyle = s.color
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    this.list.forEach(b => {
      Bullets._drawProjectile(ctx, b.x, b.y, b.size, b.angle, b.weaponId, b.color)
    })

    Effects.draw(ctx)
  },

  _drawProjectile(ctx, x, y, size, angle, weaponId, color) {
    switch (weaponId) {
      case 'pistol':
        ctx.fillStyle = color + '44'
        ctx.beginPath()
        ctx.arc(x, y, size * 1.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x - Math.cos(angle) * size * 0.2, y - Math.sin(angle) * size * 0.2, size * 0.35, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'shotgun':
        ctx.fillStyle = color + '66'
        ctx.beginPath()
        ctx.arc(x, y, size * 1.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'blaster':
        ctx.save()
        ctx.shadowColor = color
        ctx.shadowBlur = 12
        ctx.fillStyle = color + '33'
        ctx.beginPath()
        ctx.arc(x, y, size * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.ellipse(x, y, size * 1.3, size * 0.7, angle, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.35, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break

      case 'rocket':
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillStyle = '#aa2222'
        ctx.beginPath()
        ctx.moveTo(size * 1.4, 0)
        ctx.lineTo(-size, -size * 0.55)
        ctx.lineTo(-size, size * 0.55)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#cc4444'
        ctx.beginPath()
        ctx.moveTo(size * 1.4, 0)
        ctx.lineTo(-size * 0.3, -size * 0.4)
        ctx.lineTo(-size * 0.3, size * 0.4)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#666'
        ctx.beginPath()
        ctx.moveTo(-size, -size * 0.55)
        ctx.lineTo(-size * 1.2, -size * 0.8)
        ctx.lineTo(-size * 0.7, -size * 0.35)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(-size, size * 0.55)
        ctx.lineTo(-size * 1.2, size * 0.8)
        ctx.lineTo(-size * 0.7, size * 0.35)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#ff6622'
        ctx.beginPath()
        ctx.moveTo(-size, 0)
        ctx.lineTo(-size * 1.6, -size * 0.35)
        ctx.lineTo(-size * 1.6, size * 0.35)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#ffcc22'
        ctx.beginPath()
        ctx.moveTo(-size, 0)
        ctx.lineTo(-size * 1.3, -size * 0.2)
        ctx.lineTo(-size * 1.3, size * 0.2)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        break

      case 'grenade':
        ctx.fillStyle = '#2a6a2a'
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#44aa44'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.75, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#1a4a1a'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x, y - size * 0.3)
        ctx.lineTo(x, y + size * 0.3)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x - size * 0.3, y)
        ctx.lineTo(x + size * 0.3, y)
        ctx.stroke()
        ctx.fillStyle = '#666'
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillRect(size * 0.6, -2, size * 0.5, 4)
        ctx.restore()
        break

      case 'sniper':
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillStyle = '#ff2244'
        ctx.fillRect(-size * 2, -size * 0.3, size * 4, size * 0.6)
        ctx.fillStyle = '#ff6688'
        ctx.fillRect(-size, -size * 0.15, size * 2, size * 0.3)
        ctx.restore()
        break

      case 'smg':
        ctx.fillStyle = color + '55'
        ctx.beginPath()
        ctx.arc(x, y, size * 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'crossbow':
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillStyle = '#aa6633'
        ctx.fillRect(-size * 0.5, -size * 0.15, size * 2.5, size * 0.3)
        ctx.fillStyle = '#886633'
        ctx.beginPath()
        ctx.moveTo(size * 2, 0)
        ctx.lineTo(size * 1.5, -size * 0.6)
        ctx.lineTo(size * 1.5, size * 0.6)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        break

      case 'flamethrower':
        ctx.save()
        ctx.globalAlpha = 0.7
        ctx.fillStyle = '#ff6622'
        ctx.beginPath()
        ctx.arc(x, y, size * 1.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffaa22'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffdd44'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.restore()
        break

      default:
        ctx.fillStyle = color + '44'
        ctx.beginPath()
        ctx.arc(x, y, size * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }
  },
}
