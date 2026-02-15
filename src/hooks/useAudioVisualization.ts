'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseAudioVisualizationResult {
  isActive: boolean
  audioLevels: number[]
  averageLevel: number
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

const BIN_COUNT = 64
const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

export function useAudioVisualization(): UseAudioVisualizationResult {
  const [isActive, setIsActive] = useState(false)
  const [audioLevels, setAudioLevels] = useState<number[]>(() => new Array(BIN_COUNT).fill(0))
  const [averageLevel, setAverageLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    analyserRef.current = null
    dataArrayRef.current = null
  }, [])

  const tick = useCallback((time: number) => {
    if (!analyserRef.current || !dataArrayRef.current) return

    rafRef.current = requestAnimationFrame(tick)

    if (time - lastFrameTimeRef.current < FRAME_INTERVAL) return
    lastFrameTimeRef.current = time

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    const levels = Array.from(dataArrayRef.current)
    let sum = 0
    for (let i = 0; i < levels.length; i++) {
      sum += levels[i]
    }
    const avg = sum / levels.length / 255

    setAudioLevels(levels)
    setAverageLevel(avg)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    cleanup()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = BIN_COUNT * 2
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      setIsActive(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Mikrofonzugriff wurde verweigert.'
          : 'Mikrofon konnte nicht gestartet werden.'
      setError(message)
      cleanup()
    }
  }, [cleanup, tick])

  const stop = useCallback(() => {
    cleanup()
    setIsActive(false)
    setAudioLevels(new Array(BIN_COUNT).fill(0))
    setAverageLevel(0)
  }, [cleanup])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isActive,
    audioLevels,
    averageLevel,
    error,
    start,
    stop,
  }
}
