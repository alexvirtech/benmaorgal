const AdvancedRenderer = {
  drawCharacter(ctx, x, y, size, angle, appearance, state) {
    const app = validateAppearance(appearance)
    const body = getAppearanceItem('body', app.body)
    const face = getAppearanceItem('face', app.face)
    const hair = getAppearanceItem('hairHat', app.hairHat)
    const shirt = getAppearanceItem('shirt', app.shirt)
    const pants = getAppearanceItem('pants', app.pants)
    const acc = getAppearanceItem('accessory', app.accessory)
    const weapon = getWeapon(app.weapon)
    const skin = SKIN_COLORS[app.skinColor] || SKIN_COLORS[0]

    const bw = body.width
    const bh = body.height
    const anim = state || {}
    const bounce = anim.walking ? Math.sin((anim.time || 0) * 12) * 2 : 0
    const breathe = Math.sin((anim.time || 0) * 2.5) * 0.5
    const isLow = anim.lowHealth
    const isHit = anim.hitFlash > 0
    const isDead = anim.dead

    if (isDead) {
      ctx.save()
      ctx.globalAlpha = 0.5
    }

    this._drawShadow(ctx, x, y + size * 0.85)
    this._drawLegs(ctx, x, y + size * 0.55 + bounce * 0.5, size, pants, bw, anim)
    this._drawBody(ctx, x, y - size * 0.05 + bounce, size, shirt, bw, bh, isHit)
    this._drawBackArm(ctx, x, y + bounce, size, angle, skin, bw)
    if (acc.type === 'backpack') this._drawBackpack(ctx, x, y + bounce, size, acc)
    if (acc.type === 'cape') this._drawCape(ctx, x, y + bounce, size, acc, anim)
    this._drawWeapon(ctx, x, y + bounce, size, angle, weapon, anim)
    this._drawFrontArm(ctx, x, y + bounce, size, angle, skin, bw)
    this._drawHead(ctx, x, y - size * 0.4 + bounce + breathe, size, skin, face, isLow, isHit, angle, anim)
    this._drawHairHat(ctx, x, y - size * 0.4 + bounce + breathe, size, hair)
    if (acc.type === 'glasses' || acc.type === 'sunglasses') this._drawGlasses(ctx, x, y - size * 0.4 + bounce + breathe, size, acc)
    if (acc.type === 'scarf') this._drawScarf(ctx, x, y - size * 0.05 + bounce, size, acc)
    if (acc.type === 'medal') this._drawMedal(ctx, x, y + bounce, size, acc)
    if (acc.type === 'chain') this._drawChain(ctx, x, y + bounce, size, acc)
    if (acc.type === 'bandolier') this._drawBandolier(ctx, x, y + bounce, size, acc)

    if (isDead) {
      ctx.restore()
    }
  },

  _drawShadow(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(x, y, 18, 6, 0, 0, Math.PI * 2)
    ctx.fill()
  },

  _drawLegs(ctx, x, y, size, pants, bw, anim) {
    const legW = 5 * bw
    const legH = pants.short ? 6 : 10
    const gap = 4
    const step = anim.walking ? Math.sin((anim.time || 0) * 14) * 3 : 0

    ctx.fillStyle = pants.color
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.ellipse(x - gap - legW / 2, y + step, legW, legH, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.ellipse(x + gap + legW / 2, y - step, legW, legH, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  },

  _drawBody(ctx, x, y, size, shirt, bw, bh, isHit) {
    const w = 14 * bw
    const h = 14 * bh

    const grad = ctx.createRadialGradient(x - w * 0.2, y - h * 0.2, 1, x, y, w)
    grad.addColorStop(0, this._lighten(shirt.color, 30))
    grad.addColorStop(1, shirt.accent)

    ctx.fillStyle = isHit ? '#ffffff' : grad
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2.5

    ctx.beginPath()
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.ellipse(x - w * 0.25, y - h * 0.3, w * 0.35, h * 0.2, -0.4, 0, Math.PI * 2)
    ctx.fill()
  },

  _drawBackArm(ctx, x, y, size, angle, skin, bw) {
    const armX = x - 14 * bw
    const armY = y + 2
    ctx.fillStyle = skin
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(armX, armY, 5, 7, 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  },

  _drawFrontArm(ctx, x, y, size, angle, skin, bw) {
    const armX = x + 14 * bw
    const armY = y + 2
    ctx.fillStyle = skin
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(armX, armY, 5, 7, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  },

  _drawWeapon(ctx, x, y, size, angle, weapon, anim) {
    const wx = x + Math.cos(angle) * (size * 0.7)
    const wy = y + Math.sin(angle) * (size * 0.7)
    const recoilOffset = (anim.attackFlash > 0) ? -weapon.recoil : 0
    const rx = wx + Math.cos(angle) * recoilOffset
    const ry = wy + Math.sin(angle) * recoilOffset

    ctx.save()
    ctx.translate(rx, ry)
    ctx.rotate(angle)

    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2

    if (weapon.id === 'pistol') {
      ctx.fillStyle = '#555566'
      ctx.fillRect(0, -3, 14, 6)
      ctx.strokeRect(0, -3, 14, 6)
      ctx.fillStyle = '#444455'
      ctx.fillRect(2, 1, 5, 6)
      ctx.strokeRect(2, 1, 5, 6)
    } else if (weapon.id === 'shotgun') {
      ctx.fillStyle = '#665544'
      ctx.fillRect(-4, -3, 22, 6)
      ctx.strokeRect(-4, -3, 22, 6)
      ctx.fillStyle = '#554433'
      ctx.fillRect(-4, -4, 10, 8)
      ctx.strokeRect(-4, -4, 10, 8)
    } else if (weapon.id === 'blaster') {
      ctx.fillStyle = '#3366aa'
      ctx.fillRect(0, -4, 16, 8)
      ctx.strokeRect(0, -4, 16, 8)
      ctx.fillStyle = '#44ddff'
      ctx.beginPath()
      ctx.arc(16, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (weapon.id === 'rocket') {
      ctx.fillStyle = '#556644'
      ctx.fillRect(-6, -5, 24, 10)
      ctx.strokeRect(-6, -5, 24, 10)
      ctx.fillStyle = '#dd4444'
      ctx.beginPath()
      ctx.moveTo(18, -6)
      ctx.lineTo(24, 0)
      ctx.lineTo(18, 6)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (weapon.id === 'bat') {
      const swingAngle = (anim.attackFlash > 0) ? Math.sin(anim.attackFlash * 8) * 0.5 : 0
      ctx.rotate(swingAngle)
      ctx.fillStyle = '#aa7744'
      ctx.fillRect(0, -3, 20, 6)
      ctx.strokeRect(0, -3, 20, 6)
      ctx.fillStyle = '#887733'
      ctx.fillRect(0, -4, 6, 8)
      ctx.strokeRect(0, -4, 6, 8)
    } else if (weapon.id === 'grenade') {
      ctx.fillStyle = '#556644'
      ctx.fillRect(0, -3, 10, 6)
      ctx.strokeRect(0, -3, 10, 6)
      ctx.fillStyle = '#44aa44'
      ctx.beginPath()
      ctx.arc(14, 0, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(12, -6, 3, 4)
    }

    if (weapon.id === 'sniper') {
      ctx.fillStyle = '#445566'
      ctx.fillRect(-2, -3, 28, 6)
      ctx.strokeRect(-2, -3, 28, 6)
      ctx.fillStyle = '#556677'
      ctx.fillRect(-2, -4, 8, 8)
      ctx.strokeRect(-2, -4, 8, 8)
      ctx.fillStyle = '#88aacc'
      ctx.beginPath()
      ctx.arc(20, -5, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (weapon.id === 'smg') {
      ctx.fillStyle = '#555555'
      ctx.fillRect(0, -3, 12, 6)
      ctx.strokeRect(0, -3, 12, 6)
      ctx.fillStyle = '#444444'
      ctx.fillRect(2, 1, 4, 5)
      ctx.strokeRect(2, 1, 4, 5)
      ctx.fillStyle = '#666666'
      ctx.fillRect(10, -2, 4, 4)
      ctx.strokeRect(10, -2, 4, 4)
    } else if (weapon.id === 'crossbow') {
      ctx.fillStyle = '#886644'
      ctx.fillRect(-2, -2, 16, 4)
      ctx.strokeRect(-2, -2, 16, 4)
      ctx.fillStyle = '#665533'
      ctx.beginPath()
      ctx.moveTo(6, -2)
      ctx.lineTo(2, -10)
      ctx.lineTo(4, -10)
      ctx.lineTo(8, -2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(6, 2)
      ctx.lineTo(2, 10)
      ctx.lineTo(4, 10)
      ctx.lineTo(8, 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (weapon.id === 'flamethrower') {
      ctx.fillStyle = '#556655'
      ctx.fillRect(-4, -4, 20, 8)
      ctx.strokeRect(-4, -4, 20, 8)
      ctx.fillStyle = '#ff6622'
      ctx.beginPath()
      ctx.arc(18, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffcc22'
      ctx.beginPath()
      ctx.arc(18, 0, 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (weapon.id === 'sword') {
      const swingAngle = (anim.attackFlash > 0) ? Math.sin(anim.attackFlash * 8) * 0.6 : 0
      ctx.rotate(swingAngle)
      ctx.fillStyle = '#aaaacc'
      ctx.fillRect(0, -2, 24, 4)
      ctx.strokeRect(0, -2, 24, 4)
      ctx.fillStyle = '#ddddee'
      ctx.beginPath()
      ctx.moveTo(24, -3)
      ctx.lineTo(28, 0)
      ctx.lineTo(24, 3)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#886633'
      ctx.fillRect(-2, -4, 4, 8)
      ctx.strokeRect(-2, -4, 4, 8)
      ctx.fillStyle = '#ffd700'
      ctx.fillRect(-1, -5, 2, 10)
    } else if (weapon.id === 'hammer') {
      const swingAngle = (anim.attackFlash > 0) ? Math.sin(anim.attackFlash * 6) * 0.7 : 0
      ctx.rotate(swingAngle)
      ctx.fillStyle = '#886633'
      ctx.fillRect(0, -2, 16, 4)
      ctx.strokeRect(0, -2, 16, 4)
      ctx.fillStyle = '#888888'
      ctx.fillRect(14, -7, 10, 14)
      ctx.strokeRect(14, -7, 10, 14)
      ctx.fillStyle = '#666666'
      ctx.fillRect(14, -7, 10, 4)
      ctx.strokeRect(14, -7, 10, 4)
    }

    if (anim.attackFlash > 0 && weapon.type === 'projectile' && weapon.id !== 'grenade') {
      ctx.fillStyle = 'rgba(255,200,50,0.6)'
      ctx.beginPath()
      ctx.arc(weapon.id === 'shotgun' ? 18 : 16, 0, 6 + Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  },

  _drawHead(ctx, x, y, size, skin, face, isLow, isHit, angle, anim) {
    const headR = 14

    const grad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, headR)
    grad.addColorStop(0, this._lighten(skin, 20))
    grad.addColorStop(1, this._darken(skin, 15))

    ctx.fillStyle = isHit ? '#ffffff' : grad
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(x, y, headR, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    this._drawFace(ctx, x, y, headR, face, isLow, angle, anim)
  },

  _drawFace(ctx, x, y, r, face, isLow, angle, anim) {
    const eyeSpacing = r * 0.45
    const eyeY = y - r * 0.1
    const eyeR = face.eyes === 'big' ? r * 0.3 : face.eyes === 'narrow' ? r * 0.2 : r * 0.25

    for (const side of [-1, 1]) {
      const ex = x + side * eyeSpacing
      const ey = eyeY

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      if (face.eyes === 'narrow') {
        ctx.ellipse(ex, ey, eyeR * 1.2, eyeR * 0.7, 0, 0, Math.PI * 2)
      } else {
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 1.2
      ctx.stroke()

      const lookX = Math.cos(angle) * eyeR * 0.2
      const lookY = Math.sin(angle) * eyeR * 0.2
      const irisR = eyeR * 0.55
      ctx.fillStyle = isLow ? '#cc8800' : '#335588'
      ctx.beginPath()
      ctx.arc(ex + lookX, ey + lookY, irisR, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#111111'
      ctx.beginPath()
      ctx.arc(ex + lookX * 1.3, ey + lookY * 1.3, irisR * 0.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ex - eyeR * 0.15, ey - eyeR * 0.15, eyeR * 0.15, 0, Math.PI * 2)
      ctx.fill()

      if (face.brows === 'angled' || face.brows === 'low') {
        const browTilt = side * (face.brows === 'angled' ? 3 : 1)
        ctx.strokeStyle = '#1a1a2e'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(ex - eyeR, ey - eyeR - 2 + browTilt)
        ctx.lineTo(ex + eyeR, ey - eyeR - 2 - browTilt)
        ctx.stroke()
      }
      if (face.brows === 'raised') {
        ctx.strokeStyle = '#1a1a2e'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(ex, ey - eyeR - 3, eyeR * 0.8, Math.PI * 0.8, Math.PI * 0.2, true)
        ctx.stroke()
      }
    }

    const mouthY = y + r * 0.35
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'

    if (isLow) {
      ctx.beginPath()
      ctx.arc(x, mouthY + 3, r * 0.2, 0, Math.PI, true)
      ctx.stroke()
    } else if (face.mouth === 'smile') {
      ctx.beginPath()
      ctx.arc(x, mouthY - 2, r * 0.25, 0.2, Math.PI - 0.2)
      ctx.stroke()
    } else if (face.mouth === 'grin') {
      ctx.beginPath()
      ctx.arc(x, mouthY - 3, r * 0.3, 0.1, Math.PI - 0.1)
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(x, mouthY - 3, r * 0.28, 0.15, Math.PI - 0.15)
      ctx.fill()
    } else if (face.mouth === 'open') {
      ctx.fillStyle = '#331111'
      ctx.beginPath()
      ctx.ellipse(x, mouthY, r * 0.2, r * 0.15, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (face.mouth === 'frown') {
      ctx.beginPath()
      ctx.arc(x, mouthY + 6, r * 0.25, Math.PI + 0.2, -0.2)
      ctx.stroke()
    } else if (face.mouth === 'smirk') {
      ctx.beginPath()
      ctx.arc(x + r * 0.1, mouthY - 1, r * 0.2, 0.2, Math.PI - 0.5)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(x - r * 0.2, mouthY)
      ctx.lineTo(x + r * 0.2, mouthY)
      ctx.stroke()
    }
    ctx.lineCap = 'butt'
  },

  _drawHairHat(ctx, x, y, size, hair) {
    const r = 14
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2

    if (hair.type === 'none') return

    if (hair.type === 'hair') {
      ctx.fillStyle = hair.color
      ctx.beginPath()
      ctx.arc(x, y - 2, r + 1, Math.PI * 1.1, Math.PI * 1.9)
      ctx.fill()
      ctx.stroke()
    } else if (hair.type === 'cap') {
      ctx.fillStyle = hair.color
      ctx.beginPath()
      ctx.arc(x, y - 2, r + 2, Math.PI * 0.9, Math.PI * 2.1)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = this._darken(hair.color, 20)
      ctx.fillRect(x - r - 4, y - 4, r * 2 + 8, 4)
      ctx.strokeRect(x - r - 4, y - 4, r * 2 + 8, 4)
    } else if (hair.type === 'helmet') {
      ctx.fillStyle = hair.color
      ctx.beginPath()
      ctx.arc(x, y - 1, r + 3, Math.PI * 0.85, Math.PI * 2.15)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.beginPath()
      ctx.arc(x - 4, y - 6, 6, 0, Math.PI * 2)
      ctx.fill()
    } else if (hair.type === 'beanie') {
      ctx.fillStyle = hair.color
      ctx.beginPath()
      ctx.arc(x, y - 2, r + 1, Math.PI * 1, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = this._lighten(hair.color, 30)
      ctx.beginPath()
      ctx.arc(x, y - r - 2, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (hair.type === 'spiky') {
      ctx.fillStyle = hair.color
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 1.1 + (Math.PI * 0.8 / 6) * i
        const sx = x + Math.cos(a) * (r - 2)
        const sy = y - 2 + Math.sin(a) * (r - 2)
        const tx = x + Math.cos(a) * (r + 8)
        const ty = y - 2 + Math.sin(a) * (r + 8)
        ctx.beginPath()
        ctx.moveTo(sx - 3, sy)
        ctx.lineTo(tx, ty)
        ctx.lineTo(sx + 3, sy)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
    } else if (hair.type === 'crown') {
      ctx.fillStyle = hair.color
      ctx.beginPath()
      ctx.moveTo(x - r, y - 4)
      ctx.lineTo(x - r + 3, y - r - 6)
      ctx.lineTo(x - r / 2, y - r + 2)
      ctx.lineTo(x, y - r - 8)
      ctx.lineTo(x + r / 2, y - r + 2)
      ctx.lineTo(x + r - 3, y - r - 6)
      ctx.lineTo(x + r, y - 4)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#ff2222'
      ctx.beginPath()
      ctx.arc(x, y - r - 2, 2.5, 0, Math.PI * 2)
      ctx.fill()
    } else if (hair.type === 'bandana') {
      ctx.fillStyle = hair.color
      ctx.beginPath()
      ctx.arc(x, y - 2, r + 1, Math.PI * 0.95, Math.PI * 2.05)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = this._darken(hair.color, 25)
      ctx.fillRect(x - r - 2, y - 3, r * 2 + 4, 5)
      ctx.strokeRect(x - r - 2, y - 3, r * 2 + 4, 5)
      ctx.fillStyle = hair.color
      ctx.beginPath()
      ctx.moveTo(x + r, y - 1)
      ctx.lineTo(x + r + 10, y + 4)
      ctx.lineTo(x + r + 8, y + 8)
      ctx.lineTo(x + r - 2, y + 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (hair.type === 'tophat') {
      ctx.fillStyle = hair.color
      ctx.fillRect(x - 8, y - r - 16, 16, 16)
      ctx.strokeRect(x - 8, y - r - 16, 16, 16)
      ctx.fillRect(x - r - 2, y - r - 2, r * 2 + 4, 5)
      ctx.strokeRect(x - r - 2, y - r - 2, r * 2 + 4, 5)
      ctx.fillStyle = this._darken(hair.color, 15)
      ctx.fillRect(x - 7, y - r - 7, 14, 3)
    }
  },

  _drawGlasses(ctx, x, y, size, acc) {
    const r = 14
    const eyeY = y - r * 0.1
    const spacing = r * 0.45

    ctx.strokeStyle = acc.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x - spacing - 5, eyeY)
    ctx.lineTo(x + spacing + 5, eyeY)
    ctx.stroke()

    if (acc.type === 'sunglasses') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
    } else {
      ctx.fillStyle = 'rgba(200,220,255,0.2)'
    }

    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(x + side * spacing, eyeY, 5, 4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  },

  _drawBackpack(ctx, x, y, size, acc) {
    ctx.fillStyle = acc.color
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(x, y + 8, 8, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = this._darken(acc.color, 20)
    ctx.fillRect(x - 4, y + 4, 8, 3)
  },

  _drawScarf(ctx, x, y, size, acc) {
    ctx.fillStyle = acc.color
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(x, y - 8, 16, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillRect(x + 6, y - 6, 4, 12)
    ctx.strokeRect(x + 6, y - 6, 4, 12)
  },

  _drawCape(ctx, x, y, size, acc, anim) {
    const sway = anim.walking ? Math.sin((anim.time || 0) * 8) * 3 : 0
    ctx.fillStyle = acc.color
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - 10, y - 6)
    ctx.quadraticCurveTo(x - 14 + sway, y + 14, x - 8 + sway, y + 22)
    ctx.lineTo(x + 8 + sway, y + 22)
    ctx.quadraticCurveTo(x + 14 + sway, y + 14, x + 10, y - 6)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  },

  _drawMedal(ctx, x, y, size, acc) {
    ctx.strokeStyle = acc.color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - 3, y - 10)
    ctx.lineTo(x, y - 4)
    ctx.lineTo(x + 3, y - 10)
    ctx.stroke()
    ctx.fillStyle = acc.color
    ctx.beginPath()
    ctx.arc(x, y - 2, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.stroke()
  },

  _drawChain(ctx, x, y, size, acc) {
    ctx.strokeStyle = acc.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y - 6, 12, 0.3, Math.PI - 0.3)
    ctx.stroke()
    ctx.fillStyle = acc.color
    ctx.beginPath()
    ctx.arc(x, y + 4, 3, 0, Math.PI * 2)
    ctx.fill()
  },

  _drawBandolier(ctx, x, y, size, acc) {
    ctx.strokeStyle = acc.color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x - 12, y - 10)
    ctx.lineTo(x + 12, y + 6)
    ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const bx = x - 10 + i * 6
      const by = y - 8 + i * 4
      ctx.fillStyle = '#aa8833'
      ctx.fillRect(bx - 1.5, by - 2, 3, 5)
    }
  },

  _lighten(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount)
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount)
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount)
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
  },

  _darken(hex, amount) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
  },

  drawHealthBar(ctx, cx, cy, health, maxHealth) {
    const w = 56
    const h = 7
    const ratio = health / maxHealth
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
