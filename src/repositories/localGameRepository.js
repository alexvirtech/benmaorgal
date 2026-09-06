const STORAGE_KEY = 'benmaorgal-games-v1'

function readAll() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function writeAll(games) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
  } catch (err) {
    console.error('Failed to save games:', err)
  }
}

export function getGames() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getGame(id) {
  return readAll().find(g => g.id === id) || null
}

export function saveGame(game) {
  const games = readAll()
  const idx = games.findIndex(g => g.id === game.id)
  const updated = { ...game, updatedAt: Date.now() }
  if (idx >= 0) {
    games[idx] = updated
  } else {
    updated.createdAt = updated.createdAt || Date.now()
    games.push(updated)
  }
  writeAll(games)
  return updated
}

export function deleteGame(id) {
  const games = readAll().filter(g => g.id !== id)
  writeAll(games)
}

export function createGame(definition, messages = []) {
  const game = {
    id: definition.id,
    title: definition.title,
    template: definition.template,
    definition,
    messages,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return saveGame(game)
}
