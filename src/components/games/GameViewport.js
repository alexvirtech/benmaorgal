'use client'

import { useRef, useEffect, useCallback } from 'react'
import { GameEngine, GAME_WIDTH, GAME_HEIGHT } from '@/game-sdk/engine'
import { InputManager } from '@/game-sdk/input'
import { getTemplate } from '@/game-templates/index'

export default function GameViewport({ definition, onStateChange }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const inputRef = useRef(null)

  const setupGame = useCallback((def) => {
    if (!canvasRef.current || !def) return

    if (engineRef.current) {
      engineRef.current.stop()
    }
    if (inputRef.current) {
      inputRef.current.detach()
    }

    const canvas = canvasRef.current
    const rect = canvas.parentElement.getBoundingClientRect()
    const scale = Math.min(rect.width / GAME_WIDTH, (rect.height || 600) / GAME_HEIGHT)
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

    const origUpdate = template.update.bind(template)
    template.update = (eng, dt) => {
      input.update()
      origUpdate(eng, dt)
      if (onStateChange) {
        onStateChange({ ...eng.state })
      }
    }

    engineRef.current = engine
    inputRef.current = input
  }, [onStateChange])

  useEffect(() => {
    setupGame(definition)
    return () => {
      if (engineRef.current) engineRef.current.stop()
      if (inputRef.current) inputRef.current.detach()
    }
  }, [definition, setupGame])

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.parentElement.getBoundingClientRect()
      const scale = Math.min(rect.width / GAME_WIDTH, (rect.height || 600) / GAME_HEIGHT)
      canvasRef.current.width = GAME_WIDTH * scale
      canvasRef.current.height = GAME_HEIGHT * scale
      canvasRef.current.style.width = `${GAME_WIDTH * scale}px`
      canvasRef.current.style.height = `${GAME_HEIGHT * scale}px`
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const play = useCallback(() => {
    if (!engineRef.current) return
    const state = engineRef.current.state
    if (state.status === 'paused') {
      engineRef.current.resume()
    } else if (state.status === 'ready' || state.status === 'won' || state.status === 'lost') {
      engineRef.current.restart()
    } else {
      engineRef.current.start()
    }
  }, [])

  const pause = useCallback(() => {
    if (engineRef.current) engineRef.current.pause()
  }, [])

  const restart = useCallback(() => {
    if (engineRef.current) engineRef.current.restart()
  }, [])

  return {
    canvasRef,
    play,
    pause,
    restart,
    getEngine: () => engineRef.current,
  }
}
