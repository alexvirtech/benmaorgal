export class InputManager {
  constructor() {
    this.keys = {}
    this.actions = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      fire: false,
    }
    this.pointer = { x: 0, y: 0, down: false, clicked: false }
    this._clickedThisFrame = false
    this._boundKeyDown = null
    this._boundKeyUp = null
    this._boundPointerDown = null
    this._boundPointerMove = null
    this._boundPointerUp = null
    this._canvas = null
  }

  attach(canvas) {
    this._canvas = canvas

    this._boundKeyDown = (e) => {
      this.keys[e.code] = true
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
    }
    this._boundKeyUp = (e) => {
      this.keys[e.code] = false
    }

    this._boundPointerDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = 800 / rect.width
      const scaleY = 600 / rect.height
      this.pointer.x = (e.clientX - rect.left) * scaleX
      this.pointer.y = (e.clientY - rect.top) * scaleY
      this.pointer.down = true
      this._clickedThisFrame = true
    }

    this._boundPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = 800 / rect.width
      const scaleY = 600 / rect.height
      this.pointer.x = (e.clientX - rect.left) * scaleX
      this.pointer.y = (e.clientY - rect.top) * scaleY
    }

    this._boundPointerUp = () => {
      this.pointer.down = false
    }

    window.addEventListener('keydown', this._boundKeyDown)
    window.addEventListener('keyup', this._boundKeyUp)
    canvas.addEventListener('pointerdown', this._boundPointerDown)
    canvas.addEventListener('pointermove', this._boundPointerMove)
    canvas.addEventListener('pointerup', this._boundPointerUp)
  }

  update() {
    this.actions.left = this.keys['ArrowLeft'] || this.keys['KeyA'] || false
    this.actions.right = this.keys['ArrowRight'] || this.keys['KeyD'] || false
    this.actions.up = this.keys['ArrowUp'] || this.keys['KeyW'] || false
    this.actions.down = this.keys['ArrowDown'] || this.keys['KeyS'] || false
    this.actions.jump = this.keys['Space'] || this.keys['ArrowUp'] || false
    this.actions.fire = this.keys['Space'] || this.keys['KeyX'] || false
    this.pointer.clicked = this._clickedThisFrame
    this._clickedThisFrame = false
  }

  setAction(action, value) {
    this.actions[action] = value
  }

  detach() {
    if (this._boundKeyDown) {
      window.removeEventListener('keydown', this._boundKeyDown)
      window.removeEventListener('keyup', this._boundKeyUp)
    }
    if (this._canvas) {
      this._canvas.removeEventListener('pointerdown', this._boundPointerDown)
      this._canvas.removeEventListener('pointermove', this._boundPointerMove)
      this._canvas.removeEventListener('pointerup', this._boundPointerUp)
    }
    this._canvas = null
  }
}
