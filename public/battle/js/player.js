const Player = {
  x: 0,
  y: 0,
  health: 0,
  maxHealth: 0,
  alive: true,
  shootTimer: 0,
  angle: 0,
  hitFlash: 0,
  shrinkScale: 1,
  figureMode: 'simple',
  appearance: null,
  anim: null,
  _moving: false,
  _speed: 0,

  loadSettings() {
    this.figureMode = localStorage.getItem('figureMode') || 'simple'
    try {
      const saved = JSON.parse(localStorage.getItem('appearance'))
      this.appearance = saved || Object.assign({}, DEFAULT_APPEARANCE)
    } catch (e) {
      this.appearance = Object.assign({}, DEFAULT_APPEARANCE)
    }
    if (typeof AnimationController !== 'undefined') {
      this.anim = new AnimationController()
    }
  },

  saveFigureMode(mode) {
    this.figureMode = mode
    localStorage.setItem('figureMode', mode)
  },

  saveAppearance(app) {
    this.appearance = validateAppearance(app)
    localStorage.setItem('appearance', JSON.stringify(this.appearance))
  },

  spawn() {
    const cfg = GAME_CONFIG.player
    this.x = 100
    this.y = Arena.height / 2
    this.health = cfg.health
    this.maxHealth = cfg.health
    this.alive = true
    this.shootTimer = 0
    this.hitFlash = 0
  },

  getSize() {
    return GAME_CONFIG.player.size * this.shrinkScale
  },

  shrink() {
    this.shrinkScale = Math.max(0.35, this.shrinkScale * 0.94)
  },

  update(dt) {
    if (!this.alive) return

    const cfg = GAME_CONFIG.player
    let dx = 0
    let dy = 0

    if (Input.isDown('w') || Input.isDown('arrowup')) dy -= 1
    if (Input.isDown('s') || Input.isDown('arrowdown')) dy += 1
    if (Input.isDown('a') || Input.isDown('arrowleft')) dx -= 1
    if (Input.isDown('d') || Input.isDown('arrowright')) dx += 1

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy)
      dx /= len
      dy /= len
    }

    if (Input.touch.moveId !== null) {
      dx = Input.touch.moveDx
      dy = Input.touch.moveDy
    }

    this.x += dx * cfg.speed * dt
    this.y += dy * cfg.speed * dt

    const pos = Arena.pushOut(this.x, this.y, this.getSize())
    this.x = pos.x
    this.y = pos.y

    if (Input.touch.shooting) {
      this.angle = Math.atan2(Input.touch.shootY - this.y, Input.touch.shootX - this.x)
    } else {
      this.angle = Math.atan2(Input.mouse.y - this.y, Input.mouse.x - this.x)
    }

    const weaponId = this.appearance ? this.appearance.weapon : 'pistol'
    const weapon = typeof getWeapon !== 'undefined' ? getWeapon(weaponId) : null
    const cooldown = weapon ? weapon.cooldown : cfg.shootCooldown

    this.shootTimer -= dt * 1000
    const shooting = Input.mouse.down || Input.isDown(' ') || Input.touch.shooting
    if (shooting && this.shootTimer <= 0) {
      if (weapon && weapon.type === 'melee') {
        this._meleeAttack(weapon)
      } else {
        const bx = this.x + Math.cos(this.angle) * (cfg.size + 8)
        const by = this.y + Math.sin(this.angle) * (cfg.size + 8)
        Bullets.create(bx, by, Math.cos(this.angle), Math.sin(this.angle), true, weaponId)
      }
      this.shootTimer = cooldown
      if (this.anim) this.anim.triggerAttack()
      Sound.play('shoot')
    }

    if (this.hitFlash > 0) this.hitFlash -= dt * 5

    this._moving = (dx !== 0 || dy !== 0)
    this._speed = Math.sqrt(dx * dx + dy * dy) * GAME_CONFIG.player.speed

    if (this.anim) {
      this.anim.update(dt, {
        health: this.health,
        maxHealth: this.maxHealth,
        alive: this.alive,
        moving: this._moving,
        speed: this._speed,
      })
    }
  },

  _meleeAttack(weapon) {
    const range = weapon.range || 55
    const arc = weapon.swingArc || 1.2
    Game.enemies.forEach(e => {
      if (!e.alive) return
      const dx = e.x - this.x
      const dy = e.y - this.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > range) return
      const a = Math.atan2(dy, dx)
      let diff = a - this.angle
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      if (Math.abs(diff) < arc / 2) {
        e.takeDamage(weapon.damage)
        this.shrink()
        Effects.create(e.x, e.y, weapon.color)
        if (!e.alive) {
          Game.playerScore++
          UI.updateScore(Game.playerScore, Game.enemyScore)
          Sound.play('score')
          if (Game.playerScore >= GAME_CONFIG.game.winningScore) {
            Game.endGame(true)
          } else {
            e.startRespawn()
          }
        }
      }
    })
  },

  takeDamage(amount) {
    this.health -= amount
    this.hitFlash = 1
    if (this.anim) this.anim.triggerHit()
    Sound.play('hit')
    if (this.health <= 0) {
      this.health = 0
      this.alive = false
    }
  },

  draw(ctx) {
    if (!this.alive) return
    const cfg = GAME_CONFIG.player
    const s = this.getSize()

    if (this.figureMode === 'brawl' && typeof BrawlRenderer !== 'undefined') {
      const animState = this.anim ? this.anim.getState() : { hitFlash: this.hitFlash }
      animState.time = animState.time || performance.now() / 1000
      animState.walking = this._moving
      const charId = (this.appearance && this.appearance.brawlCharacter) || 'sirius'
      BrawlRenderer.drawCharacter(ctx, this.x, this.y, s, this.angle, charId, animState)
      BrawlRenderer.drawHealthBar(ctx, this.x, this.y - s - 24, this.health, this.maxHealth)
      return
    }

    if (this.figureMode === 'advanced' && typeof AdvancedRenderer !== 'undefined') {
      const animState = this.anim ? this.anim.getState() : { hitFlash: this.hitFlash }
      AdvancedRenderer.drawCharacter(ctx, this.x, this.y, s, this.angle, this.appearance || DEFAULT_APPEARANCE, animState)
      AdvancedRenderer.drawHealthBar(ctx, this.x, this.y - s - 24, this.health, this.maxHealth)
      return
    }

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(this.x, this.y + s * 0.85, s * 0.7, s * 0.25, 0, 0, Math.PI * 2)
    ctx.fill()

    const grad = ctx.createRadialGradient(this.x - s * 0.3, this.y - s * 0.3, s * 0.05, this.x, this.y, s)
    grad.addColorStop(0, '#99ddff')
    grad.addColorStop(0.5, '#4499ff')
    grad.addColorStop(1, '#2255bb')
    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : grad
    ctx.beginPath()
    ctx.arc(this.x, this.y, s, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 3.5
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.beginPath()
    ctx.ellipse(this.x - s * 0.2, this.y - s * 0.35, s * 0.3, s * 0.15, -0.5, 0, Math.PI * 2)
    ctx.fill()

    this._drawFace(ctx, this.x, this.y, s, this.angle)
    this._drawHealthBar(ctx, this.x, this.y - s - 16)
  },

  _drawFace(ctx, x, y, size, angle) {
    const eyeDist = size * 0.38
    const eyeSize = size * 0.34
    const irisSize = size * 0.2
    const pupilSize = size * 0.1

    const eyeAngles = [angle - 0.42, angle + 0.42]
    eyeAngles.forEach(a => {
      const ex = x + Math.cos(a) * eyeDist
      const ey = y + Math.sin(a) * eyeDist

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const ix = ex + Math.cos(angle) * eyeSize * 0.28
      const iy = ey + Math.sin(angle) * eyeSize * 0.28
      const iGrad = ctx.createRadialGradient(ix, iy, irisSize * 0.15, ix, iy, irisSize)
      iGrad.addColorStop(0, '#55aaff')
      iGrad.addColorStop(1, '#2255cc')
      ctx.fillStyle = iGrad
      ctx.beginPath()
      ctx.arc(ix, iy, irisSize, 0, Math.PI * 2)
      ctx.fill()

      const px = ex + Math.cos(angle) * eyeSize * 0.35
      const py = ey + Math.sin(angle) * eyeSize * 0.35
      ctx.fillStyle = '#111111'
      ctx.beginPath()
      ctx.arc(px, py, pupilSize, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ix - size * 0.08, iy - size * 0.08, size * 0.055, 0, Math.PI * 2)
      ctx.fill()
    })

    const mouthDist = size * 0.52
    const mx = x + Math.cos(angle) * mouthDist
    const my = y + Math.sin(angle) * mouthDist
    const perp = angle + Math.PI / 2
    const mw = size * 0.18
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(mx + Math.cos(perp) * mw, my + Math.sin(perp) * mw)
    ctx.quadraticCurveTo(
      mx + Math.cos(angle) * size * 0.1,
      my + Math.sin(angle) * size * 0.1,
      mx - Math.cos(perp) * mw,
      my - Math.sin(perp) * mw
    )
    ctx.stroke()
    ctx.lineCap = 'butt'
  },

  _drawHealthBar(ctx, cx, cy) {
    const w = 56
    const h = 7
    const ratio = this.health / this.maxHealth
    const x = cx - w / 2

    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(x - 1, cy - 1, w + 2, h + 2)
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(x, cy, w, h)

    if (ratio > 0) {
      const hGrad = ctx.createLinearGradient(x, cy, x, cy + h)
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
      ctx.fillRect(x, cy, w * ratio, h)
    }

    ctx.strokeStyle = '#111111'
    ctx.lineWidth = 1.5
    ctx.strokeRect(x, cy, w, h)
  },
}
