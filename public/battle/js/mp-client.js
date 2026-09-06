const MP_SERVER = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://ben-battle-mp-4cbd83be597e.herokuapp.com'

const PLAYER_COLORS = [
  { fill: '#4488ff', outline: '#2266cc', bullet: '#44ddff', name: 'Blue' },
  { fill: '#ff4455', outline: '#cc2233', bullet: '#ff8844', name: 'Red' },
  { fill: '#44dd44', outline: '#22aa22', bullet: '#88ff88', name: 'Green' },
  { fill: '#ff8844', outline: '#cc6622', bullet: '#ffaa66', name: 'Orange' },
  { fill: '#aa55ff', outline: '#7733cc', bullet: '#cc88ff', name: 'Purple' },
]

const ARENA_OBSTACLES = [
  { x: 150, y: 130, w: 120, h: 20, type: 'wall' },
  { x: 690, y: 130, w: 120, h: 20, type: 'wall' },
  { x: 370, y: 230, w: 220, h: 20, type: 'wall' },
  { x: 370, y: 390, w: 220, h: 20, type: 'wall' },
  { x: 150, y: 490, w: 120, h: 20, type: 'wall' },
  { x: 690, y: 490, w: 120, h: 20, type: 'wall' },
  { x: 380, y: 290, w: 44, h: 44, type: 'box' },
  { x: 536, y: 290, w: 44, h: 44, type: 'box' },
]

const PLAYER_SPEED = 220
const PLAYER_SIZE = 20

let mp = {
  token: localStorage.getItem('mp-token'),
  playerId: localStorage.getItem('mp-player-id'),
  nickname: localStorage.getItem('mp-nickname'),
  socket: null,
  socketLoaded: false,
  gameCode: null,
  isHost: false,
  pendingRequests: [],
  players: [],
  snapshot: null,
  prevSnapshot: null,
  snapshotTime: 0,
  myId: null,
  canvas: null,
  ctx: null,
  keys: {},
  mouse: { x: 480, y: 320, down: false },
  touch: { moveId: null, moveStartX: 0, moveStartY: 0, moveDx: 0, moveDy: 0, isDragging: false, shootId: null, shootX: 0, shootY: 0, shooting: false },
  joystick: { visible: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0 },
  animFrame: null,
  inputInterval: null,
  inputSetup: false,
  soundCtx: null,
  prediction: { x: 0, y: 0 },
  effects: [],
  notifications: [],
  lastRenderTime: 0,
  paused: false,
  smokeTrails: [],
  explosionRings: [],
  explosionParticles: [],
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById('screen-' + id).classList.add('active')
  if (id === 'game') {
    document.body.classList.add('game-active')
  } else {
    document.body.classList.remove('game-active')
  }
}

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (mp.token) headers['Authorization'] = 'Bearer ' + mp.token
  const res = await fetch(MP_SERVER + path, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

function checkCodeInUrl() {
  const path = window.location.pathname
  const match = path.match(/\/game\/(\d{6})$/)
  if (match) return match[1]
  const params = new URLSearchParams(window.location.search)
  return params.get('code')
}

function init() {
  if (typeof Customizer !== 'undefined') Customizer.init()
  const codeFromUrl = checkCodeInUrl()
  if (!mp.token) {
    showScreen('nickname')
    setupNicknameScreen(codeFromUrl)
    return
  }
  mp.myId = mp.playerId
  if (codeFromUrl) {
    joinByCode(codeFromUrl)
  } else {
    showScreen('menu')
    setupMenuScreen()
  }
}

function setupNicknameScreen(codeAfter) {
  const input = document.getElementById('nickname-input')
  const btn = document.getElementById('nickname-btn')
  const err = document.getElementById('nickname-error')
  input.focus()

  async function submit() {
    const name = input.value.trim()
    if (!name) {
      err.textContent = 'Enter a name!'
      err.style.display = 'block'
      return
    }
    btn.disabled = true
    btn.textContent = 'Creating...'
    err.style.display = 'none'
    try {
      const data = await apiFetch('/api/players', {
        method: 'POST',
        body: JSON.stringify({ nickname: name }),
      })
      mp.token = data.token
      mp.playerId = data.id
      mp.nickname = data.nickname
      mp.myId = data.id
      localStorage.setItem('mp-token', data.token)
      localStorage.setItem('mp-player-id', data.id)
      localStorage.setItem('mp-nickname', data.nickname)
      if (codeAfter) {
        joinByCode(codeAfter)
      } else {
        showScreen('menu')
        setupMenuScreen()
      }
    } catch (e) {
      err.textContent = e.message
      err.style.display = 'block'
      btn.disabled = false
      btn.textContent = "LET'S GO!"
    }
  }

  btn.onclick = submit
  input.onkeydown = (e) => { if (e.key === 'Enter') submit() }
}

function setupMenuScreen() {
  document.getElementById('menu-nickname').textContent = mp.nickname
  document.getElementById('create-btn').onclick = createGame
  document.getElementById('join-btn').onclick = () => {
    const code = document.getElementById('join-code-input').value.trim()
    if (code.length === 6) joinByCode(code)
  }
  document.getElementById('join-code-input').onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('join-btn').click()
  }
}

