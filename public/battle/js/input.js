const Input = {
  keys: {},
  mouse: { x: 0, y: 0, down: false },

  touch: {
    active: false,
    moveId: null,
    moveStartX: 0,
    moveStartY: 0,
    moveDx: 0,
    moveDy: 0,
    shootId: null,
    shootX: 0,
    shootY: 0,
    shooting: false,
  },

  joystick: {
    visible: false,
    baseX: 0, baseY: 0,
    stickX: 0, stickY: 0,
  },

  init(canvas) {
    this.canvas = canvas

    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true
      if (e.key === ' ') e.preventDefault()
    })

    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false
    })

    canvas.addEventListener('mousemove', e => {
      const p = this._pos(e)
      this.mouse.x = p.x
      this.mouse.y = p.y
    })

    canvas.addEventListener('mousedown', e => { e.preventDefault(); this.mouse.down = true })
    canvas.addEventListener('mouseup', e => { this.mouse.down = false })
    canvas.addEventListener('contextmenu', e => e.preventDefault())
    canvas.addEventListener('dragstart', e => e.preventDefault())

    // --- Touch controls ---
    // Left half of screen = virtual joystick (drag to move)
    // Right half of screen = tap/drag to aim and shoot

    canvas.addEventListener('touchstart', e => {
      e.preventDefault()
      this.touch.active = true
      for (const t of e.changedTouches) {
        const p = this._touchPos(t)
        if (p.x < canvas.width / 2) {
          this.touch.moveId = t.identifier
          this.touch.moveStartX = p.x
          this.touch.moveStartY = p.y
          this.touch.moveDx = 0
          this.touch.moveDy = 0
          this.joystick.visible = true
          this.joystick.baseX = p.x
          this.joystick.baseY = p.y
          this.joystick.stickX = p.x
          this.joystick.stickY = p.y
        } else {
          this.touch.shootId = t.identifier
          this.touch.shootX = p.x
          this.touch.shootY = p.y
          this.touch.shooting = true
        }
      }
    }, { passive: false })

    canvas.addEventListener('touchmove', e => {
      e.preventDefault()
      for (const t of e.changedTouches) {
        const p = this._touchPos(t)
        if (t.identifier === this.touch.moveId) {
          const dx = p.x - this.touch.moveStartX
          const dy = p.y - this.touch.moveStartY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 50
          if (dist > 0) {
            const clamped = Math.min(dist, maxDist)
            this.touch.moveDx = (dx / dist) * (clamped / maxDist)
            this.touch.moveDy = (dy / dist) * (clamped / maxDist)
            this.joystick.stickX = this.touch.moveStartX + (dx / dist) * clamped
            this.joystick.stickY = this.touch.moveStartY + (dy / dist) * clamped
          }
        }
        if (t.identifier === this.touch.shootId) {
          this.touch.shootX = p.x
          this.touch.shootY = p.y
        }
      }
    }, { passive: false })

    canvas.addEventListener('touchend', e => {
      e.preventDefault()
      for (const t of e.changedTouches) {
        if (t.identifier === this.touch.moveId) {
          this.touch.moveId = null
          this.touch.moveDx = 0
          this.touch.moveDy = 0
          this.joystick.visible = false
        }
        if (t.identifier === this.touch.shootId) {
          this.touch.shootId = null
          this.touch.shooting = false
        }
      }
    }, { passive: false })

    canvas.addEventListener('touchcancel', () => {
      this.touch.moveId = null
      this.touch.moveDx = 0
      this.touch.moveDy = 0
      this.touch.shootId = null
      this.touch.shooting = false
      this.joystick.visible = false
    })
  },

  isDown(key) {
    return !!this.keys[key]
  },

  _pos(e) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    }
  },

  _touchPos(t) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (t.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (t.clientY - rect.top) * (this.canvas.height / rect.height),
    }
  },
}
