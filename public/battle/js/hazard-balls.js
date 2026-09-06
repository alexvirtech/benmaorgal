const HazardBalls = {
  list: [],
  count: 3,
  size: 14,
  speed: 180,
  damage: 15,
  hitCooldown: 800,
  colors: ['#ff3366', '#ff9922', '#aa22ff'],

  init() {
    this.list = []
    for (let i = 0; i < this.count; i++) {
      const angle = Math.random() * Math.PI * 2
      this.list.push({
        x: 200 + Math.random() * 560,
        y: 150 + Math.random() * 340,
        vx: Math.cos(angle) * this.speed,
        vy: Math.sin(angle) * this.speed,
        color: this.colors[i % this.colors.length],
        hitTimers: {},
        pulse: Math.random() * Math.PI * 2,
      })
    }
  },

  clear() {
    this.list = []
  },

  update(dt) {
    const w = Arena.width
    const h = Arena.height

    for (const ball of this.list) {
      ball.x += ball.vx * dt
      ball.y += ball.vy * dt
      ball.pulse += dt * 4

      if (ball.x - this.size < 4) {
        ball.x = this.size + 4
        ball.vx = Math.abs(ball.vx)
      }
      if (ball.x + this.size > w - 4) {
        ball.x = w - this.size - 4
        ball.vx = -Math.abs(ball.vx)
      }
      if (ball.y - this.size < 4) {
        ball.y = this.size + 4
        ball.vy = Math.abs(ball.vy)
      }
      if (ball.y + this.size > h - 4) {
        ball.y = h - this.size - 4
        ball.vy = -Math.abs(ball.vy)
      }

      for (const obs of Arena.obstacles) {
        const nearX = Math.max(obs.x, Math.min(ball.x, obs.x + obs.w))
        const nearY = Math.max(obs.y, Math.min(ball.y, obs.y + obs.h))
        const dx = ball.x - nearX
        const dy = ball.y - nearY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < this.size) {
          if (dist === 0) {
            ball.x = obs.x - this.size
            ball.vx = -Math.abs(ball.vx)
          } else {
            const push = this.size - dist
            ball.x += (dx / dist) * push
            ball.y += (dy / dist) * push
            const dot = ball.vx * dx + ball.vy * dy
            ball.vx -= 2 * dot / (dist * dist) * dx
            ball.vy -= 2 * dot / (dist * dist) * dy
          }
        }
      }

      for (const key in ball.hitTimers) {
        ball.hitTimers[key] -= dt * 1000
        if (ball.hitTimers[key] <= 0) delete ball.hitTimers[key]
      }

      if (Player.alive) {
        const dx = ball.x - Player.x
        const dy = ball.y - Player.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < this.size + Player.getSize() && !ball.hitTimers['player']) {
          Player.takeDamage(this.damage)
          ball.hitTimers['player'] = this.hitCooldown
          Effects.create(Player.x, Player.y, ball.color)
          if (!Player.alive) {
            Game.enemyScore++
            UI.updateScore(Game.playerScore, Game.enemyScore)
            Sound.play('score')
            if (Game.enemyScore >= GAME_CONFIG.game.winningScore) {
              Game.endGame(false)
            } else {
              Game.state = 'respawning'
              Game.respawnTimer = GAME_CONFIG.game.respawnDelay
            }
          }
        }
      }

      if (typeof Game !== 'undefined' && Game.enemies) {
        Game.enemies.forEach((e, idx) => {
          if (!e.alive) return
          const dx = ball.x - e.x
          const dy = ball.y - e.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < this.size + GAME_CONFIG.enemy.size && !ball.hitTimers['e' + idx]) {
            e.takeDamage(this.damage)
            ball.hitTimers['e' + idx] = this.hitCooldown
            Effects.create(e.x, e.y, ball.color)
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
      }
    }
  },

  draw(ctx) {
    for (const ball of this.list) {
      const pulseScale = 1 + Math.sin(ball.pulse) * 0.08

      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.ellipse(ball.x, ball.y + this.size * 0.8, this.size * 0.6, this.size * 0.2, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.save()
      ctx.shadowColor = ball.color
      ctx.shadowBlur = 12

      const grad = ctx.createRadialGradient(
        ball.x - this.size * 0.3, ball.y - this.size * 0.3, this.size * 0.1,
        ball.x, ball.y, this.size * pulseScale
      )
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.3, ball.color)
      grad.addColorStop(1, ball.color + '88')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, this.size * pulseScale, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#ffffff44'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(ball.x - this.size * 0.3, ball.y - this.size * 0.3, this.size * 0.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold ' + (this.size * 0.8) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('!', ball.x + 1, ball.y + 1)
    }
  },
}
