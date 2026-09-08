'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import RobotChat from '@/components/robot/RobotChat'
import GameControls from '@/components/games/GameControls'
import { GameEngine, GAME_WIDTH, GAME_HEIGHT } from '@/game-sdk/engine'
import { InputManager } from '@/game-sdk/input'
import { getTemplate, getTemplateMetadata } from '@/game-templates/index'
import { routePrompt } from '@/ai/BrainRouter'
import { getGame, saveGame, getDisplayTitle, restoreOriginal, saveAsCopy, hasChanges } from '@/repositories/localGameRepository'
import { gameSound } from '@/game-sdk/sound'
import { useLang } from '@/i18n'

export default function GameWorkspacePage() {
  const { gameId } = useParams()
  const router = useRouter()
  const { t, lang } = useLang()
  const [game, setGame] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [messages, setMessages] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [copyName, setCopyName] = useState('')
  const [changed, setChanged] = useState(false)
  const [soundOn, setSoundOn] = useState(false)

  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const inputRef = useRef(null)
  const gameRef = useRef(null)
  const gameContainerRef = useRef(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setChatOpen(!isMobile)
  }, [isMobile])

  useEffect(() => {
    try {
      const v = localStorage.getItem('benmaorgal-sound')
      const on = v === 'on'
      setSoundOn(on)
      gameSound.enabled = on
    } catch {}
  }, [])

  useEffect(() => {
    const g = getGame(gameId)
    if (!g) {
      router.push('/games')
      return
    }
    setGame(g)
    gameRef.current = g
    setMessages(g.messages || [])
    setTitle(getDisplayTitle(g.title))
    setChanged(hasChanges(g.id))
    const meta = getTemplateMetadata(g.template)
    setSuggestions(meta?.suggestions || [])
    setLoaded(true)
  }, [gameId, router])

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !gameContainerRef.current) return
    const rect = gameContainerRef.current.getBoundingClientRect()
    const maxW = rect.width - 24
    const maxH = rect.height - 24
    if (maxW <= 0 || maxH <= 0) return
    const scale = Math.min(maxW / GAME_WIDTH, maxH / GAME_HEIGHT)
    canvasRef.current.width = GAME_WIDTH * scale
    canvasRef.current.height = GAME_HEIGHT * scale
    canvasRef.current.style.width = `${GAME_WIDTH * scale}px`
    canvasRef.current.style.height = `${GAME_HEIGHT * scale}px`
  }, [])

  const setupEngine = useCallback((def) => {
    if (!canvasRef.current || !def) return

    if (engineRef.current) engineRef.current.stop()
    if (inputRef.current) inputRef.current.detach()

    resizeCanvas()

    const engine = new GameEngine(canvasRef.current)
    const input = new InputManager()
    input.attach(canvasRef.current)
    engine.input = input

    const template = getTemplate(def.template)
    if (!template) return

    engine.setDefinition(def)
    engine.setTemplate(template)
    engine.state.lives = def.rules?.startingLives || 3
    engine.sound = gameSound
    engine.onStateChange = (s) => setGameState(s)

    template.setup(engine, def)

    engineRef.current = engine
    inputRef.current = input
  }, [resizeCanvas])

  useEffect(() => {
    if (game) {
      setupEngine(game.definition)
    }
    return () => {
      if (engineRef.current) engineRef.current.stop()
      if (inputRef.current) inputRef.current.detach()
    }
  }, [game, setupEngine])

  useEffect(() => {
    const timer = setTimeout(resizeCanvas, 50)
    return () => clearTimeout(timer)
  }, [chatOpen, resizeCanvas])

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  const save = useCallback((updatedGame) => {
    saveGame(updatedGame)
    gameRef.current = updatedGame
    setChanged(hasChanges(updatedGame.id))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [])

  const handleSend = useCallback(async (english, hebrew) => {
    const currentGame = gameRef.current
    if (!currentGame || busy) return

    setBusy(true)

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: english,
      textHe: hebrew || null,
      lang: hebrew ? 'he' : 'en',
      timestamp: Date.now(),
    }
    const newMessages = [...(currentGame.messages || []), userMsg]
    setMessages(newMessages)

    let result
    try {
      result = await routePrompt(english, currentGame, 'modify')
    } catch {
      result = {
        intent: 'UNKNOWN',
        robotMessage: t('robot.offline'),
        robotMessageHe: t('robot.offline'),
      }
    }

    const robotMsg = {
      id: Date.now() + 1,
      role: 'robot',
      text: result.robotMessage,
      textHe: result.robotMessageHe || result.robotMessage,
      timestamp: Date.now(),
    }
    newMessages.push(robotMsg)

    if (result.intent === 'MODIFY_GAME' && result.definition) {
      const historyEntry = {
        id: Date.now(),
        timestamp: Date.now(),
        prompt: english,
        promptHe: hebrew || null,
        actions: result.actions,
        description: result.robotMessage,
        previousDefinition: currentGame.definition,
        resultingDefinition: result.definition,
      }

      const updatedGame = {
        ...currentGame,
        definition: result.definition,
        title: result.definition.title || currentGame.title,
        messages: newMessages,
        history: [...(currentGame.history || []), historyEntry],
      }

      setGame(updatedGame)
      setMessages(newMessages)
      setTitle(getDisplayTitle(updatedGame.title))
      save(updatedGame)

      if (engineRef.current) engineRef.current.stop()
      setupEngine(result.definition)

      if (result.suggestions?.length) {
        setSuggestions(result.suggestions)
      }
    } else if (result.intent === 'CREATE_GAME' && result.definition) {
      const updatedGame = {
        ...currentGame,
        definition: result.definition,
        template: result.definition.template,
        title: result.definition.title || currentGame.title,
        messages: newMessages,
        history: [],
      }
      setGame(updatedGame)
      setMessages(newMessages)
      setTitle(getDisplayTitle(updatedGame.title))
      save(updatedGame)
      setupEngine(result.definition)

      const meta = getTemplateMetadata(result.definition.template)
      setSuggestions(meta?.suggestions || [])
    } else {
      const updatedGame = { ...currentGame, messages: newMessages }
      setGame(updatedGame)
      setMessages(newMessages)
      save(updatedGame)
    }

    setBusy(false)
  }, [save, setupEngine, busy, t])

  const handleUndo = useCallback(() => {
    const currentGame = gameRef.current
    if (!currentGame || !currentGame.history?.length) return

    const history = [...currentGame.history]
    const lastEntry = history.pop()

    const undoMsg = {
      id: Date.now(),
      role: 'robot',
      text: t('controls.undo') + ' ↩️',
      textHe: t('controls.undo') + ' ↩️',
      timestamp: Date.now(),
    }

    const updatedGame = {
      ...currentGame,
      definition: lastEntry.previousDefinition,
      messages: [...(currentGame.messages || []), undoMsg],
      history,
    }

    setGame(updatedGame)
    setMessages(updatedGame.messages)
    save(updatedGame)
    setupEngine(lastEntry.previousDefinition)
  }, [save, setupEngine, t])

  const handleRestore = useCallback(() => {
    const restored = restoreOriginal(gameId)
    if (!restored) return
    setGame(restored)
    gameRef.current = restored
    setMessages([])
    setTitle(getDisplayTitle(restored.title))
    setChanged(false)
    setShowRestoreConfirm(false)
    setShowMenu(false)
    setupEngine(restored.definition)
  }, [gameId, setupEngine])

  const handleSaveAs = useCallback(() => {
    const name = copyName.trim()
    if (!name) return
    const copy = saveAsCopy(gameId, name)
    if (copy) {
      setCopyName('')
      setShowSaveAs(false)
      setShowMenu(false)
      router.push(`/games/${copy.id}`)
    }
  }, [gameId, copyName, router])

  const handlePlay = () => {
    const engine = engineRef.current
    if (!engine) return
    const s = engine.state
    if (s.status === 'paused') engine.resume()
    else if (s.status === 'won' || s.status === 'lost') engine.restart()
    else engine.start()
  }

  const handlePause = () => { engineRef.current?.pause() }
  const handleRestart = () => { engineRef.current?.restart() }

  const handleSoundToggle = () => {
    const next = !soundOn
    setSoundOn(next)
    gameSound.enabled = next
    try { localStorage.setItem('benmaorgal-sound', next ? 'on' : 'off') } catch {}
  }

  const handleTitleChange = () => {
    if (!editingTitle) { setEditingTitle(true); return }
    setEditingTitle(false)
    const currentGame = gameRef.current
    if (currentGame && title !== getDisplayTitle(currentGame.title)) {
      const newTitle = { he: title, en: title }
      const updatedGame = { ...currentGame, title: newTitle }
      updatedGame.definition = { ...updatedGame.definition, title: newTitle }
      setGame(updatedGame)
      save(updatedGame)
    }
  }

  if (!loaded) return null

  return (
    <>
      <Navigation />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #eee',
          background: '#fff',
          flexWrap: 'wrap',
          minHeight: '44px',
        }}>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            title={chatOpen ? 'Hide chat' : 'Show chat'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: chatOpen ? '#6c5ce7' : '#f0f0f5',
              color: chatOpen ? '#fff' : '#666',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {chatOpen ? '✕' : '💬'}
          </button>
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          {editingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleChange}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTitleChange() }}
              autoFocus
              dir="ltr"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                border: '2px solid #6c5ce7',
                borderRadius: '8px',
                padding: '4px 8px',
                outline: 'none',
                minWidth: 0,
                flex: 1,
                maxWidth: '200px',
              }}
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
              title="Click to rename"
            >
              🎮 {title}
            </h2>
          )}
          {saved && <span className="saved-indicator">💾</span>}

          <div style={{ marginInlineStart: 'auto', display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #dfe6e9',
                background: showMenu ? '#6c5ce7' : '#f8f9ff',
                color: showMenu ? '#fff' : '#636e72',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ⋯
            </button>

            {showMenu && (
              <div
                onClick={() => setShowMenu(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 49 }}
              />
            )}
            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                insetInlineEnd: 0,
                marginTop: '4px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                padding: '6px',
                zIndex: 50,
                minWidth: '160px',
                direction: 'rtl',
              }}>
                {changed && (
                  <button
                    onClick={() => { setShowRestoreConfirm(true); setShowMenu(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'right',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: '#d63031',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#ffeaea' }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    🔄 {t('save.restore')}
                  </button>
                )}
                <button
                  onClick={() => {
                    setCopyName(getDisplayTitle(game?.title) + ' (2)')
                    setShowSaveAs(true)
                    setShowMenu(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'right',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: '#2d3436',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#f0f0f5' }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  📋 {t('save.saveAs')}
                </button>
              </div>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => router.push('/games')}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              {isMobile ? '🏠' : `🏠 ${t('nav.myGames')}`}
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {chatOpen && !isMobile && (
            <div style={{
              width: '300px',
              minWidth: '280px',
              maxWidth: '340px',
              borderInlineEnd: '1px solid #eee',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}>
              <RobotChat
                messages={messages}
                suggestions={suggestions}
                onSend={handleSend}
                disabled={busy}
                templateId={game?.template}
              />
            </div>
          )}

          {chatOpen && isMobile && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '60vh',
              zIndex: 40,
              background: '#fff',
              borderTop: '2px solid #6c5ce7',
              borderRadius: '16px 16px 0 0',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <RobotChat
                messages={messages}
                suggestions={suggestions}
                onSend={handleSend}
                disabled={busy}
                templateId={game?.template}
              />
            </div>
          )}

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#f0f0f5',
            overflow: 'hidden',
          }}>
            <div
              ref={gameContainerRef}
              dir="ltr"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                  tabIndex={0}
                />
                {gameState?.status === 'paused' && (
                  <div
                    onClick={handlePlay}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.35)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      zIndex: 5,
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#6c5ce7',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}>
                      ▶
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '0 12px 8px' }}>
              <GameControls
                gameState={gameState}
                onPlay={handlePlay}
                onPause={handlePause}
                onRestart={handleRestart}
                onUndo={handleUndo}
                canUndo={game?.history?.length > 0}
                soundOn={soundOn}
                onSoundToggle={handleSoundToggle}
              />
            </div>
          </div>
        </div>
      </div>

      {showRestoreConfirm && (
        <div onClick={() => setShowRestoreConfirm(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            maxWidth: '340px', width: '100%', textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '20px', direction: 'rtl' }}>
              {t('save.restoreConfirm')}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRestoreConfirm(false)}>
                ✕
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleRestore}>
                🔄 {t('save.restore')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveAs && (
        <div onClick={() => setShowSaveAs(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            maxWidth: '340px', width: '100%',
          }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '12px', direction: 'rtl', fontWeight: 600 }}>
              {t('save.saveAsTitle')}
            </p>
            <input
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAs() }}
              autoFocus
              dir="rtl"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '2px solid #6c5ce7', fontSize: '0.95rem', outline: 'none',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSaveAs(false)}>
                ✕
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveAs}
                disabled={!copyName.trim()}
              >
                📋 {t('save.saveAs')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
