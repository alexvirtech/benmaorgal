const WORLD_THEMES = [
  {
    id: 'forest',
    name: 'Forest',
    ground: '#3a7d2c',
    groundDot: '#429432',
    border: '#2a5a1e',
    wallColor: '#5a4a30',
    wallStroke: '#3a2a10',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#4a3a20'
      for (let lx = obs.x + 8; lx < obs.x + obs.w - 4; lx += 16) {
        ctx.fillRect(lx, obs.y + 2, 2, obs.h - 4)
      }
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#2d6b1e',
    boxStroke: '#1a4a10',
    boxDraw(ctx, obs) {
      ctx.fillStyle = this.boxColor
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3a8a28'
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2 - 4, obs.y + obs.h / 2 - 6, obs.w / 2 - 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#6b4422'
      ctx.fillRect(obs.x + obs.w / 2 - 3, obs.y + obs.h / 2 + 6, 6, obs.h / 2 - 6)
    },
    decos: ['🌲', '🌿', '🍃', '🌳', '🍄'],
  },
  {
    id: 'city',
    name: 'City Streets',
    ground: '#555566',
    groundDot: '#4a4a5a',
    border: '#333344',
    wallColor: '#8899aa',
    wallStroke: '#556677',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#99aabb'
      const floors = Math.floor(obs.h / 10) || 1
      for (let f = 0; f < floors; f++) {
        for (let wx = obs.x + 4; wx < obs.x + obs.w - 6; wx += 12) {
          ctx.fillStyle = '#667799'
          ctx.fillRect(wx, obs.y + 3 + f * 10, 8, 6)
          ctx.fillStyle = '#aaccee44'
          ctx.fillRect(wx + 1, obs.y + 4 + f * 10, 6, 4)
        }
      }
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#cc8833',
    boxStroke: '#aa6622',
    boxDraw(ctx, obs) {
      ctx.fillStyle = '#ffcc22'
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.strokeStyle = '#cc9900'
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#cc9900'
      ctx.fillRect(obs.x + obs.w / 2 - 6, obs.y + 4, 12, obs.h - 8)
      ctx.fillRect(obs.x + 4, obs.y + obs.h / 2 - 6, obs.w - 8, 12)
    },
    decos: ['🚗', '🚕', '🏢', '🚦', '🚙'],
  },
  {
    id: 'desert',
    name: 'Desert',
    ground: '#c4a44a',
    groundDot: '#b89838',
    border: '#8a6a2a',
    wallColor: '#cc8844',
    wallStroke: '#aa6622',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#bb7733'
      for (let bx = obs.x; bx < obs.x + obs.w; bx += 20) {
        ctx.fillRect(bx, obs.y, 18, obs.h / 2)
        ctx.fillRect(bx + 10, obs.y + obs.h / 2, 18, obs.h / 2)
      }
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#44aa44',
    boxStroke: '#228822',
    boxDraw(ctx, obs) {
      ctx.fillStyle = '#44aa44'
      const cx = obs.x + obs.w / 2
      const cy = obs.y + obs.h / 2
      ctx.beginPath()
      ctx.moveTo(cx, cy - obs.h / 2)
      ctx.lineTo(cx + obs.w / 2, cy + obs.h / 4)
      ctx.lineTo(cx - obs.w / 2, cy + obs.h / 4)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#886633'
      ctx.fillRect(cx - 3, cy + obs.h / 4, 6, obs.h / 4)
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx, cy - obs.h / 2)
      ctx.lineTo(cx + obs.w / 2, cy + obs.h / 4)
      ctx.lineTo(cx - obs.w / 2, cy + obs.h / 4)
      ctx.closePath()
      ctx.stroke()
    },
    decos: ['🌵', '☀️', '🏜️', '🦂', '💀'],
  },
  {
    id: 'snow',
    name: 'Snow Land',
    ground: '#ddeeff',
    groundDot: '#ccddee',
    border: '#8899bb',
    wallColor: '#99bbdd',
    wallStroke: '#6688aa',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#bbddff'
      ctx.fillRect(obs.x, obs.y, obs.w, 4)
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#ffffff',
    boxStroke: '#aabbcc',
    boxDraw(ctx, obs) {
      ctx.fillStyle = '#eef4ff'
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2 - 8, obs.w / 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2)
      ctx.stroke()
    },
    decos: ['❄️', '⛄', '🌨️', '🎿', '🧊'],
  },
  {
    id: 'lava',
    name: 'Lava World',
    ground: '#4a2222',
    groundDot: '#5a2a2a',
    border: '#ff4422',
    wallColor: '#663322',
    wallStroke: '#441a11',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#884433'
      for (let rx = obs.x + 3; rx < obs.x + obs.w - 6; rx += 10) {
        ctx.fillRect(rx, obs.y + 2, 6, obs.h - 4)
      }
      ctx.fillStyle = '#ff660044'
      ctx.fillRect(obs.x, obs.y + obs.h - 3, obs.w, 3)
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#ff6622',
    boxStroke: '#cc4411',
    boxDraw(ctx, obs) {
      ctx.fillStyle = '#ff6622'
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#ffaa44'
      ctx.fillRect(obs.x + 4, obs.y + 4, obs.w - 8, obs.h - 8)
      ctx.fillStyle = '#ffdd66'
      ctx.fillRect(obs.x + 10, obs.y + 10, obs.w - 20, obs.h - 20)
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    decos: ['🌋', '🔥', '💎', '⚡', '🪨'],
  },
  {
    id: 'candy',
    name: 'Candy Land',
    ground: '#ffaacc',
    groundDot: '#ff99bb',
    border: '#dd6699',
    wallColor: '#ff6699',
    wallStroke: '#dd4477',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#ffffff'
      for (let sx = obs.x; sx < obs.x + obs.w; sx += 14) {
        ctx.fillRect(sx, obs.y, 7, obs.h)
      }
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#44ccff',
    boxStroke: '#22aadd',
    boxDraw(ctx, obs) {
      ctx.fillStyle = '#44ccff'
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ff4466'
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2 - 4, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2 + 8, obs.y + obs.h / 2 + 4, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2)
      ctx.stroke()
    },
    decos: ['🍭', '🍬', '🧁', '🍩', '🎂'],
  },
  {
    id: 'space',
    name: 'Space Station',
    ground: '#111133',
    groundDot: '#222244',
    border: '#4444aa',
    wallColor: '#555577',
    wallStroke: '#333355',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#6666aa'
      ctx.fillRect(obs.x + 2, obs.y + 2, obs.w - 4, 3)
      ctx.fillRect(obs.x + 2, obs.y + obs.h - 5, obs.w - 4, 3)
      ctx.fillStyle = '#44ffaa33'
      for (let lx = obs.x + 10; lx < obs.x + obs.w - 8; lx += 20) {
        ctx.fillRect(lx, obs.y + 6, 4, obs.h - 12)
      }
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#3344aa',
    boxStroke: '#222288',
    boxDraw(ctx, obs) {
      ctx.fillStyle = this.boxColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#4466cc'
      ctx.fillRect(obs.x + 4, obs.y + 4, obs.w - 8, obs.h - 8)
      ctx.save()
      ctx.shadowColor = '#44ffaa'
      ctx.shadowBlur = 8
      ctx.fillStyle = '#44ffaa'
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    decos: ['🚀', '⭐', '🛸', '🌙', '🪐'],
  },
  {
    id: 'beach',
    name: 'Beach',
    ground: '#e8d4a0',
    groundDot: '#dcc890',
    border: '#44aadd',
    wallColor: '#aa8855',
    wallStroke: '#886633',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#996644'
      for (let bx = obs.x + 2; bx < obs.x + obs.w - 4; bx += 8) {
        ctx.fillRect(bx, obs.y, 6, obs.h)
      }
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#ff8844',
    boxStroke: '#cc6622',
    boxDraw(ctx, obs) {
      ctx.fillStyle = '#ffcc44'
      ctx.beginPath()
      ctx.moveTo(obs.x + obs.w / 2, obs.y)
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h)
      ctx.lineTo(obs.x, obs.y + obs.h)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#ff8844'
      ctx.fillRect(obs.x + obs.w / 2 - 1, obs.y, 2, obs.h)
    },
    decos: ['🏖️', '🌊', '🐚', '🦀', '🏄'],
  },
  {
    id: 'medieval',
    name: 'Medieval Castle',
    ground: '#6a7a5a',
    groundDot: '#5a6a4a',
    border: '#4a4a4a',
    wallColor: '#888888',
    wallStroke: '#555555',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#777777'
      for (let bx = obs.x; bx < obs.x + obs.w; bx += 14) {
        for (let by = obs.y; by < obs.y + obs.h; by += 8) {
          const off = (Math.floor((by - obs.y) / 8) % 2) * 7
          ctx.strokeStyle = '#666666'
          ctx.lineWidth = 0.5
          ctx.strokeRect(bx + off, by, 12, 7)
        }
      }
      ctx.fillStyle = '#999999'
      for (let tx = obs.x; tx < obs.x + obs.w; tx += 12) {
        ctx.fillRect(tx, obs.y - 4, 8, 4)
      }
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#aa7744',
    boxStroke: '#885522',
    boxDraw(ctx, obs) {
      ctx.fillStyle = this.boxColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.strokeStyle = '#665533'
      ctx.lineWidth = 1.5
      ctx.strokeRect(obs.x + 3, obs.y + 3, obs.w - 6, obs.h - 6)
      ctx.fillStyle = '#887744'
      ctx.fillRect(obs.x + obs.w / 2 - 4, obs.y + obs.h / 2 - 4, 8, 8)
      ctx.fillStyle = '#ffcc44'
      ctx.beginPath()
      ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    decos: ['🏰', '⚔️', '🛡️', '👑', '🏹'],
  },
  {
    id: 'underwater',
    name: 'Underwater',
    ground: '#1a4466',
    groundDot: '#1a5577',
    border: '#0a3355',
    wallColor: '#448866',
    wallStroke: '#226644',
    wallDraw(ctx, obs) {
      ctx.fillStyle = this.wallColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.fillStyle = '#55aa88'
      for (let fx = obs.x + 5; fx < obs.x + obs.w; fx += 15) {
        const fh = 8 + (fx * 7 % 6)
        ctx.beginPath()
        ctx.moveTo(fx, obs.y + obs.h)
        ctx.quadraticCurveTo(fx + 4, obs.y + obs.h - fh, fx + 8, obs.y + obs.h)
        ctx.fill()
      }
      ctx.strokeStyle = this.wallStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    },
    boxColor: '#cc6688',
    boxStroke: '#aa4466',
    boxDraw(ctx, obs) {
      ctx.fillStyle = this.boxColor
      const cx = obs.x + obs.w / 2
      const cy = obs.y + obs.h / 2
      ctx.beginPath()
      ctx.arc(cx, cy, obs.w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffaacc'
      ctx.beginPath()
      ctx.arc(cx - 4, cy - 4, obs.w / 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = this.boxStroke
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, obs.w / 2, 0, Math.PI * 2)
      ctx.stroke()
    },
    decos: ['🐟', '🐠', '🐙', '🌊', '🐚'],
  },
]

let _activeTheme = null
let _decoPositions = []

function getRandomTheme() {
  const idx = Math.floor(Math.random() * WORLD_THEMES.length)
  _activeTheme = WORLD_THEMES[idx]
  _generateDecos()
  return _activeTheme
}

function getActiveTheme() {
  if (!_activeTheme) getRandomTheme()
  return _activeTheme
}

function _generateDecos() {
  _decoPositions = []
  const t = _activeTheme
  if (!t || !t.decos) return
  for (let i = 0; i < 18; i++) {
    _decoPositions.push({
      x: 30 + Math.floor(Math.random() * 900),
      y: 30 + Math.floor(Math.random() * 580),
      emoji: t.decos[Math.floor(Math.random() * t.decos.length)],
      size: 14 + Math.floor(Math.random() * 10),
      alpha: 0.25 + Math.random() * 0.2,
    })
  }
}

function drawThemedArena(ctx, w, h, obstacles) {
  const t = getActiveTheme()

  ctx.fillStyle = t.ground
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = t.groundDot
  for (let gx = 20; gx < w; gx += 50) {
    for (let gy = 20; gy < h; gy += 50) {
      ctx.beginPath()
      ctx.arc(gx, gy, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.globalAlpha = 1
  _decoPositions.forEach(d => {
    ctx.globalAlpha = d.alpha
    ctx.font = d.size + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(d.emoji, d.x, d.y)
  })
  ctx.globalAlpha = 1

  ctx.strokeStyle = t.border
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, w - 6, h - 6)

  obstacles.forEach(obs => {
    if (obs.type === 'wall') {
      t.wallDraw(ctx, obs)
    } else {
      t.boxDraw(ctx, obs)
    }
  })

  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText(t.name, 10, 8)
}
