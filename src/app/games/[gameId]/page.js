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

  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const inputRef = useRef(null)
  const gameRef = useRef(null)

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

  const setupEngine = useCallback((def) => {
    if (!canvasRef.current || !def) return

    if (engineRef.current) engineRef.current.stop()
    if (inputRef.current) inputRef.current.detach()

    const canvas = canvasRef.current
    const container = canvas.parentElement
    const rect = container.getBoundingClientRect()
    const maxW = rect.width
    const maxH = Math.max(400, rect.height || 500)
    const scale = Math.min(maxW / GAME_WIDTH, maxH / GAME_HEIGHT, 1)
    canvas.width = GAME_WIDTH * scale
    canvas.height = GAME_HEIGHT * scale
    canvas.style.width = `${GAME_WIDTH * scale}px`
    canvas.style.height = `${GAME_HEIGHT * scale}px`

    const engine = new GameEngine(canvas)
    const input = new InputManager()
    input.attach(canvas)
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
  }, [])

  useEffect(() => {
    if (game) {
      setupEngine(game.definition)
    }
    return () => {
      if (engineRef.current) engineRef.current.stop()
      if (inputRef.current) inputRef.current.detach()
    }
  }, [game, setupEngine])

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
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #eee',
          background: '#fff',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '1.3rem' }}>🤖</span>
          {editingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleChange}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTitleChange() }}
              autoFocus
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                border: '2px solid #6c5ce7',
                borderRadius: '8px',
                padding: '4px 8px',
                outline: 'none',
              }}
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              style={{ fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer' }}
              title="Click to rename"
            >
              🎮 {title}
            </h2>
          )}
          {saved && <span className="saved-indicator">💾 Saved</span>}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push('/games')}
            style={{ marginLeft: 'auto' }}
          >
            🏠 My Games
          </button>
        </div>

        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}>
          <div style={{
            width: '35%',
            minWidth: '280px',
            maxWidth: '400px',
            borderRight: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <RobotChat
              messages={messages}
              suggestions={suggestions}
              onSend={handleSend}
            />
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#f0f0f5',
            overflow: 'hidden',
          }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              overflow: 'hidden',
            }}>
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
            <div style={{ padding: '0 12px 12px' }}>
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

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="width: 35%"] {
            width: 100% !important;
            max-width: none !important;
            border-right: none !important;
            border-bottom: 1px solid #eee;
            max-height: 40vh;
          }
          div[style*="display: flex"][style*="flex: 1"][style*="overflow: hidden"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </>
  )
}
