'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import RobotChat from '@/components/robot/RobotChat'
import GameControls from '@/components/games/GameControls'
import { GameEngine, GAME_WIDTH, GAME_HEIGHT } from '@/game-sdk/engine'
import { InputManager } from '@/game-sdk/input'
import { getTemplate, getTemplateMetadata } from '@/game-templates/index'
import { interpretPrompt } from '@/game-interpreter/LocalGameInterpreter'
import { getGame, saveGame } from '@/repositories/localGameRepository'

export default function GameWorkspacePage() {
  const { gameId } = useParams()
  const router = useRouter()
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
    const g = getGame(gameId)
    if (!g) {
      router.push('/games')
      return
    }
    setGame(g)
    gameRef.current = g
    setMessages(g.messages || [])
    setTitle(g.title || '')
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

    template.setup(engine, def)

    const origUpdate = template.update
    template.update = (eng, dt) => {
      input.update()
      origUpdate.call(template, eng, dt)
      setGameState({ ...eng.state })
    }

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
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [])

  const handleSend = useCallback((text) => {
    const currentGame = gameRef.current
    if (!currentGame) return

    const userMsg = { id: Date.now(), role: 'user', text, timestamp: Date.now() }
    const newMessages = [...(currentGame.messages || []), userMsg]

    const result = interpretPrompt(text, currentGame)
    const robotMsg = { id: Date.now() + 1, role: 'robot', text: result.robotMessage, timestamp: Date.now() }
    newMessages.push(robotMsg)

    if (result.intent === 'MODIFY_GAME' && result.definition) {
      const historyEntry = {
        id: Date.now(),
        timestamp: Date.now(),
        prompt: text,
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
      setTitle(updatedGame.title)
      save(updatedGame)

      if (engineRef.current) engineRef.current.stop()
      setupEngine(result.definition)
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
      setTitle(updatedGame.title)
      save(updatedGame)
      setupEngine(result.definition)

      const meta = getTemplateMetadata(result.template)
      setSuggestions(meta?.suggestions || [])
    } else {
      const updatedGame = { ...currentGame, messages: newMessages }
      setGame(updatedGame)
      setMessages(newMessages)
      save(updatedGame)
    }
  }, [save, setupEngine])

  const handleUndo = useCallback(() => {
    const currentGame = gameRef.current
    if (!currentGame || !currentGame.history?.length) return

    const history = [...currentGame.history]
    const lastEntry = history.pop()

    const undoMsg = { id: Date.now(), role: 'robot', text: 'No problem! ↩️\n\nI changed it back.', timestamp: Date.now() }

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
  }, [save, setupEngine])

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

  const handleTitleChange = () => {
    if (!editingTitle) { setEditingTitle(true); return }
    setEditingTitle(false)
    const currentGame = gameRef.current
    if (currentGame && title !== currentGame.title) {
      const updatedGame = { ...currentGame, title }
      updatedGame.definition = { ...updatedGame.definition, title }
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
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push('/games')}
            style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            {isMobile ? '🏠' : '🏠 My Games'}
          </button>
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
              borderRight: '1px solid #eee',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}>
              <RobotChat
                messages={messages}
                suggestions={suggestions}
                onSend={handleSend}
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
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                overflow: 'hidden',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  cursor: 'pointer',
                }}
                tabIndex={0}
              />
            </div>
            <div style={{ padding: '0 12px 8px' }}>
              <GameControls
                gameState={gameState}
                onPlay={handlePlay}
                onPause={handlePause}
                onRestart={handleRestart}
                onUndo={handleUndo}
                canUndo={game?.history?.length > 0}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
