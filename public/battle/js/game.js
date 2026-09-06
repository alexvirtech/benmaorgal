const Game = {
  canvas: null,
  ctx: null,
  state: 'start',
  paused: false,
  playerScore: 0,
  enemyScore: 0,
  enemies: [],
  respawnTimer: 0,
  lastTime: 0,
  fps: 0,
  frameCount: 0,
  fpsTimer: 0,

  init() {
    this.canvas = document.getElementById('game-canvas')
    this.ctx = this.canvas.getContext('2d')
    this.canvas.width = GAME_CONFIG.arena.width
    this.canvas.height = GAME_CONFIG.arena.height

    Input.init(this.canvas)
    Arena.init()
    Sound.init()
    UI.init()
    Player.loadSettings()
    if (typeof Customizer !== 'undefined') Customizer.init()

    document.getElementById('play-btn').addEventListener('click', () => {
      Sound.resume()
      this.startGame()
    })

    document.getElementById('replay-btn').addEventListener('click', () => {
      this.startGame()
    })

    UI.showStartScreen()
    this.loop(0)
  },

  startGame() {
    this.state = 'playing'
    this.playerScore = 0
    this.enemyScore = 0
    if (typeof getRandomTheme !== 'undefined') getRandomTheme()
    Bullets.clear()
    if (typeof HazardBalls !== 'undefined') HazardBalls.init()

    Player.shrinkScale = 1
    Player.spawn()

    this.enemies = []
    for (let i = 0; i < GAME_CONFIG.enemy.count; i++) {
      this.enemies.push(new Enemy(i))
    }

    UI.updateScore(0, 0)
    UI.hideStartScreen()
    UI.hideEndScreen()
    document.getElementById('score-hud').classList.remove('hidden')
    document.getElementById('ingame-btns').classList.remove('hidden')
    document.getElementById('pause-overlay').classList.add('hidden')
    this.paused = false
  },

  togglePause() {
    if (this.state !== 'playing' && this.state !== 'respawning') return
    this.paused = !this.paused
    const overlay = document.getElementById('pause-overlay')
    if (this.paused) {
      overlay.classList.remove('hidden')
    } else {
      overlay.classList.add('hidden')
      this.lastTime = performance.now()
    }
  },

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05)
    this.lastTime = timestamp

    this.frameCount++
    this.fpsTimer += dt
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.fpsTimer = 0
    }

    if ((this.state === 'playing' || this.state === 'respawning') && !this.paused) {
      this.update(dt)
      this.render()
    }

    UI.updateDebug(this.fps, this)
    requestAnimationFrame(t => this.loop(t))
  },

  update(dt) {
    if (this.state === 'playing') {
      Player.update(dt)
    }

    if (this.state === 'respawning') {
      this.respawnTimer -= dt * 1000
      if (this.respawnTimer <= 0) {
        Player.spawn()
        this.state = 'playing'
      }
    }

    this.enemies.forEach(e => e.update(dt))
    Bullets.update(dt)
    if (typeof HazardBalls !== 'undefined') HazardBalls.update(dt)
    this.checkCollisions()
    this.processSplashDamage()
  },

  checkCollisions() {
    const bullets = Bullets.list

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]

      if (b.isPlayer) {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue
          const dx = b.x - enemy.x
          const dy = b.y - enemy.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < GAME_CONFIG.enemy.size + b.size) {
            enemy.takeDamage(b.damage)
            Player.shrink()
            Effects.createExplosion(b.x, b.y, b.color, b.splash)

            this._splashEnemies(b.x, b.y, b.splash, Math.ceil(b.damage * 0.4), enemy)

            bullets.splice(i, 1)

            if (!enemy.alive) {
              this.playerScore++
              UI.updateScore(this.playerScore, this.enemyScore)
              Sound.play('score')

              if (this.playerScore >= GAME_CONFIG.game.winningScore) {
                this.endGame(true)
                return
              }
              enemy.startRespawn()
            }
            break
          }
        }
      } else {
        if (!Player.alive) continue
        const dx = b.x - Player.x
        const dy = b.y - Player.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < Player.getSize() + b.size) {
          Player.takeDamage(b.damage)
          Effects.createExplosion(b.x, b.y, b.color, b.splash)
          bullets.splice(i, 1)

          if (!Player.alive) {
            this.enemyScore++
            UI.updateScore(this.playerScore, this.enemyScore)
            Sound.play('score')

            if (this.enemyScore >= GAME_CONFIG.game.winningScore) {
              this.endGame(false)
              return
            }
            this.state = 'respawning'
            this.respawnTimer = GAME_CONFIG.game.respawnDelay
          }
        }
      }
    }
  },

  _splashEnemies(x, y, radius, damage, skipEnemy) {
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy === skipEnemy) continue
      const dx = x - enemy.x
      const dy = y - enemy.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < radius + GAME_CONFIG.enemy.size) {
        enemy.takeDamage(damage)
        Player.shrink()
        if (!enemy.alive) {
          this.playerScore++
          UI.updateScore(this.playerScore, this.enemyScore)
          Sound.play('score')
          if (this.playerScore >= GAME_CONFIG.game.winningScore) {
            this.endGame(true)
            return
          }
          enemy.startRespawn()
        }
      }
    }
  },

  processSplashDamage() {
    const explosions = Bullets._pendingExplosions
    for (let i = 0; i < explosions.length; i++) {
      const e = explosions[i]
      if (e.isPlayer) {
        this._splashEnemies(e.x, e.y, e.splashRadius, e.splashDamage, null)
      } else {
        if (!Player.alive) continue
        const dx = e.x - Player.x
        const dy = e.y - Player.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < e.splashRadius + Player.getSize()) {
          Player.takeDamage(e.splashDamage)
          if (!Player.alive) {
            this.enemyScore++
            UI.updateScore(this.playerScore, this.enemyScore)
            Sound.play('score')
            if (this.enemyScore >= GAME_CONFIG.game.winningScore) {
              this.endGame(false)
              return
            }
            this.state = 'respawning'
            this.respawnTimer = GAME_CONFIG.game.respawnDelay
          }
        }
      }
    }
    Bullets._pendingExplosions = []
  },

  endGame(playerWon) {
    this.state = 'ended'
    this.paused = false
    document.getElementById('ingame-btns').classList.add('hidden')
    document.getElementById('pause-overlay').classList.add('hidden')
    if (playerWon) {
      Sound.play('win')
    } else {
      Sound.play('lose')
    }
    UI.showEndScreen(playerWon)
  },

  render() {
    const ctx = this.ctx
    Arena.draw(ctx)

    if (Player.alive) {
      Player.draw(ctx)
    }

    this.enemies.forEach(e => e.draw(ctx))
    if (typeof HazardBalls !== 'undefined') HazardBalls.draw(ctx)
    Bullets.draw(ctx)

    UI.drawJoystick(ctx)
    UI.drawShootIndicator(ctx)

    if (this.state === 'respawning') {
      UI.showRespawnMessage(ctx)
    }
  },
}

window.addEventListener('load', () => Game.init())
