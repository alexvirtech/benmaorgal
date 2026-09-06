import { GAME_WIDTH, GAME_HEIGHT } from './engine.js'

export function checkAABB(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function checkCircle(a, b) {
  const ax = a.x + a.width / 2
  const ay = a.y + a.height / 2
  const bx = b.x + b.width / 2
  const by = b.y + b.height / 2
  const dist = Math.hypot(ax - bx, ay - by)
  return dist < (a.width + b.width) / 2
}

export function clampToBounds(entity, padTop = 0) {
  if (entity.x < 0) entity.x = 0
  if (entity.x + entity.width > GAME_WIDTH) entity.x = GAME_WIDTH - entity.width
  if (entity.y < padTop) entity.y = padTop
  if (entity.y + entity.height > GAME_HEIGHT) entity.y = GAME_HEIGHT - entity.height
}

export function isOutOfBounds(entity) {
  return (
    entity.x + entity.width < 0 ||
    entity.x > GAME_WIDTH ||
    entity.y + entity.height < 0 ||
    entity.y > GAME_HEIGHT
  )
}

export function bounceBall(ball, paddle, wallBounce = true) {
  if (wallBounce) {
    if (ball.x <= 0 || ball.x + ball.width >= GAME_WIDTH) {
      ball.vx *= -1
      ball.x = Math.max(0, Math.min(ball.x, GAME_WIDTH - ball.width))
    }
    if (ball.y <= 40) {
      ball.vy *= -1
      ball.y = 40
    }
  }

  if (paddle && checkAABB(ball, paddle) && ball.vy > 0) {
    ball.vy = -Math.abs(ball.vy)
    const hitPos = (ball.x + ball.width / 2 - paddle.x) / paddle.width
    ball.vx = (hitPos - 0.5) * 8
    ball.y = paddle.y - ball.height
  }
}
