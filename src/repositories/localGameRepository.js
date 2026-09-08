const DB_NAME = 'benmaorgal'
const DB_VERSION = 1
const STORE_NAME = 'games'
const LS_KEY = 'benmaorgal-games-v2'
const LEGACY_KEY = 'benmaorgal-games-v1'

let cache = null
let dbReady = false
let dbInstance = null

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('no indexedDB'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbReadAll() {
  const db = dbInstance || await openDB()
  dbInstance = db
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(game) {
  const db = dbInstance || await openDB()
  dbInstance = db
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(game)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function idbDelete(id) {
  const db = dbInstance || await openDB()
  dbInstance = db
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function idbPutAll(games) {
  const db = dbInstance || await openDB()
  dbInstance = db
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const g of games) store.put(g)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function lsReadAll() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function lsReadLegacy() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.map(g => {
      try {
        if (g.definition?.title && typeof g.definition.title === 'string') {
          g.definition.title = { he: g.definition.title, en: g.definition.title }
        }
        if (g.title && typeof g.title === 'string') {
          g.title = { he: g.title, en: g.title }
        }
        return g
      } catch {
        return null
      }
    }).filter(Boolean)
  } catch {
    return []
  }
}

function normalizeTitle(title) {
  if (!title) return { he: 'My Game', en: 'My Game' }
  if (typeof title === 'string') return { he: title, en: title }
  return title
}

function ensureOriginal(game) {
  if (!game.originalDefinition && game.definition) {
    game.originalDefinition = JSON.parse(JSON.stringify(game.definition))
  }
  return game
}

function initCache() {
  if (cache !== null) return
  cache = []

  const lsGames = lsReadAll()
  if (lsGames.length > 0) {
    cache = lsGames.map(ensureOriginal)
  } else {
    const legacy = lsReadLegacy()
    if (legacy.length > 0) {
      cache = legacy.map(ensureOriginal)
    }
  }

  migrateToIDB()
}

async function migrateToIDB() {
  try {
    const idbGames = await idbReadAll()
    if (idbGames.length > 0 && cache.length === 0) {
      cache = idbGames.map(ensureOriginal)
      return
    }
    if (cache.length > 0 && idbGames.length === 0) {
      await idbPutAll(cache)
    } else if (idbGames.length > 0 && cache.length > 0) {
      const idbMap = new Map(idbGames.map(g => [g.id, g]))
      for (const g of cache) {
        const existing = idbMap.get(g.id)
        if (!existing || (g.updatedAt || 0) > (existing.updatedAt || 0)) {
          idbMap.set(g.id, g)
        }
      }
      cache = [...idbMap.values()].map(ensureOriginal)
      await idbPutAll(cache)
    }
    dbReady = true
  } catch {
    // IDB unavailable, localStorage only
  }
}

function persistAsync(game) {
  if (dbReady) {
    idbPut(game).catch(() => {})
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache))
  } catch { /* full */ }
}

function persistDeleteAsync(id) {
  if (dbReady) {
    idbDelete(id).catch(() => {})
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache))
  } catch { /* full */ }
}

export function getGames() {
  initCache()
  return [...cache].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getGame(id) {
  initCache()
  return cache.find(g => g.id === id) || null
}

export function saveGame(game) {
  initCache()
  const idx = cache.findIndex(g => g.id === game.id)
  const updated = { ...game, updatedAt: Date.now() }
  updated.title = normalizeTitle(updated.title)
  if (updated.definition) {
    updated.definition.title = normalizeTitle(updated.definition.title)
  }
  if (idx >= 0) {
    cache[idx] = updated
  } else {
    updated.createdAt = updated.createdAt || Date.now()
    cache.push(updated)
  }
  persistAsync(updated)
  return updated
}

export function deleteGame(id) {
  initCache()
  cache = cache.filter(g => g.id !== id)
  persistDeleteAsync(id)
}

export function createGame(definition, messages = []) {
  const game = {
    id: definition.id,
    title: normalizeTitle(definition.title),
    template: definition.template,
    definition: { ...definition, title: normalizeTitle(definition.title) },
    originalDefinition: JSON.parse(JSON.stringify({ ...definition, title: normalizeTitle(definition.title) })),
    messages,
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return saveGame(game)
}

export function restoreOriginal(id) {
  initCache()
  const game = cache.find(g => g.id === id)
  if (!game || !game.originalDefinition) return null
  const restored = {
    ...game,
    definition: JSON.parse(JSON.stringify(game.originalDefinition)),
    history: [],
    messages: [],
    updatedAt: Date.now(),
  }
  restored.title = normalizeTitle(restored.definition.title)
  const idx = cache.findIndex(g => g.id === id)
  if (idx >= 0) cache[idx] = restored
  persistAsync(restored)
  return restored
}

export function saveAsCopy(id, newTitle) {
  initCache()
  const game = cache.find(g => g.id === id)
  if (!game) return null
  const newId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const title = normalizeTitle(newTitle)
  const copy = {
    ...JSON.parse(JSON.stringify(game)),
    id: newId,
    title,
    definition: { ...JSON.parse(JSON.stringify(game.definition)), id: newId, title },
    originalDefinition: JSON.parse(JSON.stringify(game.definition)),
    messages: [],
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return saveGame(copy)
}

export function hasChanges(id) {
  initCache()
  const game = cache.find(g => g.id === id)
  if (!game || !game.originalDefinition) return false
  return JSON.stringify(game.definition) !== JSON.stringify(game.originalDefinition)
}

export function getDisplayTitle(title) {
  if (!title) return 'My Game'
  if (typeof title === 'string') return title
  return title.he || title.en || 'My Game'
}
