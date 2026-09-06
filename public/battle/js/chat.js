const Chat = {
  messages: [],
  maxMessages: 50,
  isOpen: false,
  unread: 0,
  socket: null,
  nickname: '',
  recognition: null,
  isRecording: false,
  translatedText: '',
  _listening: false,

  attachSocket(socket, nickname) {
    this.socket = socket
    this.nickname = nickname || ''
    this._bindEvents()
    this._listenSocket()
  },

  updateNickname(name) {
    this.nickname = name
  },

  _bindEvents() {
    const closeBtn = document.getElementById('chat-close')
    const input = document.getElementById('chat-input')
    const sendBtn = document.getElementById('chat-send-btn')
    const micBtn = document.getElementById('chat-mic-btn')
    if (!input) return

    if (closeBtn) closeBtn.onclick = () => this.close()

    input.onkeydown = (e) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        e.preventDefault()
        this._send()
      }
    }
    input.onkeyup = (e) => e.stopPropagation()
    input.onkeypress = (e) => e.stopPropagation()
    input.oninput = () => this._checkHebrew(input.value)

    sendBtn.onclick = (e) => {
      e.stopPropagation()
      this._send()
    }

    micBtn.onclick = (e) => {
      e.stopPropagation()
      this._toggleRecording()
    }

    const container = document.getElementById('chat-container')
    if (container) {
      container.onmousedown = (e) => e.stopPropagation()
      container.ontouchstart = (e) => e.stopPropagation()
    }
  },

  _listenSocket() {
    if (!this.socket || this._listening) return
    this._listening = true
    this.socket.on('chat-message', (msg) => {
      this._addMessage(msg)
      if (!this.isOpen) {
        this.unread++
        this._updateBadge()
      }
    })
  },

  toggle() {
    if (this.isOpen) this.close()
    else this.open()
  },

  open() {
    this.isOpen = true
    this.unread = 0
    this._updateBadge()
    const c = document.getElementById('chat-container')
    if (c) c.classList.add('open')
    const inp = document.getElementById('chat-input')
    if (inp) inp.focus()
  },

  close() {
    this.isOpen = false
    const c = document.getElementById('chat-container')
    if (c) c.classList.remove('open')
  },

  _updateBadge() {
    const badge = document.getElementById('chat-badge-top')
    if (!badge) return
    if (this.unread > 0) {
      badge.textContent = this.unread > 99 ? '99+' : this.unread
      badge.style.display = 'inline'
    } else {
      badge.style.display = 'none'
    }
  },

  _containsHebrew(text) {
    return /[֐-׿]/.test(text)
  },

  async _checkHebrew(text) {
    const transEl = document.getElementById('chat-translation')
    const transText = document.getElementById('chat-trans-text')
    if (!transEl || !transText) return

    if (!text.trim() || !this._containsHebrew(text)) {
      transEl.classList.remove('show')
      this.translatedText = ''
      return
    }

    transEl.classList.add('show')
    transText.textContent = 'Translating...'

    try {
      const encoded = encodeURIComponent(text.trim())
      const res = await fetch('https://api.mymemory.translated.net/get?q=' + encoded + '&langpair=he|en')
      const data = await res.json()
      if (data.responseData && data.responseData.translatedText) {
        this.translatedText = data.responseData.translatedText
        transText.textContent = this.translatedText
      } else {
        transText.textContent = 'Translation unavailable'
        this.translatedText = ''
      }
    } catch (err) {
      transText.textContent = 'Translation failed'
      this.translatedText = ''
    }
  },

  _send() {
    const input = document.getElementById('chat-input')
    if (!input) return
    let text = input.value.trim()
    if (!text) return

    let finalText = text
    let originalText = ''

    if (this._containsHebrew(text) && this.translatedText) {
      originalText = text
      finalText = this.translatedText
    }

    if (this.socket) {
      this.socket.emit('chat-message', {
        text: finalText,
        original: originalText || undefined,
      })
    }

    input.value = ''
    const transEl = document.getElementById('chat-translation')
    if (transEl) transEl.classList.remove('show')
    this.translatedText = ''
  },

  _addMessage(msg) {
    const msgArea = document.getElementById('chat-messages')
    if (!msgArea) return
    const empty = msgArea.querySelector('.chat-empty')
    if (empty) empty.remove()

    this.messages.push(msg)
    if (this.messages.length > this.maxMessages) {
      this.messages.shift()
      if (msgArea.firstChild) msgArea.removeChild(msgArea.firstChild)
    }

    const div = document.createElement('div')
    div.className = 'chat-msg'

    if (msg.system) {
      div.className += ' system'
      div.textContent = msg.text
    } else {
      const isSelf = msg.playerId === mp.myId
      if (isSelf) div.className += ' self'
      const nameSpan = document.createElement('span')
      nameSpan.className = 'chat-name'
      nameSpan.style.color = msg.color || '#ffd700'
      nameSpan.textContent = msg.nickname + ':'
      div.appendChild(nameSpan)
      div.appendChild(document.createTextNode(' ' + msg.text))

      if (msg.original) {
        const origDiv = document.createElement('div')
        origDiv.style.cssText = 'font-size:0.72rem;color:#777;margin-top:1px;direction:rtl;text-align:right'
        origDiv.textContent = msg.original
        div.appendChild(origDiv)
      }
    }

    msgArea.appendChild(div)
    msgArea.scrollTop = msgArea.scrollHeight
  },

  _toggleRecording() {
    if (this.isRecording) {
      this._stopRecording()
    } else {
      this._startRecording()
    }
  },

  _startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      this._addMessage({ system: true, text: 'Voice input not supported in this browser' })
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.lang = 'he-IL'

    const input = document.getElementById('chat-input')
    const micBtn = document.getElementById('chat-mic-btn')

    this.recognition.onstart = () => {
      this.isRecording = true
      if (micBtn) micBtn.classList.add('recording')
    }

    this.recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      if (input) {
        input.value = transcript
        this._checkHebrew(transcript)
      }
    }

    this.recognition.onend = () => {
      this.isRecording = false
      if (micBtn) micBtn.classList.remove('recording')
      this.recognition = null
    }

    this.recognition.onerror = (event) => {
      this.isRecording = false
      if (micBtn) micBtn.classList.remove('recording')
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this._addMessage({ system: true, text: 'Voice error: ' + event.error })
      }
      this.recognition = null
    }

    try {
      this.recognition.start()
    } catch (e) {
      this._addMessage({ system: true, text: 'Could not start voice input' })
    }
  },

  _stopRecording() {
    if (this.recognition) {
      try { this.recognition.stop() } catch (e) {}
    }
    this.isRecording = false
    const micBtn = document.getElementById('chat-mic-btn')
    if (micBtn) micBtn.classList.remove('recording')
  },
}
