const BRAWL_CHARACTERS = {
  sirius: {
    id: 'sirius',
    label: 'Sirius',
    robeColor: '#3b1a8e',
    robeDark: '#2a1065',
    robeLight: '#5533bb',
    skinColor: '#f0d5b0',
    skinLight: '#ffe8cc',
    eyeColor: '#ffdd44',
    eyeGlow: '#ffcc00',
    hatColor: '#2a1065',
    hatBand: '#ffd700',
    starColor: '#ffd700',
    capeColor: '#2a1065',
    capeInner: '#5533bb',
    staffColor: '#7744cc',
    orbColor: '#66ddff',
    orbGlow: '#44aaff',
  },
  kenji: {
    id: 'kenji',
    label: 'Kenji',
    armorRed: '#cc1122',
    armorDark: '#8b0011',
    armorDeep: '#660011',
    underArmor: '#2a2a3a',
    skinColor: '#f0d0a0',
    skinLight: '#ffe0c0',
    eyeColor: '#1a1a1a',
    helmetGray: '#555566',
    helmetDark: '#3a3a4a',
    crestGold: '#daa520',
    crestBright: '#ffd700',
    maskRed: '#aa1122',
    swordBlade: '#c0c8d8',
    swordEdge: '#e8eef8',
    swordGuard: '#daa520',
    swordHandle: '#442211',
  },
  nori: {
    id: 'nori',
    label: 'Nori',
    outfitDark: '#1a1a2e',
    outfitColor: '#2a2a44',
    outfitAccent: '#333355',
    skinColor: '#f5d5b5',
    skinLight: '#ffe8d0',
    eyeColor: '#44bbff',
    eyeBright: '#66ddff',
    hairColor: '#1a1a2e',
    hairShine: '#333355',
    bandPink: '#ff4488',
    bandBright: '#ff66aa',
    ribbonPink: '#ff5599',
    sashColor: '#ff4488',
    shurikenMetal: '#aabbcc',
    shurikenEdge: '#ddeeff',
    wrapColor: '#333355',
  },
}

