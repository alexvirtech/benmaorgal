const Sound = {
  ctx: null,
  enabled: true,

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  },

  play(type) {
    if (!this.enabled || !this.ctx) return
    this.resume()

    const ctx = this.ctx
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    if (type === 'shoot') {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain)
      osc.start(now)
      osc.stop(now + 0.08)
    }

    if (type === 'hit') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(200, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
      osc.connect(gain)
      osc.start(now)
      osc.stop(now + 0.12)
    }

    if (type === 'score') {
      const notes = [400, 500, 700]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, now + i * 0.1)
        g.gain.setValueAtTime(0.1, now + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.1)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(now + i * 0.1)
        osc.stop(now + i * 0.1 + 0.1)
      })
    }

    if (type === 'win') {
      const notes = [400, 500, 600, 800]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, now + i * 0.15)
        g.gain.setValueAtTime(0.12, now + i * 0.15)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.2)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.2)
      })
    }

    if (type === 'lose') {
      const notes = [400, 300, 200]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, now + i * 0.2)
        g.gain.setValueAtTime(0.1, now + i * 0.2)
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.2)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(now + i * 0.2)
        osc.stop(now + i * 0.2 + 0.2)
      })
    }
  },
}

const UI = {
  debugVisible: false,

  init() {
    const soundBtn = document.getElementById('sound-btn')
    soundBtn.addEventListener('click', () => {
      Sound.enabled = !Sound.enabled
      soundBtn.textContent = Sound.enabled ? 'Sound ON' : 'Sound OFF'
    })

    window.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 'f3') {
        e.preventDefault()
        this.debugVisible = !this.debugVisible
        document.getElementById('debug-panel').classList.toggle('hidden', !this.debugVisible)
      }
    })
  },

  updateScore(playerScore, enemyScore) {
    document.getElementById('score-hud').textContent =
      `YOU ${playerScore} : ${enemyScore} ENEMIES`
  },

  showStartScreen() {
    document.getElementById('start-screen').classList.remove('hidden')
  },

  hideStartScreen() {
    document.getElementById('start-screen').classList.add('hidden')
  },

  showEndScreen(playerWon) {
    const screen = document.getElementById('end-screen')
    const title = document.getElementById('end-title')
    title.textContent = playerWon ? 'YOU WIN! ⭐' : 'TRY AGAIN!'
    title.style.color = playerWon ? '#ffd700' : '#ff6b6b'
    screen.classList.remove('hidden')
  },

  hideEndScreen() {
    document.getElementById('end-screen').classList.add('hidden')
  },

  showRespawnMessage(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(0, Arena.height / 2 - 30, Arena.width, 60)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('RESPAWNING...', Arena.width / 2, Arena.height / 2 + 8)
    ctx.textAlign = 'start'
  },

  drawJoystick(ctx) {
    if (!Input.joystick.visible) return

    ctx.globalAlpha = 0.2
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(Input.joystick.baseX, Input.joystick.baseY, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(Input.joystick.stickX, Input.joystick.stickY, 20, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 1
  },

  drawShootIndicator(ctx) {
    if (!Input.touch.shooting) return

    ctx.globalAlpha = 0.25
    ctx.strokeStyle = '#ff6b35'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(Input.touch.shootX, Input.touch.shootY, 24, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(Input.touch.shootX - 10, Input.touch.shootY)
    ctx.lineTo(Input.touch.shootX + 10, Input.touch.shootY)
    ctx.moveTo(Input.touch.shootX, Input.touch.shootY - 10)
    ctx.lineTo(Input.touch.shootX, Input.touch.shootY + 10)
    ctx.stroke()

    ctx.globalAlpha = 1
  },

  updateDebug(fps, game) {
    if (!this.debugVisible) return
    const panel = document.getElementById('debug-panel')
    panel.innerHTML = [
      `FPS: ${fps}`,
      `Player HP: ${Player.health}/${Player.maxHealth}`,
      `Player Speed: ${GAME_CONFIG.player.speed}`,
      `Enemies: ${game.enemies.filter(e => e.alive).length}/${game.enemies.length}`,
      `Bullets: ${Bullets.list.length}`,
      `Bullet Damage: ${GAME_CONFIG.bullet.playerDamage}`,
      `Score to Win: ${GAME_CONFIG.game.winningScore}`,
      `Touch: ${Input.touch.active ? 'YES' : 'NO'}`,
    ].join('<br>')
  },
}