async function createGame() {
  const btn = document.getElementById('create-btn')
  const err = document.getElementById('menu-error')
  btn.disabled = true
  btn.textContent = 'Creating...'
  err.style.display = 'none'
  try {
    const data = await apiFetch('/api/games', { method: 'POST' })
    mp.gameCode = data.publicCode
    mp.isHost = true
    showScreen('lobby')
    setupLobby()
    connectSocket()
  } catch (e) {
    err.textContent = e.message
    err.style.display = 'block'
    btn.disabled = false
    btn.textContent = 'CREATE GAME'
  }
}

async function joinByCode(code) {
  try {
    const game = await apiFetch('/api/games/' + code)
    if (game.status !== 'waiting') {
      showScreen('menu')
      setupMenuScreen()
      const err = document.getElementById('menu-error')
      err.textContent = 'This game already started'
      err.style.display = 'block'
      return
    }
    const alreadyIn = game.players.some(p => p.id === mp.playerId)
    mp.gameCode = code
    mp.isHost = (game.host.id === mp.playerId)
    if (alreadyIn) {
      showScreen('lobby')
      setupLobby()
      connectSocket()
      return
    }
    const result = await apiFetch('/api/games/' + code + '/join', { method: 'POST' })
    showScreen('lobby')
    setupLobby()
    connectSocket()
    if (result.status === 'pending') {
      document.getElementById('pending-section').style.display = 'block'
    }
  } catch (e) {
    showScreen('menu')
    setupMenuScreen()
    const err = document.getElementById('menu-error')
    err.textContent = e.message
    err.style.display = 'block'
  }
}

function setupLobby() {
  document.getElementById('lobby-code').textContent = mp.gameCode
  document.getElementById('copy-link-btn').onclick = () => {
    const url = window.location.origin + '/battle/' + mp.gameCode
    navigator.clipboard.writeText(url).then(() => {
      document.getElementById('copy-link-btn').textContent = 'Copied!'
      setTimeout(() => {
        document.getElementById('copy-link-btn').textContent = 'Copy Share Link'
      }, 2000)
    })
  }
  if (mp.isHost) {
    document.getElementById('host-controls').style.display = 'block'
    document.getElementById('waiting-section').style.display = 'none'
    document.getElementById('start-game-btn').onclick = startGame
  } else {
    document.getElementById('host-controls').style.display = 'none'
    document.getElementById('waiting-section').style.display = 'block'
  }
  document.getElementById('lobby-back').onclick = (e) => {
    e.preventDefault()
    if (mp.socket) mp.socket.disconnect()
    mp.gameCode = null
    mp.isHost = false
    window.location.href = '/battle/'
  }
}

function updateLobbyPlayers(players, hostId) {
  const list = document.getElementById('lobby-players')
  list.innerHTML = ''
  players.forEach((p, i) => {
    const color = PLAYER_COLORS[p.colorIndex || i]
    const li = document.createElement('li')
    li.className = 'player-item'
    li.innerHTML = `
      <span class="player-dot" style="background:${color.fill}"></span>
      <span class="player-name">${escapeHtml(p.nickname)}</span>
      ${p.playerId === hostId ? '<span class="host-badge">HOST</span>' : ''}
    `
    list.appendChild(li)
  })
  const startBtn = document.getElementById('start-game-btn')
  if (startBtn && mp.isHost) {
    const enough = players.length >= 2
    startBtn.disabled = !enough
    startBtn.textContent = enough ? 'START GAME!' : 'Need 2+ players'
  }
}

function renderJoinRequests() {
  const section = document.getElementById('join-requests-section')
  const list = document.getElementById('join-requests-list')
  if (mp.pendingRequests.length === 0) {
    section.style.display = 'none'
    return
  }
  section.style.display = 'block'
  list.innerHTML = ''
  mp.pendingRequests.forEach(req => {
    const div = document.createElement('div')
    div.className = 'request-item'
    div.innerHTML = `
      <span class="request-name">${escapeHtml(req.nickname)}</span>
      <button class="accept-btn" data-id="${req.playerId}">Accept</button>
      <button class="reject-btn" data-id="${req.playerId}">Reject</button>
    `
    div.querySelector('.accept-btn').onclick = () => acceptPlayer(req)
    div.querySelector('.reject-btn').onclick = () => rejectPlayer(req)
    list.appendChild(div)
  })
}

async function refreshPendingRequests() {
  try {
    const requests = await apiFetch('/api/games/' + mp.gameCode + '/requests')
    mp.pendingRequests = requests
    renderJoinRequests()
  } catch (e) {
    console.error('Failed to fetch requests:', e)
  }
}

async function acceptPlayer(req) {
  try {
    await apiFetch('/api/games/' + mp.gameCode + '/accept', {
      method: 'POST',
      body: JSON.stringify({ requestId: req.requestId }),
    })
    mp.pendingRequests = mp.pendingRequests.filter(r => r.playerId !== req.playerId)
    renderJoinRequests()
    mp.socket.emit('accept-player', { code: mp.gameCode, targetPlayerId: req.playerId })
  } catch (e) {
    console.error('Accept failed:', e)
  }
}

