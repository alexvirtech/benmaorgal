let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, dur, type, vol, delay = 0, endFreq) {
  const ac = getCtx()
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (endFreq != null) osc.frequency.linearRampToValueAtTime(endFreq, t + dur)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

const FX = {
  collect() {
    tone(587, 0.07, 'square', 0.15)
    tone(880, 0.09, 'square', 0.15, 0.06)
  },
  hurt() {
    tone(200, 0.15, 'sawtooth', 0.2, 0, 80)
  },
  shoot() {
    tone(800, 0.08, 'square', 0.12, 0, 200)
  },
  bounce() {
    tone(440, 0.05, 'sine', 0.15)
  },
  win() {
    tone(523, 0.15, 'square', 0.15)
    tone(659, 0.15, 'square', 0.15, 0.12)
    tone(784, 0.15, 'square', 0.15, 0.24)
    tone(1047, 0.3, 'square', 0.2, 0.36)
  },
  lose() {
    tone(440, 0.2, 'triangle', 0.15)
    tone(370, 0.2, 'triangle', 0.15, 0.15)
    tone(311, 0.2, 'triangle', 0.15, 0.3)
    tone(262, 0.35, 'triangle', 0.2, 0.45)
  },
  click() {
    tone(600, 0.04, 'sine', 0.1)
  },
  jump() {
    tone(300, 0.1, 'square', 0.12, 0, 600)
  },
}

export const gameSound = {
  enabled: false,
  play(name) {
    if (!this.enabled) return
    const fn = FX[name]
    if (fn) {
      try { fn() } catch {}
    }
  },
}
