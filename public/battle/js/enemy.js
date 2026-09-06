class Enemy {
  constructor(index) {
    this.index = index
    this.alive = false
    this.x = 0
    this.y = 0
    this.health = 0
    this.maxHealth = 0
    this.angle = Math.PI
    this.shootTimer = 0
    this.hitFlash = 0
    this.wanderAngle = Math.random() * Math.PI * 2
    this.wanderTimer = 0
    this.respawnTimer = 0
    this.spawn()
  }

  spawn() {
    const cfg = GAME_CONFIG.enemy
    const spawnPoints = [
      { x: 860, y: 160 },
      { x: 860, y: 320 },
      { x: 860, y: 480 },
    ]
    const sp = spawnPoints[this.index % spawnPoints.length]
    this.x = sp.x
    this.y = sp.y
    this.health = cfg.health
    this.maxHealth = cfg.health
    this.alive = true
    this.shootTimer = cfg.shootCooldown
    this.hitFlash = 0
    this.wanderAngle = Math.random() * Math.PI * 2
    this.wanderTimer = 0
  }

  update(dt) {
    if (!this.alive) {
      this.respawnTimer -= dt * 1000
      if (this.respawnTimer <= 0) {
        this.spawn()
      }
      return
    }

    const cfg = GAME_CONFIG.enemy
    const dx = Player.x - this.x
    const dy = Player.y - this.y
    const distToPlayer = Math.sqrt(dx * dx + dy * dy)

    this.angle = Math.atan2(dy, dx)

    let moveX = 0
    let moveY = 0

    if (Player.alive && distToPlayer < cfg.chaseRange) {
      if (distToPlayer > cfg.keepDistance) {
        moveX = dx / distToPlayer
        moveY = dy / distToPlayer
      }
    } else {
      this.wanderTimer -= dt * 1000
      if (this.wanderTimer <= 0) {
        this.wanderAngle = Math.random() * Math.PI * 2
        this.wanderTimer = cfg.wanderTime + Math.random() * 1000
      }
      moveX = Math.cos(this.wanderAngle)
      moveY = Math.sin(this.wanderAngle)
    }

    this.x += moveX * cfg.speed * dt
    this.y += moveY * cfg.speed * dt

    const pos = Arena.pushOut(this.x, this.y, cfg.size)
    if (pos.x !== this.x || pos.y !== this.y) {
      this.wanderAngle = Math.random() * Math.PI * 2
      this.wanderTimer = 500
    }
    this.x = pos.x
    this.y = pos.y

    if (Player.alive && distToPlayer < cfg.shootRange) {
      this.shootTimer -= dt * 1000
      if (this.shootTimer <= 0) {
        const bx = this.x + Math.cos(this.angle) * (cfg.size + 8)
        const by = this.y + Math.sin(this.angle) * (cfg.size + 8)
        Bullets.create(bx, by, Math.cos(this.angle), Math.sin(this.angle), false)
        this.shootTimer = cfg.shootCooldown + Math.random() * 400
        Sound.play('shoot')
      }
    }

    if (this.hitFlash > 0) this.hitFlash -= dt * 5
  }

  takeDamage(amount) {
    this.health -= amount
    this.hitFlash = 1
    Sound.play('hit')
    if (this.health <= 0) {
      this.health = 0
      this.alive = false
    }
  }

  startRespawn() {
    this.respawnTimer = GAME_CONFIG.game.respawnDelay
  }

  draw(ctx) {
    if (!this.alive) return
    const cfg = GAME_CONFIG.enemy
    const s = cfg.size

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(this.x, this.y + s * 0.85, s * 0.7, s * 0.25, 0, 0, Math.PI * 2)
    ctx.fill()

    const grad = ctx.createRadialGradient(this.x - s * 0.3, this.y - s * 0.3, s * 0.05, this.x, this.y, s)
    grad.addColorStop(0, '#ff9999')
    grad.addColorStop(0.5, '#ff4455')
    grad.addColorStop(1, '#aa2233')
    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : grad
    ctx.beginPath()
    ctx.arc(this.x, this.y, s, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 3.5
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.ellipse(this.x - s * 0.2, this.y - s * 0.35, s * 0.3, s * 0.15, -0.5, 0, Math.PI * 2)
    ctx.fill()

    this._drawFace(ctx, s)
    this._drawHealthBar(ctx, s)
  }

  _drawFace(ctx, size) {
    const eyeDist = size * 0.38
    const eyeSize = size * 0.34
    const irisSize = size * 0.2
    const pupilSize = size * 0.1

    const eyeAngles = [this.angle - 0.42, this.angle + 0.42]
    eyeAngles.forEach((a, i) => {
      const ex = this.x + Math.cos(a) * eyeDist
      const ey = this.y + Math.sin(a) * eyeDist

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const ix = ex + Math.cos(this.angle) * eyeSize * 0.28
      const iy = ey + Math.sin(this.angle) * eyeSize * 0.28
      const iGrad = ctx.createRadialGradient(ix, iy, irisSize * 0.15, ix, iy, irisSize)
      iGrad.addColorStop(0, '#ffcc33')
      iGrad.addColorStop(1, '#dd7700')
      ctx.fillStyle = iGrad
      ctx.beginPath()
      ctx.arc(ix, iy, irisSize, 0, Math.PI * 2)
      ctx.fill()

      const px = ex + Math.cos(this.angle) * eyeSize * 0.35
      const py = ey + Math.sin(this.angle) * eyeSize * 0.35
      ctx.fillStyle = '#111111'
      ctx.beginPath()
      ctx.arc(px, py, pupilSize, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ix - size * 0.08, iy - size * 0.08, size * 0.055, 0, Math.PI * 2)
      ctx.fill()

      const browBack = eyeSize * 0.75
      const browHalf = eyeSize * 0.7
      const browTilt = eyeSize * 0.4
      const bx = ex - Math.cos(this.angle) * browBack
      const by = ey - Math.sin(this.angle) * browBack
      const perp = this.angle + Math.PI / 2
      const innerDir = i === 0 ? 1 : -1
      ctx.strokeStyle = '#881122'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(
        bx - Math.cos(perp) * browHalf * innerDir,
        by - Math.sin(perp) * browHalf * innerDir
      )
      ctx.lineTo(
        bx + Math.cos(perp) * browHalf * innerDir + Math.cos(this.angle) * browTilt,
        by + Math.sin(perp) * browHalf * innerDir + Math.sin(this.angle) * browTilt
      )
      ctx.stroke()
      ctx.lineCap = 'butt'
    })

    const mouthDist = size * 0.52
    const mx = this.x + Math.cos(this.angle) * mouthDist
    const my = this.y + Math.sin(this.angle) * mouthDist
    const perp = this.angle + Math.PI / 2
    const mw = size * 0.2
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(mx + Math.cos(perp) * mw, my + Math.sin(perp) * mw)
    ctx.quadraticCurveTo(
      mx - Math.cos(this.angle) * size * 0.1,
      my - Math.sin(this.angle) * size * 0.1,
      mx - Math.cos(perp) * mw,
      my - Math.sin(perp) * mw
    )
    ctx.stroke()
    ctx.lineCap = 'butt'
  }

  _drawHealthBar(ctx, size) {
    const w = 56
    const h = 7
    const ratio = this.health / this.maxHealth
    const x = this.x - w / 2
    const y = this.y - size - 16

    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2)
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(x, y, w, h)

    if (ratio > 0) {
      const hGrad = ctx.createLinearGradient(x, y, x, y + h)
      if (ratio > 0.5) {
        hGrad.addColorStop(0, '#66ff66')
        hGrad.addColorStop(1, '#33bb33')
      } else if (ratio > 0.25) {
        hGrad.addColorStop(0, '#ffff44')
        hGrad.addColorStop(1, '#ccaa22')
      } else {
        hGrad.addColorStop(0, '#ff5555')
        hGrad.addColorStop(1, '#cc2222')
      }
      ctx.fillStyle = hGrad
      ctx.fillRect(x, y, w * ratio, h)
    }

    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 1.5
    ctx.strokeRect(x, y, w, h)
  }
}
