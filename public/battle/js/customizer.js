const Customizer = {
  _el: null,
  _previewCanvas: null,
  _previewCtx: null,
  _open: false,
  _tempAppearance: null,
  _figureMode: 'simple',

  _getFigureMode() {
    if (typeof Player !== 'undefined' && Player.figureMode) return Player.figureMode
    return localStorage.getItem('figureMode') || 'simple'
  },

  _getAppearance() {
    if (typeof Player !== 'undefined' && Player.appearance) return Player.appearance
    try {
      const saved = JSON.parse(localStorage.getItem('appearance'))
      if (saved) return saved
    } catch (e) {}
    return Object.assign({}, DEFAULT_APPEARANCE)
  },

  init() {
    this._injectStyles()
    this._buildUI()
  },

  _injectStyles() {
    if (document.getElementById('customizer-styles')) return
    const style = document.createElement('style')
    style.id = 'customizer-styles'
    style.textContent =
      '#customizer-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.8);display:none;align-items:center;justify-content:center;z-index:900;padding:12px}' +
      '#customizer-overlay.open{display:flex}' +
      '#customizer-panel{background:#1a1a2e;border-radius:16px;padding:20px;max-width:540px;width:100%;max-height:90vh;overflow-y:auto;position:relative;border:1px solid rgba(255,255,255,.1)}' +
      '.cust-close{position:absolute;top:10px;right:10px;background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center}' +
      '.cust-close:hover{color:#fff;background:rgba(255,255,255,.1)}' +
      '.cust-title{text-align:center;font-size:1.2rem;font-weight:900;color:#ffd700;margin-bottom:12px}' +
      '.cust-mode-toggle{display:flex;gap:6px;margin-bottom:12px;background:rgba(255,255,255,.06);border-radius:10px;padding:4px}' +
      '.cust-mode-btn{flex:1;padding:10px;border:none;border-radius:8px;font-weight:800;font-size:.85rem;cursor:pointer;transition:all .15s;background:transparent;color:#888}' +
      '.cust-mode-btn.active{background:linear-gradient(135deg,#ffd700,#ff6b35);color:#1a1a2e}' +
      '#cust-preview-wrap{text-align:center;margin:8px 0 12px}' +
      '#cust-preview{border-radius:12px;background:#0a0a1e}' +
      '#cust-advanced-opts{display:none}' +
      '#cust-advanced-opts.show{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}' +
      '#cust-brawl-opts{display:none}' +
      '#cust-brawl-opts.show{display:flex;flex-direction:column;align-items:center;gap:12px}' +
      '.brawl-cards{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}' +
      '.brawl-card{width:120px;padding:10px 8px;border:3px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.04);cursor:pointer;transition:all .15s;text-align:center}' +
      '.brawl-card:hover{border-color:rgba(255,215,0,.3);background:rgba(255,215,0,.06)}' +
      '.brawl-card.selected{border-color:#ffd700;background:rgba(255,215,0,.12);box-shadow:0 0 12px rgba(255,215,0,.2)}' +
      '.brawl-card canvas{border-radius:8px;background:#0a0a1e;display:block;margin:0 auto 6px}' +
      '.brawl-card-name{color:#ffd700;font-size:.85rem;font-weight:900;letter-spacing:1px}' +
      '.cust-section{margin:4px 0}' +
      '.cust-section-label{font-size:.7rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}' +
      '.cust-options{display:flex;flex-wrap:wrap;gap:4px}' +
      '.cust-opt{padding:5px 10px;border:2px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(255,255,255,.05);color:#ccc;font-size:.72rem;font-weight:700;cursor:pointer;transition:all .15s}' +
      '.cust-opt:hover{border-color:rgba(255,215,0,.3);background:rgba(255,215,0,.06)}' +
      '.cust-opt.selected{border-color:#ffd700;background:rgba(255,215,0,.15);color:#ffd700}' +
      '.cust-color-opt{width:28px;height:28px;border:3px solid rgba(255,255,255,.1);border-radius:50%;cursor:pointer;transition:all .15s;padding:0}' +
      '.cust-color-opt.selected{border-color:#ffd700;box-shadow:0 0 8px rgba(255,215,0,.4)}' +
      '.cust-actions{display:flex;gap:8px;margin-top:12px}' +
      '.cust-actions button{flex:1;padding:10px;border:none;border-radius:10px;font-weight:800;font-size:.85rem;cursor:pointer;transition:transform .15s}' +
      '.cust-save{background:linear-gradient(135deg,#ffd700,#ff6b35);color:#1a1a2e}' +
      '.cust-reset{background:rgba(255,255,255,.08);color:#888}' +
      '.cust-section.cust-wide{grid-column:1/-1}' +
      '@media(max-width:480px){#cust-advanced-opts.show{grid-template-columns:1fr}}'
    document.head.appendChild(style)
  },

  _buildUI() {
    const overlay = document.createElement('div')
    overlay.id = 'customizer-overlay'
    overlay.onclick = (e) => { if (e.target === overlay) this.close() }

    overlay.innerHTML =
      '<div id="customizer-panel">' +
        '<button class="cust-close" onclick="Customizer.close()">&times;</button>' +
        '<div class="cust-title">CHARACTER SETTINGS</div>' +
        '<div class="cust-mode-toggle">' +
          '<button class="cust-mode-btn" data-mode="simple" onclick="Customizer._setMode(\'simple\')">SIMPLE</button>' +
          '<button class="cust-mode-btn" data-mode="advanced" onclick="Customizer._setMode(\'advanced\')">ADVANCED</button>' +
          '<button class="cust-mode-btn" data-mode="brawl" onclick="Customizer._setMode(\'brawl\')">BRAWL STARS</button>' +
        '</div>' +
        '<div id="cust-preview-wrap"><canvas id="cust-preview" width="200" height="200"></canvas></div>' +
        '<div id="cust-advanced-opts">' +
          this._buildSection('Skin', 'skinColor', SKIN_COLORS.map((c, i) => ({ id: i, color: c })), true, true) +
          this._buildSection('Body', 'body', APPEARANCE_CATALOG.body) +
          this._buildSection('Face', 'face', APPEARANCE_CATALOG.face) +
          this._buildSection('Hair / Hat', 'hairHat', APPEARANCE_CATALOG.hairHat, false, true) +
          this._buildSection('Shirt', 'shirt', APPEARANCE_CATALOG.shirt) +
          this._buildSection('Pants', 'pants', APPEARANCE_CATALOG.pants) +
          this._buildSection('Weapon', 'weapon', WEAPON_CATALOG, false, true) +
          this._buildSection('Accessory', 'accessory', APPEARANCE_CATALOG.accessory) +
        '</div>' +
        '<div id="cust-brawl-opts">' +
          '<div class="brawl-cards">' +
            '<div class="brawl-card" data-brawl="sirius" onclick="Customizer._pickBrawl(\'sirius\')"><canvas width="100" height="100" data-brawl-preview="sirius"></canvas><div class="brawl-card-name">SIRIUS</div></div>' +
            '<div class="brawl-card" data-brawl="kenji" onclick="Customizer._pickBrawl(\'kenji\')"><canvas width="100" height="100" data-brawl-preview="kenji"></canvas><div class="brawl-card-name">KENJI</div></div>' +
            '<div class="brawl-card" data-brawl="nori" onclick="Customizer._pickBrawl(\'nori\')"><canvas width="100" height="100" data-brawl-preview="nori"></canvas><div class="brawl-card-name">NORI</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="cust-actions">' +
          '<button class="cust-reset" onclick="Customizer._reset()">RESET</button>' +
          '<button class="cust-save" onclick="Customizer._save()">SAVE</button>' +
        '</div>' +
      '</div>'

    document.body.appendChild(overlay)
    this._el = overlay
    this._previewCanvas = document.getElementById('cust-preview')
    this._previewCtx = this._previewCanvas.getContext('2d')
  },

  _buildSection(label, key, items, isColor, wide) {
    let opts = ''
    if (isColor) {
      opts = items.map(item =>
        '<button class="cust-color-opt" data-cat="' + key + '" data-id="' + item.id + '" ' +
        'style="background:' + item.color + '" ' +
        'onclick="Customizer._pick(\'' + key + '\',' + item.id + ')"></button>'
      ).join('')
    } else {
      opts = items.map(item =>
        '<button class="cust-opt" data-cat="' + key + '" data-id="' + item.id + '" ' +
        'onclick="Customizer._pick(\'' + key + '\',\'' + item.id + '\')">' + item.label + '</button>'
      ).join('')
    }
    const cls = 'cust-section' + (wide ? ' cust-wide' : '')
    return '<div class="' + cls + '"><div class="cust-section-label">' + label + '</div><div class="cust-options">' + opts + '</div></div>'
  },

  open() {
    if (!this._el) this.init()
    this._figureMode = this._getFigureMode()
    this._tempAppearance = Object.assign({}, this._getAppearance())
    this._open = true
    this._el.classList.add('open')
    this._updateModeButtons(this._figureMode)
    this._updateSelections()
    this._renderPreview()
  },

  close() {
    this._open = false
    if (this._el) this._el.classList.remove('open')
  },

  _setMode(mode) {
    this._figureMode = mode
    localStorage.setItem('figureMode', mode)
    if (typeof Player !== 'undefined') Player.figureMode = mode
    this._updateModeButtons(mode)
    this._renderPreview()
  },

  _updateModeButtons(mode) {
    const btns = this._el.querySelectorAll('.cust-mode-btn')
    btns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode))
    const advPanel = document.getElementById('cust-advanced-opts')
    const brawlPanel = document.getElementById('cust-brawl-opts')
    advPanel.classList.toggle('show', mode === 'advanced')
    brawlPanel.classList.toggle('show', mode === 'brawl')
    if (mode === 'brawl') this._renderBrawlCards()
  },

  _pick(cat, val) {
    this._tempAppearance[cat] = val
    this._updateSelections()
    this._renderPreview()
  },

  _updateSelections() {
    const app = this._tempAppearance
    const allOpts = this._el.querySelectorAll('[data-cat]')
    allOpts.forEach(el => {
      const cat = el.dataset.cat
      const id = el.dataset.id
      const match = (cat === 'skinColor') ? (parseInt(id) === app[cat]) : (id === app[cat])
      el.classList.toggle('selected', match)
    })
  },

  _pickBrawl(charId) {
    this._tempAppearance.brawlCharacter = charId
    this._updateBrawlSelection()
    this._renderPreview()
  },

  _renderBrawlCards() {
    if (typeof BrawlRenderer === 'undefined') return
    const chars = ['sirius', 'kenji', 'nori']
    chars.forEach(id => {
      const canvas = this._el.querySelector('[data-brawl-preview="' + id + '"]')
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, 100, 100)
      ctx.save()
      ctx.translate(50, 52)
      ctx.scale(1.6, 1.6)
      const animState = { time: performance.now() / 1000, walking: false, dead: false, hitFlash: 0 }
      BrawlRenderer.drawCharacter(ctx, 0, 0, 22, Math.PI / 2, id, animState)
      ctx.restore()
    })
    this._updateBrawlSelection()
  },

  _updateBrawlSelection() {
    const charId = this._tempAppearance.brawlCharacter || 'sirius'
    const cards = this._el.querySelectorAll('.brawl-card')
    cards.forEach(c => c.classList.toggle('selected', c.dataset.brawl === charId))
  },

  _renderPreview() {
    const ctx = this._previewCtx
    const w = this._previewCanvas.width
    const h = this._previewCanvas.height
    ctx.clearRect(0, 0, w, h)

    const x = w / 2
    const y = h / 2 + 8
    const scale = 2.2

    if (this._figureMode === 'brawl' && typeof BrawlRenderer !== 'undefined') {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      const animState = { time: performance.now() / 1000, walking: false, dead: false, hitFlash: 0 }
      BrawlRenderer.drawCharacter(ctx, 0, 0, 28, Math.PI / 2, this._tempAppearance.brawlCharacter || 'sirius', animState)
      ctx.restore()
    } else if (this._figureMode === 'advanced' && typeof AdvancedRenderer !== 'undefined') {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      const animState = { time: performance.now() / 1000, walking: false, lowHealth: false, dead: false, hitFlash: 0, attackFlash: 0 }
      AdvancedRenderer.drawCharacter(ctx, 0, 0, 28, Math.PI / 2, this._tempAppearance, animState)
      ctx.restore()
    } else {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.beginPath()
      ctx.ellipse(0, 20, 16, 5, 0, 0, Math.PI * 2)
      ctx.fill()

      const grad = ctx.createRadialGradient(-6, -6, 1, 0, 0, 22)
      grad.addColorStop(0, '#99ddff')
      grad.addColorStop(0.5, '#4499ff')
      grad.addColorStop(1, '#2255bb')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, 0, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 3
      ctx.stroke()

      for (const side of [-1, 1]) {
        const ex = side * 7
        const ey = -2
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(ex, ey, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#2255cc'
        ctx.beginPath()
        ctx.arc(ex, ey + 1, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#111'
        ctx.beginPath()
        ctx.arc(ex, ey + 1.5, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 7, 5, 0.2, Math.PI - 0.2)
      ctx.stroke()
      ctx.restore()
    }
  },

  _save() {
    const validated = validateAppearance(this._tempAppearance)
    localStorage.setItem('appearance', JSON.stringify(validated))
    localStorage.setItem('figureMode', this._figureMode)
    if (typeof Player !== 'undefined') {
      Player.appearance = validated
      Player.figureMode = this._figureMode
    }
    if (typeof mp !== 'undefined' && mp && mp.socket && mp.socket.connected) {
      mp.socket.emit('appearance-update', { figureMode: this._figureMode, appearance: validated })
    }
    this.close()
  },

  _reset() {
    this._tempAppearance = Object.assign({}, DEFAULT_APPEARANCE)
    this._updateSelections()
    this._renderPreview()
  },
}
