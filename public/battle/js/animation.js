const ANIM_STATES = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  AIM: 'aim',
  ATTACK: 'attack',
  HIT: 'hit',
  LOW_HEALTH: 'lowHealth',
  KO: 'ko',
  RESPAWN: 'respawn',
  VICTORY: 'victory',
}

const ANIM_PRIORITY = {
  ko: 7,
  respawn: 6,
  hit: 5,
  attack: 4,
  victory: 3,
  aim: 2,
  run: 2,
  walk: 2,
  lowHealth: 1,
  idle: 0,
}

class AnimationController {
  constructor() {
    this.state = ANIM_STATES.IDLE
    this.time = 0
    this.attackFlash = 0
    this.hitFlash = 0
    this.respawnTimer = 0
    this.victoryTimer = 0
    this.walking = false
    this.running = false
    this.lowHealth = false
    this.dead = false
    this._lockUntil = 0
  }

  update(dt, gameState) {
    this.time += dt

    if (this.attackFlash > 0) this.attackFlash -= dt * 6
    if (this.hitFlash > 0) this.hitFlash -= dt * 5
    if (this.respawnTimer > 0) this.respawnTimer -= dt
    if (this.victoryTimer > 0) this.victoryTimer -= dt

    const health = gameState.health ?? 100
    const maxHealth = gameState.maxHealth ?? 100
    const alive = gameState.alive !== false
    const moving = gameState.moving || false
    const speed = gameState.speed || 0
    const attacking = gameState.attacking || false
    const hit = gameState.hit || false
    const victory = gameState.victory || false
    const respawning = gameState.respawning || false

    this.dead = !alive
    this.lowHealth = alive && (health / maxHealth) < 0.3
    this.walking = alive && moving && speed < 200
    this.running = alive && moving && speed >= 200

    if (!alive) {
      this.state = ANIM_STATES.KO
      return
    }

    if (respawning && this.respawnTimer > 0) {
      this.state = ANIM_STATES.RESPAWN
      return
    }

    if (hit) {
      this.hitFlash = 1
    }

    if (this.hitFlash > 0.5) {
      this.state = ANIM_STATES.HIT
      return
    }

    if (attacking) {
      this.attackFlash = 1
      this.state = ANIM_STATES.ATTACK
      return
    }

    if (this.attackFlash > 0.3) {
      this.state = ANIM_STATES.ATTACK
      return
    }

    if (victory && this.victoryTimer > 0) {
      this.state = ANIM_STATES.VICTORY
      return
    }

    if (this.running) {
      this.state = ANIM_STATES.RUN
      return
    }

    if (this.walking) {
      this.state = ANIM_STATES.WALK
      return
    }

    this.state = this.lowHealth ? ANIM_STATES.LOW_HEALTH : ANIM_STATES.IDLE
  }

  triggerAttack() {
    this.attackFlash = 1
  }

  triggerHit() {
    this.hitFlash = 1
  }

  triggerRespawn() {
    this.respawnTimer = 0.8
  }

  triggerVictory() {
    this.victoryTimer = 2
  }

  getState() {
    return {
      state: this.state,
      time: this.time,
      attackFlash: Math.max(0, this.attackFlash),
      hitFlash: Math.max(0, this.hitFlash),
      walking: this.walking,
      running: this.running,
      lowHealth: this.lowHealth,
      dead: this.dead,
    }
  }
}
