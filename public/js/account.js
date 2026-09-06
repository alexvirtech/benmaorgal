(function() {
  var MP_SERVER = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://ben-battle-mp-4cbd83be597e.herokuapp.com'

  function ensureModal() {
    if (document.getElementById('account-modal')) return
    var div = document.createElement('div')
    div.id = 'account-modal'
    div.className = 'acct-overlay'
    div.style.display = 'none'
    div.onclick = function(e) { if (e.target === div) closeAccountModal() }
    div.innerHTML =
      '<div class="acct-box">' +
        '<button class="acct-close" onclick="closeAccountModal()">&times;</button>' +
        '<div id="account-content"></div>' +
      '</div>'
    document.body.appendChild(div)
  }

  function ensureStyles() {
    if (document.getElementById('acct-styles')) return
    var style = document.createElement('style')
    style.id = 'acct-styles'
    style.textContent =
      '.acct-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px}' +
      '.acct-box{background:#1a1a2e;border-radius:16px;padding:24px;max-width:420px;width:100%;max-height:80vh;overflow-y:auto;position:relative;border:1px solid rgba(255,255,255,.08)}' +
      '.acct-close{position:absolute;top:12px;right:12px;background:none;border:none;color:#888;font-size:1.3rem;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%}' +
      '.acct-close:hover{color:#fff;background:rgba(255,255,255,.1)}' +
      '.acct-header{text-align:center;margin-bottom:16px}' +
      '.acct-avatar{font-size:2.5rem;margin-bottom:4px}' +
      '.acct-name{font-size:1.5rem;font-weight:900;color:#ffd700}' +
      '.acct-since{font-size:.75rem;color:#666;margin-top:4px}' +
      '.acct-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:16px 0}' +
      '.acct-stat{text-align:center;background:rgba(255,255,255,.06);border-radius:10px;padding:12px 4px}' +
      '.acct-val{display:block;font-size:1.3rem;font-weight:900;color:#ffd700}' +
      '.acct-lbl{display:block;font-size:.6rem;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}' +
      '.hist-row{display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,.04);border-radius:8px;margin-bottom:4px;font-size:.85rem}' +
      '.hist-win{color:#ffd700;font-weight:800;min-width:32px}' +
      '.hist-loss{color:#888;font-weight:800;min-width:32px}' +
      '.hist-info{flex:1;color:#888;font-size:.75rem}' +
      '.hist-pts{font-weight:800}' +
      '.acct-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;border:none;border-radius:12px;background:linear-gradient(135deg,#ffd700,#ff6b35);color:#1a1a2e;font-size:.85rem;font-weight:800;cursor:pointer;text-decoration:none;letter-spacing:.5px;transition:transform .15s,box-shadow .15s;text-transform:uppercase;outline:none}' +
      '.acct-btn:hover{transform:scale(1.04);box-shadow:0 4px 16px rgba(255,215,0,.35)}' +
      '.acct-btn:active{transform:scale(.96)}'
    document.head.appendChild(style)
  }

  function esc(text) {
    var d = document.createElement('div')
    d.textContent = text
    return d.innerHTML
  }

  function renderAccount(content, profile, history, token) {
    var historyHtml = history.length === 0
      ? '<p style="color:#666;text-align:center;padding:12px">No games played yet</p>'
      : history.slice(0, 10).map(function(g) {
          var won = g.myPlacement === 1
          var date = new Date(g.createdAt).toLocaleDateString()
          return '<div class="hist-row">' +
            '<span class="' + (won ? 'hist-win' : 'hist-loss') + '">' + (won ? 'WIN' : '#' + g.myPlacement) + '</span>' +
            '<span class="hist-info">' + date + ' &middot; ' + g.players.length + 'p &middot; ' + g.myKills + 'K/' + g.myDeaths + 'D</span>' +
            '<span class="hist-pts">' + g.myScore + 'pts</span>' +
          '</div>'
        }).join('')

    content.innerHTML =
      '<div class="acct-header">' +
        '<div class="acct-avatar">&#x1F3AE;</div>' +
        '<div class="acct-name" id="acct-name-display">' +
          '<span id="acct-nick-text">' + esc(profile.nickname) + '</span>' +
          ' <button id="acct-edit-btn" style="background:none;border:none;color:#888;cursor:pointer;font-size:0.85rem;vertical-align:middle;padding:2px 6px" title="Edit name">&#9998;</button>' +
        '</div>' +
        '<div id="acct-edit-row" style="display:none;text-align:center;margin-top:6px">' +
          '<input id="acct-nick-input" type="text" maxlength="20" style="padding:6px 10px;border:2px solid rgba(255,215,0,0.4);border-radius:8px;background:rgba(255,255,255,0.08);color:#fff;font-size:1.1rem;font-weight:700;text-align:center;outline:none;width:150px">' +
          '<button id="acct-save-btn" style="padding:6px 12px;border:none;border-radius:8px;background:#44dd44;color:#1a1a2e;font-weight:800;font-size:0.8rem;cursor:pointer;margin-left:4px;vertical-align:middle">SAVE</button>' +
          '<button id="acct-cancel-btn" style="padding:6px 10px;border:none;border-radius:8px;background:rgba(255,255,255,0.1);color:#888;font-weight:700;font-size:0.8rem;cursor:pointer;margin-left:2px;vertical-align:middle">X</button>' +
          '<div id="acct-edit-err" style="color:#ff6b6b;font-size:0.75rem;margin-top:4px;display:none"></div>' +
        '</div>' +
        '<div class="acct-since">Since ' + new Date(profile.createdAt).toLocaleDateString() + '</div>' +
      '</div>' +
      '<div class="acct-grid">' +
        '<div class="acct-stat"><span class="acct-val">' + profile.stats.wins + '</span><span class="acct-lbl">Wins</span></div>' +
        '<div class="acct-stat"><span class="acct-val">' + profile.stats.gamesPlayed + '</span><span class="acct-lbl">Games</span></div>' +
        '<div class="acct-stat"><span class="acct-val">' + profile.stats.totalKills + '</span><span class="acct-lbl">Kills</span></div>' +
        '<div class="acct-stat"><span class="acct-val">' + profile.stats.totalDeaths + '</span><span class="acct-lbl">Deaths</span></div>' +
      '</div>' +
      '<h3 style="margin:16px 0 8px;font-size:.9rem;color:#aaa">Recent Games</h3>' +
      historyHtml

    setupEditHandlers(token, profile.nickname)
  }

  window.openAccountModal = function() {
    ensureStyles()
    ensureModal()
    var modal = document.getElementById('account-modal')
    var content = document.getElementById('account-content')
    modal.style.display = 'flex'

    var token = localStorage.getItem('mp-token')
    if (!token) {
      content.innerHTML = '<div style="text-align:center;padding:30px">' +
        '<p style="color:#888;margin-bottom:16px">No profile yet.</p>' +
        '<a href="/battle/lobby.html" style="color:#ffd700;font-weight:700;text-decoration:none">Play multiplayer to create one!</a>' +
        '</div>'
      return
    }

    content.innerHTML = '<div style="text-align:center;padding:30px;color:#888">Loading...</div>'

    var headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    Promise.all([
      fetch(MP_SERVER + '/api/players/me', { headers: headers }).then(function(r) { return r.json() }),
      fetch(MP_SERVER + '/api/players/me/history', { headers: headers }).then(function(r) { return r.json() }),
    ]).then(function(results) {
      var profile = results[0]
      var history = results[1]
      try {
        localStorage.setItem('cached-profile', JSON.stringify(profile))
        localStorage.setItem('cached-history', JSON.stringify(history))
      } catch(e) {}

      renderAccount(content, profile, history, token)
    }).catch(function() {
      try {
        var cp = JSON.parse(localStorage.getItem('cached-profile'))
        var ch = JSON.parse(localStorage.getItem('cached-history'))
        if (cp) { renderAccount(content, cp, ch || [], token); return }
      } catch(e) {}
      content.innerHTML = '<p style="text-align:center;color:#ff6b6b;padding:30px">Failed to load profile</p>'
    })
  }

  function setupEditHandlers(token, currentName) {
    var editBtn = document.getElementById('acct-edit-btn')
    var nameDisplay = document.getElementById('acct-name-display')
    var editRow = document.getElementById('acct-edit-row')
    var nickInput = document.getElementById('acct-nick-input')
    var saveBtn = document.getElementById('acct-save-btn')
    var cancelBtn = document.getElementById('acct-cancel-btn')
    var errEl = document.getElementById('acct-edit-err')

    editBtn.onclick = function() {
      nickInput.value = currentName
      nameDisplay.style.display = 'none'
      editRow.style.display = 'block'
      errEl.style.display = 'none'
      nickInput.focus()
      nickInput.select()
    }

    cancelBtn.onclick = function() {
      editRow.style.display = 'none'
      nameDisplay.style.display = ''
    }

    saveBtn.onclick = function() { doSave() }
    nickInput.onkeydown = function(e) { if (e.key === 'Enter') doSave() }

    function doSave() {
      var name = nickInput.value.trim()
      if (name.length < 1 || name.length > 20) {
        errEl.textContent = 'Name must be 1-20 characters'
        errEl.style.display = 'block'
        return
      }
      saveBtn.disabled = true
      saveBtn.textContent = '...'
      errEl.style.display = 'none'

      fetch(MP_SERVER + '/api/players/me', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name })
      }).then(function(r) {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }).then(function(data) {
        currentName = data.nickname
        localStorage.setItem('mp-nickname', data.nickname)
        document.getElementById('acct-nick-text').textContent = data.nickname
        editRow.style.display = 'none'
        nameDisplay.style.display = ''
        if (typeof mp !== 'undefined' && mp) {
          mp.nickname = data.nickname
          if (mp.socket && mp.socket.connected) {
            mp.socket.emit('nickname-change', { nickname: data.nickname })
          }
        }
        var menuNick = document.getElementById('menu-nickname')
        if (menuNick) menuNick.textContent = data.nickname
      }).catch(function() {
        errEl.textContent = 'Could not save. Try again.'
        errEl.style.display = 'block'
      }).finally(function() {
        saveBtn.disabled = false
        saveBtn.textContent = 'SAVE'
      })
    }
  }

  window.closeAccountModal = function() {
    var modal = document.getElementById('account-modal')
    if (modal) modal.style.display = 'none'
  }

  ensureStyles()
})()