async function rejectPlayer(req) {
  try {
    await apiFetch('/api/games/' + mp.gameCode + '/reject', {
      method: 'POST',
      body: JSON.stringify({ requestId: req.requestId }),
    })
    mp.pendingRequests = mp.pendingRequests.filter(r => r.playerId !== req.playerId)
    renderJoinRequests()
    mp.socket.emit('reject-player', { code: mp.gameCode, targetPlayerId: req.playerId })
  } catch (e) {
    console.error('Reject failed:', e)
  }
}

async function startGame() {
  try {
    await apiFetch('/api/games/' + mp.gameCode + '/start', { method: 'POST' })
    mp.socket.emit('start-game', { code: mp.gameCode })
  } catch (e) {
    const err = document.getElementById('lobby-error')
    err.textContent = e.message
    err.style.display = 'block'
  }
}

// --- Socket ---

function connectSocket() {
  if (mp.socketLoaded) {
    connectSocketInternal()
    return
  }
  const script = document.createElement('script')
  script.src = MP_SERVER + '/socket.io/socket.io.js'
  script.onload = () => {
    mp.socketLoaded = true
    connectSocketInternal()
  }
  script.onerror = () => {
    console.error('Failed to load Socket.IO')
  }
  document.head.appendChild(script)
}

function connectSocketInternal() {
  if (mp.socket) {
    mp.socket.disconnect()
  }

  mp.socket = io(MP_SERVER, {
    auth: { token: mp.token },
    transports: ['websocket', 'polling'],
    upgrade: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 20,
  })

  mp.socket.on('connect', () => {
    console.log('[mp] connected, joining', mp.gameCode)
    mp.socket.emit('lobby-join', { code: mp.gameCode })
    const fm = localStorage.getItem('figureMode') || 'simple'
    let app
    try { app = JSON.parse(localStorage.getItem('appearance')) } catch (e) {}
    if (!app) app = typeof DEFAULT_APPEARANCE !== 'undefined' ? DEFAULT_APPEARANCE : {}
    mp.socket.emit('appearance-update', { figureMode: fm, appearance: app })
    if (typeof Chat !== 'undefined') Chat.attachSocket(mp.socket, mp.nickname)
  })

  mp.socket.on('disconnect', (reason) => {
    console.log('[mp] disconnected:', reason)
  })

  mp.socket.on('lobby-update', ({ players, hostId }) => {
    updateLobbyPlayers(players, hostId)
  })

  mp.socket.on('join-request', async () => {
    if (!mp.isHost) return
    await refreshPendingRequests()
  })

  mp.socket.on('player-accepted', ({ playerId }) => {
    if (playerId === mp.playerId) {
      document.getElementById('pending-section').style.display = 'none'
      if (!mp.isHost) {
        document.getElementById('waiting-section').style.display = 'block'
      }
    }
  })

  mp.socket.on('player-rejected', ({ playerId }) => {
    if (playerId === mp.playerId) {
      alert('Your join request was rejected.')
      window.location.href = '/battle/'
    }
  })

  mp.socket.on('countdown', ({ seconds }) => {
    showScreen('countdown')
    document.getElementById('countdown-number').textContent = seconds
    playSound('countdown')
  })

  mp.socket.on('game-start', ({ players }) => {
    mp.players = players
    mp.snapshot = null
    mp.prevSnapshot = null
    mp.prediction = { x: 0, y: 0 }
    mp.effects = []
    mp.notifications = []
    mp.smokeTrails = []
    mp.explosionRings = []
    mp.explosionParticles = []
    if (typeof getRandomTheme !== 'undefined') getRandomTheme()
    showScreen('game')
    initGameCanvas()
    showControlsHint()
  })

  mp.socket.on('snapshot', (snapshot) => {
    const prev = mp.snapshot
    mp.prevSnapshot = prev
    mp.snapshot = snapshot
    mp.snapshotTime = performance.now()

    if (prev) detectEvents(prev, snapshot)

    mp.prediction.x *= 0.5
    mp.prediction.y *= 0.5
    if (Math.abs(mp.prediction.x) < 1) mp.prediction.x = 0
    if (Math.abs(mp.prediction.y) < 1) mp.prediction.y = 0
  })

  mp.socket.on('game-over', ({ winner, results }) => {
    cleanupGame()
    playSound('gameOver')
    showResults(winner, results)
  })

  mp.socket.on('player-disconnected', ({ playerId }) => {
    const p = mp.snapshot?.players.find(pl => pl.id === playerId)
    if (p) addNotification(p.nickname + ' disconnected')
  })

  mp.socket.on('nickname-updated', ({ playerId: pid, nickname: newName }) => {
    if (mp.snapshot) {
      const p = mp.snapshot.players.find(pl => pl.id === pid)
      if (p) p.nickname = newName
    }
    if (mp.prevSnapshot) {
      const p = mp.prevSnapshot.players.find(pl => pl.id === pid)
      if (p) p.nickname = newName
    }
    const slot = mp.players.find(s => s.playerId === pid)
    if (slot) slot.nickname = newName
    if (pid === mp.myId) {
      mp.nickname = newName
      localStorage.setItem('mp-nickname', newName)
      if (typeof Chat !== 'undefined') Chat.updateNickname(newName)
    }
  })

  mp.socket.on('error-msg', ({ message }) => {
    console.error('Server:', message)
  })

  if (!mp.isHost) {
    mp.socket.on('connect', () => {
      mp.socket.emit('join-request', { code: mp.gameCode })
    })
  }
}

