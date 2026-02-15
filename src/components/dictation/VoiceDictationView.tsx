'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Square } from 'lucide-react'
import { AudioWaveform } from './AudioWaveform'
import { useContinuousDictation } from '@/hooks/useContinuousDictation'
import { useAudioVisualization } from '@/hooks/useAudioVisualization'
import { Button } from '@/components/ui/Button'
import type { Language } from '@/lib/db/schema'
import type { DictationOrder } from '@/lib/services/voice-dictation-parser'
import type { VocabularyCandidate } from '@/lib/ocr/types'

interface VoiceDictationViewProps {
  foreignLanguage: Language
  order: DictationOrder
  onStop: (rawTranscript: string, rawPairs: VocabularyCandidate[]) => void
}

const LANGUAGE_LABELS: Record<Language, string> = {
  french: 'Französisch',
  spanish: 'Spanisch',
  latin: 'Latein',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VoiceDictationView({
  foreignLanguage,
  order,
  onStop,
}: VoiceDictationViewProps) {
  const [elapsed, setElapsed] = useState(0)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const {
    isListening,
    error: dictationError,
    segments,
    currentInterim,
    rawPairs,
    rawTranscript,
    startDictation,
    stopDictation,
  } = useContinuousDictation(order)

  const {
    isActive: audioActive,
    audioLevels,
    error: audioError,
    start: startAudio,
    stop: stopAudio,
  } = useAudioVisualization()

  // Start everything on mount
  useEffect(() => {
    const init = async () => {
      await startAudio()
      // Use German for recognition — foreign words will be recognized phonetically
      startDictation('german')
    }
    init()

    return () => {
      stopAudio()
      stopDictation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Elapsed timer
  useEffect(() => {
    if (!isListening) return
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isListening])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [segments, currentInterim])

  const handleStop = () => {
    stopDictation()
    stopAudio()
    onStop(rawTranscript, rawPairs)
  }

  const langLabel = LANGUAGE_LABELS[foreignLanguage] || foreignLanguage
  const directionLabel =
    order === 'foreignFirst'
      ? `${langLabel} \u2192 Deutsch`
      : `Deutsch \u2192 ${langLabel}`

  const error = dictationError || audioError

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Diktat</h2>
          <p className="text-xs text-gray-500">{directionLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-500">{formatTime(elapsed)}</span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStop}
            className="!bg-error-500 hover:!bg-error-600"
          >
            <Square className="w-4 h-4 mr-1.5 fill-current" />
            Stopp
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-error-50 border-b border-error-200">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {/* Waveform */}
      <div className="px-4 py-6 bg-gray-50 border-b border-gray-200">
        <AudioWaveform
          audioLevels={audioLevels}
          isActive={audioActive && isListening}
        />
        <p className="text-center text-xs text-gray-400 mt-2">
          {isListening ? 'Sprich jetzt...' : 'Wird gestartet...'}
        </p>
      </div>

      {/* Live transcript */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="space-y-2">
          {segments.length === 0 && !currentInterim && (
            <p className="text-sm text-gray-400 text-center py-4">
              Sprich deine Vokabeln: &quot;{order === 'foreignFirst' ? `${langLabel}-Wort` : 'Deutsch'}, {order === 'foreignFirst' ? 'Deutsch' : `${langLabel}-Wort`}, ...&quot;
            </p>
          )}

          {segments.map((segment, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-700"
            >
              <span className="text-gray-400 text-xs mr-2">{i + 1}.</span>
              {segment.text}
            </motion.div>
          ))}

          {currentInterim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="text-sm text-gray-400 italic"
            >
              {currentInterim}
            </motion.div>
          )}

          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Parsed pairs preview */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 pb-safe">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Erkannte Paare</span>
          <span className="text-xs font-bold text-primary-600">
            {rawPairs.length}
          </span>
        </div>

        {rawPairs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            <AnimatePresence>
              {rawPairs.map((pair, i) => (
                <motion.div
                  key={`${i}-${pair.targetText}-${pair.sourceText}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs"
                >
                  <span className="text-gray-700 font-medium">{pair.targetText}</span>
                  <span className="text-gray-400">=</span>
                  <span className="text-gray-600">{pair.sourceText}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