const BrawlRenderer = {
  drawCharacter(ctx, x, y, size, angle, charId, state) {
    const ch = BRAWL_CHARACTERS[charId] || BRAWL_CHARACTERS.sirius
    const anim = state || {}
    const bounce = anim.walking ? Math.sin((anim.time || 0) * 12) * 2 : 0
    const breathe = Math.sin((anim.time || 0) * 2.5) * 0.5
    const isDead = anim.dead
    const isHit = anim.hitFlash > 0

    if (isDead) {
      ctx.save()
      ctx.globalAlpha = 0.5
    }

    switch (charId) {
      case 'kenji': this._drawKenji(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim); break
      case 'nori': this._drawNori(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim); break
      default: this._drawSirius(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim)
    }

    if (isDead) ctx.restore()
  },

  _drawSirius(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim) {
    const s = size
    const t = anim.time || 0

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.85, s * 0.7, s * 0.22, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(x, y + bounce * 0.3)
    const capeWave = Math.sin(t * 3) * 4
    const capeGrad = ctx.createLinearGradient(-s * 0.4, -s * 0.1, s * 0.4, s * 0.8)
    capeGrad.addColorStop(0, ch.capeColor)
    capeGrad.addColorStop(1, ch.capeInner)
    ctx.fillStyle = capeGrad
    ctx.beginPath()
    ctx.moveTo(-s * 0.32, -s * 0.05)
    ctx.quadraticCurveTo(-s * 0.55 + capeWave, s * 0.45, -s * 0.25, s * 0.85)
    ctx.lineTo(s * 0.25, s * 0.85)
    ctx.quadraticCurveTo(s * 0.55 - capeWave, s * 0.45, s * 0.32, -s * 0.05)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.starColor + '33'
    for (let i = 0; i < 4; i++) {
      const sx = -s * 0.15 + i * s * 0.1 + Math.sin(t * 2 + i) * s * 0.03
      const sy = s * 0.15 + i * s * 0.15
      this._drawStar(ctx, sx, sy, s * 0.04, 4)
    }
    ctx.restore()

    const legStep = anim.walking ? Math.sin(t * 14) * 3 : 0
    ctx.fillStyle = ch.robeDark
    ctx.beginPath()
    ctx.moveTo(x - s * 0.18, y + s * 0.3 + bounce)
    ctx.lineTo(x - s * 0.22, y + s * 0.7 + bounce - legStep)
    ctx.lineTo(x - s * 0.08, y + s * 0.7 + bounce - legStep)
    ctx.lineTo(x - s * 0.06, y + s * 0.3 + bounce)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.06, y + s * 0.3 + bounce)
    ctx.lineTo(x + s * 0.08, y + s * 0.7 + bounce + legStep)
    ctx.lineTo(x + s * 0.22, y + s * 0.7 + bounce + legStep)
    ctx.lineTo(x + s * 0.18, y + s * 0.3 + bounce)
    ctx.fill()
    ctx.fillStyle = '#1a0a3a'
    ctx.fillRect(x - s * 0.24, y + s * 0.66 + bounce - legStep, s * 0.18, s * 0.08)
    ctx.fillRect(x + s * 0.06, y + s * 0.66 + bounce + legStep, s * 0.18, s * 0.08)

    const bodyGrad = ctx.createLinearGradient(x - s * 0.35, y - s * 0.2, x + s * 0.35, y + s * 0.35)
    bodyGrad.addColorStop(0, ch.robeLight)
    bodyGrad.addColorStop(0.5, ch.robeColor)
    bodyGrad.addColorStop(1, ch.robeDark)
    ctx.fillStyle = isHit ? '#ffffff' : bodyGrad
    ctx.beginPath()
    ctx.ellipse(x, y + bounce, s * 0.36, s * 0.34, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a0a3a'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = ch.hatBand
    ctx.beginPath()
    ctx.moveTo(x - s * 0.1, y - s * 0.22 + bounce)
    ctx.lineTo(x, y + s * 0.05 + bounce)
    ctx.lineTo(x + s * 0.1, y - s * 0.22 + bounce)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.hatBand
    ctx.fillRect(x - s * 0.03, y - s * 0.1 + bounce, s * 0.06, s * 0.18)

    const headY = y - s * 0.45 + bounce + breathe
    const headGrad = ctx.createRadialGradient(x - s * 0.08, headY - s * 0.08, s * 0.02, x, headY, s * 0.3)
    headGrad.addColorStop(0, ch.skinLight)
    headGrad.addColorStop(1, ch.skinColor)
    ctx.fillStyle = isHit ? '#ffffff' : headGrad
    ctx.beginPath()
    ctx.arc(x, headY, s * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a0a3a'
    ctx.lineWidth = 1.5
    ctx.stroke()

    const hatBaseY = headY - s * 0.12
    ctx.fillStyle = ch.hatColor
    ctx.beginPath()
    ctx.ellipse(x, hatBaseY + s * 0.05, s * 0.38, s * 0.08, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(x - s * 0.3, hatBaseY + s * 0.05)
    ctx.quadraticCurveTo(x - s * 0.2, hatBaseY - s * 0.3, x - s * 0.05, hatBaseY - s * 0.55)
    ctx.lineTo(x + s * 0.05, hatBaseY - s * 0.55)
    ctx.quadraticCurveTo(x + s * 0.2, hatBaseY - s * 0.3, x + s * 0.3, hatBaseY + s * 0.05)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.hatBand
    ctx.beginPath()
    ctx.ellipse(x, hatBaseY + s * 0.05, s * 0.34, s * 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x - s * 0.34, hatBaseY + s * 0.02, s * 0.68, s * 0.06)

    ctx.save()
    ctx.shadowColor = ch.eyeGlow
    ctx.shadowBlur = 6
    ctx.fillStyle = ch.starColor
    this._drawStar(ctx, x, hatBaseY - s * 0.48, s * 0.08, 5)
    ctx.restore()

    const eyeDist = s * 0.12
    for (const side of [-1, 1]) {
      const ex = x + side * eyeDist
      const ey = headY + s * 0.04
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(ex, ey, s * 0.09, s * 0.08, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a0a3a'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.save()
      ctx.shadowColor = ch.eyeGlow
      ctx.shadowBlur = 4
      ctx.fillStyle = ch.eyeColor
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.03, ey + Math.sin(angle) * s * 0.03, s * 0.05, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.04, ey + Math.sin(angle) * s * 0.04, s * 0.025, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#fff8'
      ctx.beginPath()
      ctx.arc(ex - s * 0.02, ey - s * 0.02, s * 0.015, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = '#3a2040'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, headY + s * 0.16, s * 0.06, 0.15, Math.PI - 0.15)
    ctx.stroke()

    ctx.save()
    ctx.translate(x + Math.cos(angle) * s * 0.38, y + Math.sin(angle) * s * 0.1 + bounce)
    ctx.rotate(angle)

    ctx.fillStyle = ch.skinColor
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.09, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = ch.staffColor
    ctx.fillRect(s * 0.06, -s * 0.03, s * 0.38, s * 0.06)

    ctx.fillStyle = ch.hatBand
    ctx.fillRect(s * 0.06, -s * 0.035, s * 0.08, s * 0.07)
    ctx.fillRect(s * 0.35, -s * 0.04, s * 0.04, s * 0.08)

    ctx.save()
    ctx.shadowColor = ch.orbGlow
    ctx.shadowBlur = 10
    const orbGrad = ctx.createRadialGradient(s * 0.46 - s * 0.02, -s * 0.02, s * 0.01, s * 0.46, 0, s * 0.08)
    orbGrad.addColorStop(0, '#ffffff')
    orbGrad.addColorStop(0.3, ch.orbColor)
    orbGrad.addColorStop(1, ch.orbGlow + '88')
    ctx.fillStyle = orbGrad
    ctx.beginPath()
    ctx.arc(s * 0.46, 0, s * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = '#ffffff66'
    ctx.beginPath()
    ctx.arc(s * 0.43, -s * 0.03, s * 0.025, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  },

  _drawKenji(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim) {
    const s = size
    const t = anim.time || 0

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.85, s * 0.7, s * 0.22, 0, 0, Math.PI * 2)
    ctx.fill()

    const legStep = anim.walking ? Math.sin(t * 14) * 3 : 0
    ctx.fillStyle = ch.underArmor
    ctx.fillRect(x - s * 0.2, y + s * 0.32 + bounce, s * 0.14, s * 0.38 - legStep)
    ctx.fillRect(x + s * 0.06, y + s * 0.32 + bounce, s * 0.14, s * 0.38 + legStep)

    ctx.fillStyle = ch.armorDark
    ctx.fillRect(x - s * 0.24, y + s * 0.5 + bounce - legStep, s * 0.2, s * 0.12)
    ctx.fillRect(x + s * 0.04, y + s * 0.5 + bounce + legStep, s * 0.2, s * 0.12)

    ctx.fillStyle = '#1a1a28'
    ctx.fillRect(x - s * 0.24, y + s * 0.66 + bounce - legStep, s * 0.2, s * 0.1)
    ctx.fillRect(x + s * 0.04, y + s * 0.66 + bounce + legStep, s * 0.2, s * 0.1)

    const bodyGrad = ctx.createLinearGradient(x - s * 0.4, y - s * 0.3, x + s * 0.4, y + s * 0.4)
    bodyGrad.addColorStop(0, ch.armorRed)
    bodyGrad.addColorStop(0.5, ch.armorDark)
    bodyGrad.addColorStop(1, ch.armorDeep)
    ctx.fillStyle = isHit ? '#ffffff' : bodyGrad
    ctx.beginPath()
    ctx.ellipse(x, y + bounce, s * 0.4, s * 0.38, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a0a0a'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.strokeStyle = ch.crestGold + '66'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y - s * 0.2 + bounce)
    ctx.lineTo(x, y + s * 0.25 + bounce)
    ctx.stroke()

    ctx.fillStyle = ch.crestGold
    ctx.fillRect(x - s * 0.22, y - s * 0.2 + bounce, s * 0.44, s * 0.05)

    for (const side of [-1, 1]) {
      const sx = x + side * s * 0.38
      const sy = y - s * 0.05 + bounce
      const sodeGrad = ctx.createLinearGradient(sx - side * s * 0.15, sy - s * 0.12, sx + side * s * 0.15, sy + s * 0.12)
      sodeGrad.addColorStop(0, ch.armorRed)
      sodeGrad.addColorStop(1, ch.armorDark)
      ctx.fillStyle = isHit ? '#ffffff' : sodeGrad
      ctx.beginPath()
      ctx.moveTo(sx - side * s * 0.05, sy - s * 0.15)
      ctx.lineTo(sx + side * s * 0.12, sy - s * 0.1)
      ctx.lineTo(sx + side * s * 0.12, sy + s * 0.15)
      ctx.lineTo(sx - side * s * 0.05, sy + s * 0.1)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = ch.crestGold + '88'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    const headY = y - s * 0.48 + bounce + breathe

    const headGrad = ctx.createRadialGradient(x - s * 0.06, headY - s * 0.06, s * 0.02, x, headY, s * 0.28)
    headGrad.addColorStop(0, ch.skinLight)
    headGrad.addColorStop(1, ch.skinColor)
    ctx.fillStyle = isHit ? '#ffffff' : headGrad
    ctx.beginPath()
    ctx.arc(x, headY, s * 0.28, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = ch.maskRed
    ctx.beginPath()
    ctx.arc(x, headY, s * 0.28, 0.15, Math.PI - 0.15)
    ctx.lineTo(x - s * 0.1, headY + s * 0.05)
    ctx.quadraticCurveTo(x, headY + s * 0.15, x + s * 0.1, headY + s * 0.05)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#660011'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.strokeStyle = '#1a0a0a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - s * 0.06, headY + s * 0.16)
    ctx.lineTo(x + s * 0.06, headY + s * 0.16)
    ctx.stroke()

    const helmetGrad = ctx.createLinearGradient(x - s * 0.3, headY - s * 0.3, x + s * 0.3, headY)
    helmetGrad.addColorStop(0, ch.helmetGray)
    helmetGrad.addColorStop(0.5, ch.helmetDark)
    helmetGrad.addColorStop(1, ch.helmetGray)
    ctx.fillStyle = isHit ? '#ffffff' : helmetGrad
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.02, s * 0.3, Math.PI * 1.1, Math.PI * 1.9)
    ctx.quadraticCurveTo(x + s * 0.15, headY - s * 0.42, x, headY - s * 0.38)
    ctx.quadraticCurveTo(x - s * 0.15, headY - s * 0.42, x - s * 0.3, headY - s * 0.08)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#2a2a3a'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = ch.crestGold
    ctx.strokeStyle = '#aa8800'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - s * 0.35, headY - s * 0.08)
    ctx.lineTo(x - s * 0.28, headY - s * 0.15)
    ctx.lineTo(x + s * 0.28, headY - s * 0.15)
    ctx.lineTo(x + s * 0.35, headY - s * 0.08)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = ch.crestBright
    ctx.beginPath()
    ctx.moveTo(x - s * 0.04, headY - s * 0.3)
    ctx.lineTo(x, headY - s * 0.58)
    ctx.lineTo(x + s * 0.04, headY - s * 0.3)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = ch.crestGold
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = ch.crestGold
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.3, s * 0.04, 0, Math.PI * 2)
    ctx.fill()

    const eyeDist = s * 0.1
    for (const side of [-1, 1]) {
      const ex = x + side * eyeDist
      const ey = headY + s * 0.01
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(ex, ey, s * 0.07, s * 0.055, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = ch.eyeColor
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.025, ey + Math.sin(angle) * s * 0.025, s * 0.04, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#fff6'
      ctx.beginPath()
      ctx.arc(ex - s * 0.015, ey - s * 0.015, s * 0.012, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#2a1a1a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(ex - side * s * 0.07, ey - s * 0.08)
      ctx.lineTo(ex + side * s * 0.07, ey - s * 0.05)
      ctx.stroke()
    }

    ctx.save()
    ctx.translate(x + Math.cos(angle) * s * 0.35, y + Math.sin(angle) * s * 0.05 + bounce)
    ctx.rotate(angle)

    ctx.fillStyle = ch.skinColor
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.09, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = ch.swordHandle
    ctx.fillRect(s * 0.06, -s * 0.035, s * 0.12, s * 0.07)

    ctx.fillStyle = ch.swordGuard
    ctx.beginPath()
    ctx.ellipse(s * 0.18, 0, s * 0.025, s * 0.07, 0, 0, Math.PI * 2)
    ctx.fill()

    const bladeGrad = ctx.createLinearGradient(s * 0.2, -s * 0.04, s * 0.2, s * 0.04)
    bladeGrad.addColorStop(0, ch.swordEdge)
    bladeGrad.addColorStop(0.5, ch.swordBlade)
    bladeGrad.addColorStop(1, ch.swordEdge)
    ctx.fillStyle = bladeGrad
    ctx.beginPath()
    ctx.moveTo(s * 0.2, -s * 0.03)
    ctx.lineTo(s * 0.65, -s * 0.015)
    ctx.lineTo(s * 0.7, 0)
    ctx.lineTo(s * 0.65, s * 0.015)
    ctx.lineTo(s * 0.2, s * 0.03)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#8898a8'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(s * 0.2, 0)
    ctx.lineTo(s * 0.68, 0)
    ctx.stroke()

    ctx.restore()
  },

  _drawNori(ctx, x, y, size, angle, ch, bounce, breathe, isHit, anim) {
    const s = size
    const t = anim.time || 0

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.85, s * 0.65, s * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()

    const legStep = anim.walking ? Math.sin(t * 14) * 3.5 : 0
    ctx.fillStyle = ch.outfitDark
    ctx.fillRect(x - s * 0.16, y + s * 0.33 + bounce, s * 0.11, s * 0.32 - legStep)
    ctx.fillRect(x + s * 0.05, y + s * 0.33 + bounce, s * 0.11, s * 0.32 + legStep)

    ctx.fillStyle = ch.wrapColor
    for (const side of [-1, 1]) {
      const lx = side < 0 ? x - s * 0.16 : x + s * 0.05
      const ly = y + s * 0.38 + bounce + (side < 0 ? -legStep : legStep)
      ctx.fillRect(lx, ly, s * 0.11, s * 0.04)
      ctx.fillRect(lx, ly + s * 0.1, s * 0.11, s * 0.04)
    }

    ctx.fillStyle = '#0a0a18'
    ctx.fillRect(x - s * 0.18, y + s * 0.62 + bounce - legStep, s * 0.14, s * 0.08)
    ctx.fillRect(x + s * 0.04, y + s * 0.62 + bounce + legStep, s * 0.14, s * 0.08)

    const bodyGrad = ctx.createLinearGradient(x - s * 0.35, y - s * 0.2, x + s * 0.35, y + s * 0.35)
    bodyGrad.addColorStop(0, ch.outfitAccent)
    bodyGrad.addColorStop(0.5, ch.outfitColor)
    bodyGrad.addColorStop(1, ch.outfitDark)
    ctx.fillStyle = isHit ? '#ffffff' : bodyGrad
    ctx.beginPath()
    ctx.ellipse(x, y + bounce, s * 0.34, s * 0.32, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0a0a18'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = ch.sashColor
    ctx.save()
    ctx.translate(x, y + bounce)
    ctx.rotate(0.4)
    ctx.fillRect(-s * 0.34, -s * 0.03, s * 0.68, s * 0.06)
    ctx.restore()

    ctx.fillStyle = ch.wrapColor
    for (const side of [-1, 1]) {
      const ax = x + side * s * 0.28
      const ay = y + s * 0.05 + bounce
      ctx.fillRect(ax - s * 0.04, ay - s * 0.12, s * 0.08, s * 0.04)
      ctx.fillRect(ax - s * 0.04, ay, s * 0.08, s * 0.04)
    }

    const headY = y - s * 0.43 + bounce + breathe
    const headGrad = ctx.createRadialGradient(x - s * 0.06, headY - s * 0.06, s * 0.02, x, headY, s * 0.28)
    headGrad.addColorStop(0, ch.skinLight)
    headGrad.addColorStop(1, ch.skinColor)
    ctx.fillStyle = isHit ? '#ffffff' : headGrad
    ctx.beginPath()
    ctx.arc(x, headY, s * 0.28, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = ch.hairColor
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.04, s * 0.29, Math.PI * 1.05, Math.PI * 1.95)
    ctx.quadraticCurveTo(x + s * 0.15, headY - s * 0.42, x, headY - s * 0.38)
    ctx.quadraticCurveTo(x - s * 0.15, headY - s * 0.42, x - s * 0.29, headY - s * 0.08)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.hairShine
    ctx.beginPath()
    ctx.arc(x - s * 0.08, headY - s * 0.25, s * 0.06, 0, Math.PI * 2)
    ctx.fill()

    for (const side of [-1, 1]) {
      const tailX = x + side * s * 0.18
      const tailBaseY = headY + s * 0.05
      const tailWave = Math.sin(t * 4 + side) * s * 0.04
      ctx.fillStyle = ch.hairColor
      ctx.beginPath()
      ctx.moveTo(tailX - s * 0.06, tailBaseY)
      ctx.quadraticCurveTo(
        tailX + side * s * 0.15 + tailWave, tailBaseY + s * 0.25,
        tailX + side * s * 0.08, tailBaseY + s * 0.5
      )
      ctx.quadraticCurveTo(
        tailX + side * s * 0.02, tailBaseY + s * 0.45,
        tailX + side * s * 0.05 + tailWave, tailBaseY + s * 0.2
      )
      ctx.quadraticCurveTo(tailX, tailBaseY + s * 0.1, tailX + s * 0.04, tailBaseY)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = ch.bandPink
      ctx.beginPath()
      ctx.arc(tailX + side * s * 0.02, tailBaseY, s * 0.04, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = ch.bandPink
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.05, s * 0.3, Math.PI * 1.12, Math.PI * 1.88)
    ctx.arc(x, headY - s * 0.05, s * 0.24, Math.PI * 1.88, Math.PI * 1.12, true)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = ch.bandBright
    ctx.beginPath()
    ctx.arc(x, headY - s * 0.17, s * 0.04, 0, Math.PI * 2)
    ctx.fill()

    const ribbonWave = Math.sin(t * 5) * s * 0.03
    ctx.fillStyle = ch.ribbonPink
    ctx.save()
    ctx.translate(x + s * 0.26, headY - s * 0.1)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(s * 0.08 + ribbonWave, s * 0.12, s * 0.04, s * 0.28)
    ctx.lineTo(s * 0.08, s * 0.26)
    ctx.quadraticCurveTo(s * 0.12 + ribbonWave, s * 0.1, s * 0.04, -s * 0.02)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(s * 0.02, 0)
    ctx.quadraticCurveTo(s * 0.12 - ribbonWave, s * 0.08, s * 0.08, s * 0.22)
    ctx.lineTo(s * 0.12, s * 0.2)
    ctx.quadraticCurveTo(s * 0.14 - ribbonWave, s * 0.06, s * 0.06, -s * 0.02)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    const eyeDist = s * 0.1
    for (const side of [-1, 1]) {
      const ex = x + side * eyeDist
      const ey = headY + s * 0.04
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(ex, ey, s * 0.09, s * 0.08, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 1
      ctx.stroke()

      const irisGrad = ctx.createRadialGradient(
        ex + Math.cos(angle) * s * 0.02, ey + Math.sin(angle) * s * 0.02, s * 0.01,
        ex + Math.cos(angle) * s * 0.03, ey + Math.sin(angle) * s * 0.03, s * 0.045
      )
      irisGrad.addColorStop(0, ch.eyeBright)
      irisGrad.addColorStop(1, ch.eyeColor)
      ctx.fillStyle = irisGrad
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.03, ey + Math.sin(angle) * s * 0.03, s * 0.045, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * s * 0.035, ey + Math.sin(angle) * s * 0.035, s * 0.022, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#fff8'
      ctx.beginPath()
      ctx.arc(ex - s * 0.015, ey - s * 0.02, s * 0.015, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(ex, ey - s * 0.05, s * 0.06, Math.PI * 0.1, Math.PI * 0.9)
      ctx.stroke()
    }

    ctx.strokeStyle = '#cc3366'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, headY + s * 0.14, s * 0.05, 0.2, Math.PI - 0.2)
    ctx.stroke()

    ctx.fillStyle = '#ffaacc22'
    ctx.beginPath()
    ctx.arc(x - s * 0.18, headY + s * 0.1, s * 0.05, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + s * 0.18, headY + s * 0.1, s * 0.05, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(x + Math.cos(angle) * s * 0.32, y + Math.sin(angle) * s * 0.05 + bounce)
    ctx.rotate(angle)

    ctx.fillStyle = ch.skinColor
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2)
    ctx.fill()

    const starSpin = t * 6
    ctx.save()
    ctx.translate(s * 0.22, 0)
    ctx.rotate(starSpin)
    ctx.fillStyle = ch.shurikenMetal
    for (let i = 0; i < 4; i++) {
      ctx.save()
      ctx.rotate(i * Math.PI / 2)
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.015)
      ctx.lineTo(s * 0.1, -s * 0.01)
      ctx.lineTo(s * 0.11, 0)
      ctx.lineTo(s * 0.1, s * 0.01)
      ctx.lineTo(0, s * 0.015)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
    ctx.fillStyle = ch.outfitDark
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.025, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.restore()
  },

  _drawStar(ctx, cx, cy, r, points) {
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const a = (i * Math.PI / points) - Math.PI / 2
      const rad = i % 2 === 0 ? r : r * 0.4
      const sx = cx + Math.cos(a) * rad
      const sy = cy + Math.sin(a) * rad
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    }
    ctx.closePath()
    ctx.fill()
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