// --- Game ---

function initGameCanvas() {
  cleanupGame()

  mp.canvas = document.getElementById('mp-canvas')
  mp.ctx = mp.canvas.getContext('2d')
  mp.lastRenderTime = performance.now()

  setupMPInput(mp.canvas)
  initSound()
  setupGameButtons()

  const sendRate = 1000 / 20
  mp.inputInterval = setInterval(() => {
    if (!mp.socket || !mp.socket.connected) return
    if (mp.paused) return

    let dx = 0, dy = 0
    if (mp.keys['w'] || mp.keys['arrowup']) dy -= 1
    if (mp.keys['s'] || mp.keys['arrowdown']) dy += 1
    if (mp.keys['a'] || mp.keys['arrowleft']) dx -= 1
    if (mp.keys['d'] || mp.keys['arrowright']) dx += 1
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy)
      dx /= len
      dy /= len
    }
    if (mp.touch.moveId !== null) {
      dx = mp.touch.moveDx
      dy = mp.touch.moveDy
    }

    const me = findMe()
    let angle = 0
    if (me) {
      const mx = me.x + mp.prediction.x
      const my = me.y + mp.prediction.y
      if (mp.touch.shooting) {
        angle = Math.atan2(mp.touch.shootY - my, mp.touch.shootX - mx)
      } else {
        angle = Math.atan2(mp.mouse.y - my, mp.mouse.x - mx)
      }
    }
    const shooting = mp.mouse.down || mp.keys[' '] || mp.touch.shooting

    if (dx !== 0 || dy !== 0) {
      mp.prediction.x += dx * PLAYER_SPEED * (sendRate / 1000)
      mp.prediction.y += dy * PLAYER_SPEED * (sendRate / 1000)
      const maxPred = 30
      mp.prediction.x = Math.max(-maxPred, Math.min(maxPred, mp.prediction.x))
      mp.prediction.y = Math.max(-maxPred, Math.min(maxPred, mp.prediction.y))
    }

    mp.socket.emit('input', { dx, dy, angle, shooting })
  }, sendRate)

  gameLoop()
}

function cleanupGame() {
  if (mp.inputInterval) {
    clearInterval(mp.inputInterval)
    mp.inputInterval = null
  }
  if (mp.animFrame) {
    cancelAnimationFrame(mp.animFrame)
    mp.animFrame = null
  }
}

function setupGameButtons() {
  const endBtn = document.getElementById('end-game-btn')
  if (endBtn) {
    endBtn.textContent = mp.isHost ? 'END GAME' : 'LEAVE'
    endBtn.onclick = () => {
      if (mp.isHost) {
        if (confirm('End the game for everyone?')) {
          mp.socket.emit('end-game', { code: mp.gameCode })
        }
      } else {
        mp.socket.emit('leave-game', { code: mp.gameCode })
        cleanupGame()
        window.location.href = '/battle/'
      }
    }
  }
  const accBtn = document.getElementById('game-account-btn')
  if (accBtn) accBtn.onclick = () => openAccountModal()
}

function findMe() {
  if (!mp.snapshot) return null
  return mp.snapshot.players.find(p => p.id === mp.myId)
}

// --- Events ---

function detectEvents(prev, curr) {
  const prevMap = new Map(prev.players.map(p => [p.id, p]))
  for (const cp of curr.players) {
    const pp = prevMap.get(cp.id)
    if (!pp) continue
    if (cp.health < pp.health && cp.alive) {
      addEffect(cp.x, cp.y, 'hit', cp.colorIndex)
      if (cp.id === mp.myId) playSound('hit')
    }
    if (!cp.alive && pp.alive) {
      addEffect(cp.x, cp.y, 'death', cp.colorIndex)
      if (cp.id === mp.myId) {
        playSound('death')
        addNotification('You were eliminated!')
      }
    }
    if (cp.kills > pp.kills && cp.id === mp.myId) {
      playSound('kill')
      addNotification('You got a kill!')
    }
    if (cp.alive && !pp.alive && cp.id === mp.myId) {
      addNotification('Respawned!')
    }
  }
  if (curr.bullets.length > prev.bullets.length) {
    const newMine = curr.bullets.filter(b =>
      b.ownerId === mp.myId && !prev.bullets.some(pb => pb.id === b.id)
    )
    if (newMine.length > 0) playSound('shoot')
  }
}

function addEffect(x, y, type, colorIndex) {
  mp.effects.push({ x, y, type, colorIndex, time: performance.now(), duration: 500 })
}

function addNotification(text) {
  mp.notifications.push({ text, time: performance.now(), duration: 2000 })
}

