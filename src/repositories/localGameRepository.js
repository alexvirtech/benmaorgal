const STORAGE_KEY = 'benmaorgal-games-v2'
const LEGACY_KEY = 'benmaorgal-games-v1'

let migrated = false

function migrateV1() {
  if (migrated || typeof window === 'undefined') return
  migrated = true
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return

    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return

    const upgraded = data.map(g => {
      try {
        if (g.definition?.title && typeof g.definition.title === 'string') {
          g.definition.title = { he: g.definition.title, en: g.definition.title }
        }
        if (g.title && typeof g.title === 'string') {
          g.title = { he: g.title, en: g.title }
        }
        g.legacyDefinition = g.definition
        return g
      } catch {
        return null
      }
    }).filter(Boolean)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded))
  } catch {
    // corrupt v1 data — skip silently
  }
}

function readAll() {
  if (typeof window === 'undefined') return []
  migrateV1()
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

function normalizeTitle(title) {
  if (!title) return { he: 'My Game', en: 'My Game' }
  if (typeof title === 'string') return { he: title, en: title }
  return title
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
  updated.title = normalizeTitle(updated.title)
  if (updated.definition) {
    updated.definition.title = normalizeTitle(updated.definition.title)
  }
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
    title: normalizeTitle(definition.title),
    template: definition.template,
    definition: { ...definition, title: normalizeTitle(definition.title) },
    messages,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return saveGame(game)
}

export function getDisplayTitle(title) {
  if (!title) return 'My Game'
  if (typeof title === 'string') return title
  return title.he || title.en || 'My Game'
}
