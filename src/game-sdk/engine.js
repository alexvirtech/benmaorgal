export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.entities = new Map()
    this.nextId = 1
    this.state = {
      status: 'ready',
      score: 0,
      lives: 3,
      level: 1,
      elapsed: 0,
      isPaused: false,
      isWon: false,
      isLost: false,
    }
    this.definition = null
    this.template = null
    this._animId = null
    this._lastTime = 0
    this._listeners = {}
    this._customState = {}
  }

  setDefinition(definition) {
    this.definition = definition
  }

  setTemplate(template) {
    this.template = template
  }

  addEntity(props) {
    const id = props.id || `e_${this.nextId++}`
    const entity = {
      id,
      type: props.type || 'generic',
      role: props.role || 'none',
      x: props.x || 0,
      y: props.y || 0,
      width: props.width || 40,
      height: props.height || 40,
      vx: props.vx || 0,
      vy: props.vy || 0,
      speed: props.speed || 0,
      sprite: props.sprite || '',
      active: true,
      visible: props.visible !== false,
      points: props.points || 0,
      damage: props.damage || 0,
      ...props,
      id,
    }
    this.entities.set(id, entity)
    return entity
  }

  removeEntity(id) {
    this.entities.delete(id)
  }

  getEntitiesByRole(role) {
    const result = []
    for (const e of this.entities.values()) {
      if (e.role === role && e.active) result.push(e)
    }
    return result
  }

  getEntitiesByType(type) {
    const result = []
    for (const e of this.entities.values()) {
      if (e.type === type && e.active) result.push(e)
    }
    return result
  }

  getPlayer() {
    for (const e of this.entities.values()) {
      if (e.role === 'player' && e.active) return e
    }
    return null
  }

  clearEntities() {
    this.entities.clear()
    this.nextId = 1
  }

  set(key, value) {
    this._customState[key] = value
  }

  get(key) {
    return this._customState[key]
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push(callback)
  }

  emit(event, data) {
    const cbs = this._listeners[event]
    if (cbs) cbs.forEach(cb => cb(data))
  }

  addScore(points) {
    this.state.score += points
    this.emit('score', this.state.score)
  }

  loseLife() {
    this.state.lives--
    this.emit('life-lost', this.state.lives)
    if (this.state.lives <= 0) {
      this.lose()
    }
  }

  win() {
    this.state.status = 'won'
    this.state.isWon = true
    this.emit('win', this.state)
  }

  lose() {
    this.state.status = 'lost'
    this.state.isLost = true
    this.emit('lose', this.state)
  }

  start() {
    this.state.status = 'playing'
    this.state.isPaused = false
    this._lastTime = performance.now()
    this._loop()
  }

  pause() {
    this.state.isPaused = true
    this.state.status = 'paused'
    if (this._animId) {
      cancelAnimationFrame(this._animId)
      this._animId = null
    }
  }

  resume() {
    if (this.state.isPaused) {
      this.state.isPaused = false
      this.state.status = 'playing'
      this._lastTime = performance.now()
      this._loop()
    }
  }

  stop() {
    if (this._animId) {
      cancelAnimationFrame(this._animId)
      this._animId = null
    }
  }

  restart() {
    this.stop()
    this.clearEntities()
    this._customState = {}
    this._listeners = {}
    this.state = {
      status: 'ready',
      score: 0,
      lives: this.definition?.rules?.startingLives || 3,
      level: 1,
      elapsed: 0,
      isPaused: false,
      isWon: false,
      isLost: false,
    }
    if (this.template && this.definition) {
      this.template.setup(this, this.definition)
    }
    this.start()
  }

  _loop() {
    this._animId = requestAnimationFrame((now) => {
      const dt = Math.min((now - this._lastTime) / 1000, 0.05)
      this._lastTime = now

      if (this.state.status === 'playing') {
        this.state.elapsed += dt
        if (this.template && this.template.update) {
          this.template.update(this, dt)
        }
      }

      this._render()

      if (this.state.status === 'playing' || this.state.status === 'paused') {
        this._loop()
      } else {
        this._render()
      }
    })
  }

  _render() {
    const ctx = this.ctx
    const scale = this.canvas.width / GAME_WIDTH
    ctx.save()
    ctx.scale(scale, scale)

    if (this.template && this.template.render) {
      this.template.render(this, ctx)
    } else {
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      for (const e of this.entities.values()) {
        if (!e.visible || !e.active) continue
        this._drawEntity(ctx, e)
      }
    }

    this._drawHUD(ctx)

    if (this.state.status === 'won' || this.state.status === 'lost') {
      this._drawOverlay(ctx)
    }

    ctx.restore()
  }

  _drawEntity(ctx, e) {
    if (e.sprite) {
      ctx.font = `${Math.max(e.width, e.height)}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(e.sprite, e.x + e.width / 2, e.y + e.height / 2)
    } else {
      ctx.fillStyle = e.color || '#ff6b6b'
      ctx.fillRect(e.x, e.y, e.width, e.height)
    }
  }

  _drawHUD(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, GAME_WIDTH, 36)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Score: ${this.state.score}`, 12, 18)

    if (this.state.lives > 0) {
      ctx.textAlign = 'right'
      const hearts = '❤️'.repeat(Math.min(this.state.lives, 10))
      ctx.font = '14px serif'
      ctx.fillText(hearts, GAME_WIDTH - 12, 18)
    }
  }

  _drawOverlay(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (this.state.isWon) {
      ctx.font = 'bold 48px sans-serif'
      ctx.fillStyle = '#ffd700'
      ctx.fillText('YOU WIN!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30)
      ctx.font = '32px serif'
      ctx.fillText('🎉🏆🎉', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30)
    } else {
      ctx.font = 'bold 48px sans-serif'
      ctx.fillStyle = '#ff6b6b'
      ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30)
      ctx.font = '24px sans-serif'
      ctx.fillStyle = '#fff'
      ctx.fillText(`Score: ${this.state.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30)
    }
  }
}