// --- Render ---

function gameLoop() {
  const now = performance.now()
  renderGame(now)
  mp.lastRenderTime = now
  mp.animFrame = requestAnimationFrame(gameLoop)
}

function renderGame(now) {
  const ctx = mp.ctx
  if (!ctx || !mp.snapshot) return

  if (typeof drawThemedArena !== 'undefined') {
    drawThemedArena(ctx, 960, 640, ARENA_OBSTACLES)
  } else {
    const ac = GAME_CONFIG.arena
    ctx.fillStyle = ac.grassColor
    ctx.fillRect(0, 0, 960, 640)
    ctx.strokeStyle = ac.borderColor
    ctx.lineWidth = 6
    ctx.strokeRect(3, 3, 954, 634)
    ARENA_OBSTACLES.forEach(obs => {
      ctx.fillStyle = obs.type === 'wall' ? ac.wallColor : ac.boxColor
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
      ctx.strokeStyle = obs.type === 'wall' ? ac.wallStroke : ac.boxStroke
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)
    })
  }

  const tickMs = 1000 / 20
  const elapsed = now - mp.snapshotTime
  const t = Math.min(1.2, elapsed / tickMs)

  const renderDt = (now - mp.lastRenderTime) / 1000 || 0.016
  for (let i = mp.smokeTrails.length - 1; i >= 0; i--) {
    const s = mp.smokeTrails[i]
    s.alpha -= renderDt * 3
    s.size += renderDt * 8
    if (s.alpha <= 0) { mp.smokeTrails.splice(i, 1); continue }
    ctx.globalAlpha = Math.max(0, s.alpha)
    ctx.fillStyle = s.color
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  mp.snapshot.bullets.forEach(b => {
    const color = PLAYER_COLORS[b.colorIndex] || PLAYER_COLORS[0]
    const bx = b.x + (b.vx / 20) * t
    const by = b.y + (b.vy / 20) * t
    const wid = b.weaponId || 'pistol'
    if (wid === 'rocket' || wid === 'grenade' || wid === 'flamethrower') {
      mp.smokeTrails.push({
        x: bx + (Math.random() - 0.5) * 4,
        y: by + (Math.random() - 0.5) * 4,
        alpha: wid === 'flamethrower' ? 0.4 : 0.5,
        size: wid === 'rocket' ? 4 : wid === 'flamethrower' ? 5 : 3,
        color: wid === 'rocket' ? '#888' : wid === 'flamethrower' ? '#ff4400' : '#5a5',
      })
    }
    const angle = Math.atan2(b.vy, b.vx)
    const sz = b.size || 6
    Bullets._drawProjectile(ctx, bx, by, sz, angle, wid, color.bullet)
  })

  if (mp.snapshot.explosions) {
    mp.snapshot.explosions.forEach(e => {
      const r = e.radius || 35
      const col = e.color || '#ffcc44'

      mp.explosionRings.push({
        x: e.x, y: e.y,
        color: col,
        radius: r * 0.15,
        maxRadius: r,
        alpha: 0.8,
        type: 'ring',
      })
      mp.explosionRings.push({
        x: e.x, y: e.y,
        color: '#ffffff',
        radius: r * 0.1,
        maxRadius: r * 0.5,
        alpha: 0.6,
        type: 'flash',
      })
      mp.explosionRings.push({
        x: e.x, y: e.y,
        color: '#ffaa22',
        radius: r * 0.2,
        maxRadius: r * 0.7,
        alpha: 0.5,
        type: 'flash',
      })

      const count = 6 + Math.floor(r / 8)
      for (let j = 0; j < count; j++) {
        const a = Math.random() * Math.PI * 2
        const spd = 60 + Math.random() * 160
        mp.explosionParticles.push({
          x: e.x, y: e.y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          color: j % 3 === 0 ? '#ffcc22' : j % 3 === 1 ? col : '#ff6622',
          size: 1.5 + Math.random() * 3,
          alpha: 1,
          life: 0.2 + Math.random() * 0.3,
        })
      }
    })
  }

  for (let i = mp.explosionRings.length - 1; i >= 0; i--) {
    const e = mp.explosionRings[i]
    e.radius += renderDt * 250
    e.alpha -= renderDt * 4.5
    if (e.alpha <= 0 || e.radius > e.maxRadius) { mp.explosionRings.splice(i, 1); continue }
    ctx.globalAlpha = Math.max(0, e.alpha)
    if (e.type === 'flash') {
      ctx.fillStyle = e.color
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.strokeStyle = e.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  for (let i = mp.explosionParticles.length - 1; i >= 0; i--) {
    const p = mp.explosionParticles[i]
    p.x += p.vx * renderDt
    p.y += p.vy * renderDt
    p.vx *= 0.94
    p.vy *= 0.94
    p.life -= renderDt
    p.alpha = Math.max(0, p.life / 0.4)
    p.size *= 0.97
    if (p.life <= 0) { mp.explosionParticles.splice(i, 1); continue }
    ctx.globalAlpha = Math.max(0, p.alpha)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  if (mp.snapshot.hazardBalls) {
    const ballSize = 14
    mp.snapshot.hazardBalls.forEach(h => {
      const hx = h.x + (h.vx / 20) * t
      const hy = h.y + (h.vy / 20) * t
      const pulse = 1 + Math.sin(now / 250) * 0.08

      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.ellipse(hx, hy + ballSize * 0.8, ballSize * 0.6, ballSize * 0.2, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.save()
      ctx.shadowColor = h.color
      ctx.shadowBlur = 12
      const grad = ctx.createRadialGradient(hx - ballSize * 0.3, hy - ballSize * 0.3, ballSize * 0.1, hx, hy, ballSize * pulse)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.3, h.color)
      grad.addColorStop(1, h.color + '88')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(hx, hy, ballSize * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff44'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(hx - ballSize * 0.3, hy - ballSize * 0.3, ballSize * 0.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold ' + (ballSize * 0.8) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('!', hx + 1, hy + 1)
    })
  }

  mp.snapshot.players.forEach(p => {
    if (!p.alive) {
      if (p.id === mp.myId) {
        const color = PLAYER_COLORS[p.colorIndex] || PLAYER_COLORS[0]
        ctx.globalAlpha = 0.3
        ctx.fillStyle = color.fill
        ctx.beginPath()
        ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 14px "Segoe UI", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Respawning...', p.x, p.y + 5)
        ctx.textAlign = 'start'
      }
      return
    }

    const color = PLAYER_COLORS[p.colorIndex] || PLAYER_COLORS[0]
    const isMe = (p.id === mp.myId)
    let drawX = p.x
    let drawY = p.y

    if (isMe) {
      drawX += mp.prediction.x
      drawY += mp.prediction.y
    } else if (mp.prevSnapshot) {
      const prev = mp.prevSnapshot.players.find(pp => pp.id === p.id)
      if (prev && prev.alive) {
        drawX = prev.x + (p.x - prev.x) * Math.min(t, 1)
        drawY = prev.y + (p.y - prev.y) * Math.min(t, 1)
      }
    }

    const pSize = PLAYER_SIZE * (p.shrinkScale || 1)

    if (p.figureMode === 'brawl' && typeof BrawlRenderer !== 'undefined') {
      const animState = { time: now / 1000, walking: false, dead: !p.alive, hitFlash: 0 }
      const charId = (p.appearance && p.appearance.brawlCharacter) || 'sirius'
      BrawlRenderer.drawCharacter(ctx, drawX, drawY, pSize, p.angle, charId, animState)
      BrawlRenderer.drawHealthBar(ctx, drawX, drawY - pSize - 24, p.health, 100)
    } else if (p.figureMode === 'advanced' && typeof AdvancedRenderer !== 'undefined') {
      const animState = { time: now / 1000, walking: false, lowHealth: p.health < 30, dead: !p.alive, hitFlash: 0, attackFlash: 0 }
      AdvancedRenderer.drawCharacter(ctx, drawX, drawY, pSize, p.angle, p.appearance || {}, animState)
      AdvancedRenderer.drawHealthBar(ctx, drawX, drawY - pSize - 24, p.health, 100)
    } else {
      ctx.fillStyle = color.fill
      ctx.beginPath()
      ctx.arc(drawX, drawY, pSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = color.outline
      ctx.lineWidth = isMe ? 3 : 2
      ctx.stroke()
      drawFace(ctx, drawX, drawY, pSize, p.angle)
      drawHealthBar(ctx, drawX, drawY - pSize - 16, p.health, 100)
    }

    if (isMe) {
      ctx.strokeStyle = '#ffffff55'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(drawX, drawY, pSize + 4, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (!p.connected) {
      ctx.globalAlpha = 0.6
      ctx.fillStyle = '#ff4444'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('OFFLINE', drawX, drawY - pSize - 28)
      ctx.globalAlpha = 1
      ctx.textAlign = 'start'
    }

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(p.nickname + ' [' + p.score + ']', drawX, drawY - pSize - 22)
    ctx.textAlign = 'start'
  })

  for (let i = mp.effects.length - 1; i >= 0; i--) {
    const e = mp.effects[i]
    const age = now - e.time
    if (age > e.duration) { mp.effects.splice(i, 1); continue }
    const progress = age / e.duration
    const color = PLAYER_COLORS[e.colorIndex] || PLAYER_COLORS[0]
    if (e.type === 'hit') {
      ctx.globalAlpha = 1 - progress
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(e.x, e.y, PLAYER_SIZE + progress * 15, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    } else if (e.type === 'death') {
      ctx.globalAlpha = 1 - progress
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2
        const r = progress * 40
        ctx.fillStyle = color.fill
        ctx.beginPath()
        ctx.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 4 * (1 - progress), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
  }

  if (mp.joystick.visible) {
    ctx.globalAlpha = 0.25
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(mp.joystick.baseX, mp.joystick.baseY, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.4
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.globalAlpha = 0.6
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(mp.joystick.stickX, mp.joystick.stickY, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  if (mp.touch.shooting) {
    ctx.globalAlpha = 0.3
    ctx.strokeStyle = '#ff6b35'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(mp.touch.shootX, mp.touch.shootY, 24, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#ff6b35'
    ctx.beginPath()
    ctx.arc(mp.touch.shootX, mp.touch.shootY, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  const notifY = 600
  for (let i = mp.notifications.length - 1; i >= 0; i--) {
    const n = mp.notifications[i]
    const age = now - n.time
    if (age > n.duration) { mp.notifications.splice(i, 1); continue }
    const alpha = age < 200 ? age / 200 : age > n.duration - 500 ? (n.duration - age) / 500 : 1
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 16px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(n.text, 480, notifY - i * 24)
    ctx.textAlign = 'start'
    ctx.globalAlpha = 1
  }

  updateHUD()
}

function drawFace(ctx, x, y, size, angle) {
  const eyeDist = size * 0.35
  const eyeSize = size * 0.28
  const pupilSize = size * 0.14
  const angles = [angle - 0.4, angle + 0.4]
  angles.forEach(a => {
    const ex = x + Math.cos(a) * eyeDist
    const ey = y + Math.sin(a) * eyeDist
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2)
    ctx.fill()
    const px = ex + Math.cos(angle) * (eyeSize * 0.3)
    const py = ey + Math.sin(angle) * (eyeSize * 0.3)
    ctx.fillStyle = '#111111'
    ctx.beginPath()
    ctx.arc(px, py, pupilSize, 0, Math.PI * 2)
    ctx.fill()
  })
}

function drawHealthBar(ctx, cx, cy, health, maxHealth) {
  const w = 40, h = 5
  const ratio = health / maxHealth
  const x = cx - w / 2
  ctx.fillStyle = '#333333'
  ctx.fillRect(x, cy, w, h)
  ctx.fillStyle = ratio > 0.5 ? '#44dd44' : ratio > 0.25 ? '#dddd44' : '#dd4444'
  ctx.fillRect(x, cy, w * ratio, h)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 1
  ctx.strokeRect(x, cy, w, h)
}

function updateHUD() {
  if (!mp.snapshot) return
  const hud = document.getElementById('mp-hud')
  const sorted = [...mp.snapshot.players].sort((a, b) => b.score - a.score)
  hud.innerHTML = sorted.map(p => {
    const color = PLAYER_COLORS[p.colorIndex] || PLAYER_COLORS[0]
    const isMe = p.id === mp.myId
    return `<div class="hud-player" style="color:${color.fill}; ${isMe ? 'border:1px solid ' + color.fill : ''}">
      ${escapeHtml(p.nickname)}: ${p.score}
    </div>`
  }).join('')
}

// --- Results ---

function showResults(winnerId, results) {
  showScreen('results')
  const winnerData = results.find(r => r.playerId === winnerId)
  const isMe = winnerId === mp.myId
  document.getElementById('results-title').textContent =
    isMe ? 'YOU WIN!' : (winnerData ? winnerData.nickname + ' Wins!' : 'Game Over!')
  document.getElementById('results-title').style.color =
    isMe ? '#ffd700' : '#ff6b6b'
  const medals = ['1st', '2nd', '3rd', '4th', '5th']
  const body = document.getElementById('results-body')
  body.innerHTML = results.map((r, i) => {
    const isWinner = r.playerId === winnerId
    return `<tr class="${isWinner ? 'winner' : ''}">
      <td class="placement-medal">${medals[i] || ''}</td>
      <td>${escapeHtml(r.nickname)}${r.playerId === mp.myId ? ' (you)' : ''}</td>
      <td>${r.score}</td>
      <td>${r.kills}</td>
      <td>${r.deaths}</td>
    </tr>`
  }).join('')
}

// --- Input ---

function setupMPInput(canvas) {
  if (mp.inputSetup) return
  mp.inputSetup = true

  window.addEventListener('keydown', e => {
    mp.keys[e.key.toLowerCase()] = true
    if (e.key === ' ') e.preventDefault()
  })
  window.addEventListener('keyup', e => {
    mp.keys[e.key.toLowerCase()] = false
  })

  canvas.addEventListener('mousemove', e => {
    const p = canvasPos(e, canvas)
    mp.mouse.x = p.x
    mp.mouse.y = p.y
  })
  canvas.addEventListener('mousedown', e => {
    e.preventDefault()
    mp.mouse.down = true
    resumeAudio()
  })
  canvas.addEventListener('mouseup', () => { mp.mouse.down = false })
  canvas.addEventListener('contextmenu', e => e.preventDefault())
  canvas.addEventListener('dragstart', e => e.preventDefault())

  canvas.addEventListener('touchstart', e => {
    e.preventDefault()
    resumeAudio()
    for (const t of e.changedTouches) {
      const p = touchPos(t, canvas)
      if (mp.touch.moveId === null) {
        mp.touch.moveId = t.identifier
        mp.touch.moveStartX = p.x
        mp.touch.moveStartY = p.y
        mp.touch.moveDx = 0
        mp.touch.moveDy = 0
        mp.touch.isDragging = false
      } else {
        mp.touch.shootId = t.identifier
        mp.touch.shootX = p.x
        mp.touch.shootY = p.y
        mp.touch.shooting = true
      }
    }
  }, { passive: false })

  canvas.addEventListener('touchmove', e => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      const p = touchPos(t, canvas)
      if (t.identifier === mp.touch.moveId) {
        const dx = p.x - mp.touch.moveStartX
        const dy = p.y - mp.touch.moveStartY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 12 && !mp.touch.isDragging) {
          mp.touch.isDragging = true
          mp.joystick.visible = true
          mp.joystick.baseX = mp.touch.moveStartX
          mp.joystick.baseY = mp.touch.moveStartY
        }
        if (mp.touch.isDragging && dist > 0) {
          const maxDist = 50
          const clamped = Math.min(dist, maxDist)
          mp.touch.moveDx = (dx / dist) * (clamped / maxDist)
          mp.touch.moveDy = (dy / dist) * (clamped / maxDist)
          mp.joystick.stickX = mp.touch.moveStartX + (dx / dist) * clamped
          mp.joystick.stickY = mp.touch.moveStartY + (dy / dist) * clamped
        }
      }
      if (t.identifier === mp.touch.shootId) {
        mp.touch.shootX = p.x
        mp.touch.shootY = p.y
      }
    }
  }, { passive: false })

  canvas.addEventListener('touchend', e => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === mp.touch.moveId) {
        if (!mp.touch.isDragging) {
          const p = touchPos(t, canvas)
          mp.touch.shootX = p.x
          mp.touch.shootY = p.y
          mp.touch.shooting = true
          setTimeout(() => { mp.touch.shooting = false }, 150)
        }
        mp.touch.moveId = null
        mp.touch.moveDx = 0
        mp.touch.moveDy = 0
        mp.touch.isDragging = false
        mp.joystick.visible = false
      }
      if (t.identifier === mp.touch.shootId) {
        mp.touch.shootId = null
        mp.touch.shooting = false
      }
    }
  }, { passive: false })

  canvas.addEventListener('touchcancel', () => {
    mp.touch.moveId = null
    mp.touch.moveDx = 0
    mp.touch.moveDy = 0
    mp.touch.isDragging = false
    mp.touch.shootId = null
    mp.touch.shooting = false
    mp.joystick.visible = false
  })
}

function canvasPos(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  }
}

function touchPos(t, canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (t.clientX - rect.left) * (canvas.width / rect.width),
    y: (t.clientY - rect.top) * (canvas.height / rect.height),
  }
}

// --- Sound ---

function initSound() {
  if (mp.soundCtx) return
  try {
    mp.soundCtx = new (window.AudioContext || window.webkitAudioContext)()
  } catch (e) {}
}

function resumeAudio() {
  if (mp.soundCtx && mp.soundCtx.state === 'suspended') mp.soundCtx.resume()
}

function playSound(type) {
  if (!mp.soundCtx || mp.soundCtx.state !== 'running') return
  try {
    const ctx = mp.soundCtx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    switch (type) {
      case 'shoot':
        osc.type = 'square'
        osc.frequency.setValueAtTime(600, now)
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08)
        gain.gain.setValueAtTime(0.12, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        osc.start(now); osc.stop(now + 0.08)
        break
      case 'hit':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
        osc.start(now); osc.stop(now + 0.12)
        break
      case 'kill':
        osc.type = 'square'
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.setValueAtTime(1000, now + 0.08)
        osc.frequency.setValueAtTime(1200, now + 0.16)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        osc.start(now); osc.stop(now + 0.25)
        break
      case 'death':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.35)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        osc.start(now); osc.stop(now + 0.35)
        break
      case 'countdown':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, now)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        osc.start(now); osc.stop(now + 0.15)
        break
      case 'gameOver':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523, now)
        osc.frequency.setValueAtTime(659, now + 0.12)
        osc.frequency.setValueAtTime(784, now + 0.24)
        osc.frequency.setValueAtTime(1047, now + 0.36)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        osc.start(now); osc.stop(now + 0.5)
        break
    }
  } catch (e) {}
}

// --- Controls Hint ---

function mpTogglePause() {
  mp.paused = !mp.paused
  const overlay = document.getElementById('mp-pause-overlay')
  if (mp.paused) {
    overlay.style.display = 'flex'
  } else {
    overlay.style.display = 'none'
    mp.lastRenderTime = performance.now()
  }
}

function showControlsHint() {
  const hint = document.getElementById('controls-hint')
  if (!hint) return
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const moveEl = hint.querySelector('.hint-move')
  const shootEl = hint.querySelector('.hint-shoot')
  if (moveEl) moveEl.textContent = isTouch ? 'DRAG anywhere to MOVE' : 'WASD to MOVE'
  if (shootEl) shootEl.textContent = isTouch ? 'TAP a target to SHOOT' : 'CLICK to SHOOT'
  hint.style.display = 'flex'
  hint.style.opacity = '1'
  setTimeout(() => { hint.style.opacity = '0' }, 3000)
  setTimeout(() => { hint.style.display = 'none' }, 3500)
}

// --- Utility ---

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

window.addEventListener('load', init)
