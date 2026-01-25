'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Volume2, Pause, Square, Moon, Zap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useVoiceSession, useVoiceSessionProgress } from '@/stores/voice-session'
import { useSettings } from '@/stores/settings'
import { getUnifiedTTSService } from '@/lib/services/unified-tts'
import { getSpeechRecognitionService } from '@/lib/services/speech-recognition'
import { getVoiceAnalyzerService } from '@/lib/services/voice-analyzer'
import { extractAnswer } from '@/lib/learning/answer-extractor'
import { combinedMatch } from '@/lib/learning/phonetic-match'
import {
  generateIntroScript,
  generateQuestionScript,
  generateFeedbackScript,
  generateDontKnowScript,
  generateTimeoutScript,
  generateRepeatScript,
  generateSkipScript,
  generateSummaryScript,
  generateStopScript,
  getListeningTimeout,
  getQuestionPause,
  getFeedbackPause,
  getTTSRate,
} from '@/lib/services/voice-tutor'
import type { QualityRating } from '@/lib/db/schema'

interface VoiceSessionViewProps {
  onSessionComplete: () => void
}

export function VoiceSessionView({ onSessionComplete }: VoiceSessionViewProps) {
  const {
    mode,
    status,
    items,
    currentIndex,
    direction,
    targetLanguage,
    sectionNames,
    currentQuestion,
    currentAnswer,
    currentQuestionLanguage,
    currentAnswerLanguage,
    currentStreak,
    maxStreak,
    lastTranscript,
    setStatus,
    setLastTranscript,
    setListeningStartTime,
    recordAnswer,
    nextItem,
    pause,
    resume,
    stop,
  } = useVoiceSession()

  const progress = useVoiceSessionProgress()

  // Get settings for TTS and AI analysis
  const { ttsProvider, googleApiKey, useAIAnalysis, ttsRate, ttsPitch, googleVoiceType } = useSettings()
  const [error, setError] = useState<string | null>(null)

  // Services
  const ttsService = useRef(getUnifiedTTSService())
  const sttService = useRef(getSpeechRecognitionService())
  const analyzerService = useRef(getVoiceAnalyzerService())
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [usingAI, setUsingAI] = useState(false)

  // Configure services on mount and when settings change
  useEffect(() => {
    ttsService.current.configure({
      provider: ttsProvider,
      googleApiKey,
      googleVoiceType,
    })
    analyzerService.current.setApiKey(googleApiKey)
    analyzerService.current.setUseAI(useAIAnalysis)
    setUsingAI(useAIAnalysis && !!googleApiKey)
  }, [ttsProvider, googleApiKey, useAIAnalysis, googleVoiceType])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      ttsService.current.stop()
      sttService.current.stop()
    }
  }, [])

  /**
   * Speak text and wait for completion
   */
  const speak = useCallback(
    async (text: string, language: 'german' | 'french' | 'spanish' | 'latin' = 'german') => {
      // Combine mode-based rate with user settings
      const modeRate = getTTSRate(mode)
      const effectiveRate = modeRate * ttsRate
      try {
        const result = await ttsService.current.speak(text, language, {
          rate: effectiveRate,
          pitch: ttsPitch,
        })
        if (!result.success) {
          console.warn('TTS failed:', result.error)
          // Don't throw - let the session continue without speech
        }
      } catch (err) {
        console.error('TTS error:', err)
        // Don't throw - let the session continue without speech
      }
    },
    [mode, ttsRate, ttsPitch]
  )

  /**
   * Process answer using AI analyzer when available
   */
  const analyzeWithAI = useCallback(
    async (transcript: string) => {
      if (!analyzerService.current.isAvailable()) {
        return null
      }

      try {
        const result = await analyzerService.current.analyze(
          transcript,
          currentAnswer,
          currentQuestion,
          currentQuestionLanguage,
          currentAnswerLanguage
        )
        return result
      } catch (error) {
        console.error('AI analysis failed:', error)
        return null
      }
    },
    [currentAnswer, currentQuestion, currentQuestionLanguage, currentAnswerLanguage]
  )

  /**
   * Start listening for speech
   */
  const startListening = useCallback(() => {
    setInterimTranscript('')
    setLastTranscript('')
    setListeningStartTime(Date.now())

    const answerLang = currentAnswerLanguage === 'german' ? 'german' : currentAnswerLanguage

    sttService.current.start(
      answerLang,
      (result) => {
        if (result.isFinal) {
          setLastTranscript(result.transcript)
          setInterimTranscript('')
        } else {
          setInterimTranscript(result.transcript)
        }
      },
      (error) => {
        console.error('Speech recognition error:', error)
        // On error, treat as timeout
        setStatus('processing')
      },
      { interimResults: true, continuous: false }
    )

    // Set timeout for no response
    const timeout = getListeningTimeout(mode)
    timeoutRef.current = setTimeout(() => {
      sttService.current.stop()
      setStatus('processing')
    }, timeout)
  }, [mode, currentAnswerLanguage, setLastTranscript, setListeningStartTime, setStatus])

  /**
   * Process the user's answer
   */
  const processAnswer = useCallback(
    async (transcript: string) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Try AI analysis first if available
      const aiResult = await analyzeWithAI(transcript)

      if (aiResult) {
        // Use AI analysis result
        const { intent, extractedAnswer, isCorrect, confidence, suggestedFeedback } = aiResult

        // Handle intents
        if (intent === 'repeat') {
          const script = generateRepeatScript(currentQuestion, mode)
          await speak(script, 'german')
          await new Promise((r) => setTimeout(r, getQuestionPause(mode)))
          setStatus('asking')
          return
        }
        if (intent === 'skip') {
          const script = generateSkipScript(currentAnswer, mode)
          await speak(script, 'german')
          recordAnswer(false, 1 as QualityRating, transcript, '')
          await new Promise((r) => setTimeout(r, getFeedbackPause(mode)))
          if (!nextItem()) {
            setStatus('summary')
          } else {
            setStatus('asking')
          }
          return
        }
        if (intent === 'stop') {
          sttService.current.stop()
          const correctCount = items.filter((i) => i.correct).length
          const script = generateStopScript(mode, currentIndex, correctCount)
          await speak(script, 'german')
          stop()
          onSessionComplete()
          return
        }
        if (intent === 'hint') {
          const hint = items[currentIndex]?.vocabulary.notes
          const script = hint
            ? `Hinweis: ${hint}`
            : `Es fängt mit "${currentAnswer.charAt(0).toUpperCase()}" an.`
          await speak(script, 'german')
          await new Promise((r) => setTimeout(r, 500))
          setStatus('asking')
          return
        }
        if (intent === 'dont_know') {
          const script = generateDontKnowScript(currentAnswer, mode)
          await speak(script, 'german')
          recordAnswer(false, 1 as QualityRating, transcript, '')
          await new Promise((r) => setTimeout(r, getFeedbackPause(mode)))
          setStatus('feedback')
          return
        }

        // It's an answer - use AI's evaluation
        const qualityRating: QualityRating = isCorrect
          ? confidence >= 0.95 ? 5 : confidence >= 0.8 ? 4 : 3
          : confidence >= 0.5 ? 2 : 1

        recordAnswer(isCorrect, qualityRating, transcript, extractedAnswer)

        // Use AI's suggested feedback if available, otherwise generate
        const feedbackScript = suggestedFeedback || generateFeedbackScript({
          mode,
          wasCorrect: isCorrect,
          expectedAnswer: currentAnswer,
          userAnswer: extractedAnswer,
          currentStreak: isCorrect ? currentStreak + 1 : 0,
          questionNumber: currentIndex,
          totalQuestions: items.length,
          isLastQuestion: currentIndex === items.length - 1,
        })

        await speak(feedbackScript, 'german')
        setStatus('feedback')
        return
      }

      // Fallback to rule-based extraction
      const extraction = extractAnswer(
        transcript,
        currentAnswer,
        currentAnswerLanguage,
        currentQuestionLanguage
      )

      // Handle commands
      if (extraction.type === 'command') {
        if (extraction.command === 'repeat') {
          const script = generateRepeatScript(currentQuestion, mode)
          await speak(script, 'german')
          await new Promise((r) => setTimeout(r, getQuestionPause(mode)))
          setStatus('asking')
          return
        }
        if (extraction.command === 'skip') {
          const script = generateSkipScript(currentAnswer, mode)
          await speak(script, 'german')
          // Record as incorrect with skip quality
          recordAnswer(false, 1 as QualityRating, transcript, '')
          await new Promise((r) => setTimeout(r, getFeedbackPause(mode)))
          if (!nextItem()) {
            setStatus('summary')
          } else {
            setStatus('asking')
          }
          return
        }
        if (extraction.command === 'stop') {
          sttService.current.stop()
          const correctCount = items.filter((i) => i.correct).length
          const script = generateStopScript(mode, currentIndex, correctCount)
          await speak(script, 'german')
          stop()
          onSessionComplete()
          return
        }
        if (extraction.command === 'hint') {
          const hint = items[currentIndex]?.vocabulary.notes
          const script = hint
            ? `Hinweis: ${hint}`
            : `Es fängt mit "${currentAnswer.charAt(0).toUpperCase()}" an.`
          await speak(script, 'german')
          await new Promise((r) => setTimeout(r, 500))
          setStatus('asking')
          return
        }
      }

      // Handle "don't know"
      if (extraction.type === 'dont_know') {
        const script = generateDontKnowScript(currentAnswer, mode)
        await speak(script, 'german')
        recordAnswer(false, 1 as QualityRating, transcript, '')
        await new Promise((r) => setTimeout(r, getFeedbackPause(mode)))
        setStatus('feedback')
        return
      }

      // Handle empty/timeout
      if (extraction.type === 'empty' || extraction.type === 'unclear') {
        const script = generateTimeoutScript(currentAnswer, mode)
        await speak(script, 'german')
        recordAnswer(false, 1 as QualityRating, transcript, '')
        await new Promise((r) => setTimeout(r, getFeedbackPause(mode)))
        setStatus('feedback')
        return
      }

      // Check if the answer is correct using combined matching
      const matchResult = combinedMatch(
        extraction.value,
        currentAnswer,
        currentAnswerLanguage
      )

      const isCorrect = matchResult.isMatch
      const qualityRating: QualityRating = isCorrect
        ? matchResult.confidence >= 0.95
          ? 5
          : matchResult.confidence >= 0.8
            ? 4
            : 3
        : matchResult.confidence >= 0.5
          ? 2
          : 1

      recordAnswer(isCorrect, qualityRating, transcript, extraction.value)

      // Generate and speak feedback
      const feedbackScript = generateFeedbackScript({
        mode,
        wasCorrect: isCorrect,
        expectedAnswer: currentAnswer,
        userAnswer: extraction.value,
        currentStreak: isCorrect ? currentStreak + 1 : 0,
        questionNumber: currentIndex,
        totalQuestions: items.length,
        isLastQuestion: currentIndex === items.length - 1,
      })

      await speak(feedbackScript, 'german')
      setStatus('feedback')
    },
    [
      mode,
      currentQuestion,
      currentAnswer,
      currentQuestionLanguage,
      currentAnswerLanguage,
      currentStreak,
      currentIndex,
      items,
      speak,
      setStatus,
      recordAnswer,
      nextItem,
      stop,
      onSessionComplete,
      analyzeWithAI,
    ]
  )

  /**
   * Session state machine
   */
  useEffect(() => {
    const runStateMachine = async () => {
      try {
        switch (status) {
          case 'intro': {
            // Generate and speak intro
            const introScript = generateIntroScript({
              mode,
              totalItems: items.length,
              direction,
              targetLanguage: targetLanguage!,
              sectionNames,
            })
            await speak(introScript, 'german')
            await new Promise((r) => setTimeout(r, getQuestionPause(mode)))
            setStatus('asking')
            break
          }

        case 'asking': {
          // Speak the question - the script is always in German, even if it
          // contains a foreign word (e.g., "Wie heißt 'le chien' auf Deutsch?")
          const questionScript = generateQuestionScript(currentQuestion, {
            mode,
            questionNumber: currentIndex,
            totalQuestions: items.length,
            currentStreak,
            direction,
            targetLanguage: targetLanguage!,
          })
          // Always speak in German - the script is German text
          await speak(questionScript, 'german')
          // Then speak just the foreign word in its proper language for clarity
          if (currentQuestionLanguage !== 'german') {
            await new Promise((r) => setTimeout(r, 200))
            await speak(currentQuestion, currentQuestionLanguage)
          }
          await new Promise((r) => setTimeout(r, 300))
          setStatus('listening')
          break
        }

        case 'listening': {
          startListening()
          break
        }

        case 'processing': {
          sttService.current.stop()
          await processAnswer(lastTranscript)
          break
        }

        case 'feedback': {
          await new Promise((r) => setTimeout(r, getFeedbackPause(mode)))
          if (!nextItem()) {
            setStatus('summary')
          } else {
            setStatus('asking')
          }
          break
        }

        case 'summary': {
          const correctCount = items.filter((i) => i.correct).length
          const summaryScript = generateSummaryScript({
            mode,
            correctCount,
            totalCount: items.length,
            maxStreak,
          })
          await speak(summaryScript, 'german')
          await new Promise((r) => setTimeout(r, 1000))
          onSessionComplete()
          break
        }
        }
      } catch (err) {
        console.error('Voice session error:', err)
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
        // Try to recover by moving to next state
        if (status === 'intro' || status === 'asking') {
          setStatus('listening')
        } else if (status === 'processing') {
          setStatus('feedback')
        }
      }
    }

    if (status !== 'idle' && status !== 'paused' && status !== 'stopped') {
      runStateMachine()
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle transcript changes during listening
  useEffect(() => {
    if (status === 'listening' && lastTranscript) {
      // User has finished speaking, process the answer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      sttService.current.stop()
      setStatus('processing')
    }
  }, [lastTranscript, status, setStatus])

  // Handle tap to pause/resume
  const handleTap = () => {
    if (status === 'paused') {
      resume()
    } else if (status !== 'idle' && status !== 'stopped' && status !== 'summary') {
      ttsService.current.stop()
      sttService.current.stop()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      pause()
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center p-8 transition-colors',
        mode === 'calm' ? 'bg-slate-900' : 'bg-gradient-to-br from-purple-900 to-indigo-900'
      )}
      onClick={handleTap}
    >
      {/* Mode indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl mb-8"
      >
        {mode === 'calm' ? (
          <Moon className="w-12 h-12 text-blue-300" />
        ) : (
          <Zap className="w-12 h-12 text-yellow-400" />
        )}
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-slate-400 mb-4 text-lg"
      >
        {status === 'summary'
          ? 'Fertig!'
          : status === 'paused'
            ? 'Pausiert'
            : `Frage ${progress.current} von ${progress.total}`}
      </motion.div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-12 flex-wrap justify-center max-w-xs">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className={cn(
              'w-3 h-3 rounded-full transition-colors',
              item.answered
                ? item.correct
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : i === currentIndex
                  ? 'bg-white'
                  : 'bg-slate-700'
            )}
          />
        ))}
      </div>

      {/* Status indicator */}
      <div className="relative mb-8">
        <motion.div
          className={cn(
            'w-36 h-36 rounded-full flex items-center justify-center',
            'border-4 transition-colors',
            status === 'listening' && 'border-red-500 bg-red-500/10',
            status === 'asking' && 'border-blue-500 bg-blue-500/10',
            status === 'processing' && 'border-yellow-500 bg-yellow-500/10',
            status === 'feedback' && 'border-green-500 bg-green-500/10',
            status === 'paused' && 'border-slate-500 bg-slate-500/10',
            (status === 'intro' || status === 'summary') && 'border-purple-500 bg-purple-500/10'
          )}
          animate={
            status === 'listening'
              ? { scale: [1, 1.05, 1], borderWidth: ['4px', '6px', '4px'] }
              : { scale: 1, borderWidth: '4px' }
          }
          transition={
            status === 'listening'
              ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
              : {}
          }
        >
          <AnimatePresence mode="wait">
            {status === 'listening' && (
              <motion.div
                key="mic"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Mic className="w-16 h-16 text-red-500" />
              </motion.div>
            )}
            {(status === 'asking' || status === 'intro' || status === 'summary') && (
              <motion.div
                key="speaker"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Volume2 className="w-16 h-16 text-blue-500 animate-pulse" />
              </motion.div>
            )}
            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ rotate: { repeat: Infinity, duration: 1, ease: 'linear' } }}
                exit={{ scale: 0 }}
                className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full"
              />
            )}
            {status === 'feedback' && (
              <motion.div
                key="feedback"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-4xl"
              >
                {items[currentIndex]?.correct ? '✓' : '✗'}
              </motion.div>
            )}
            {status === 'paused' && (
              <motion.div
                key="paused"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Pause className="w-16 h-16 text-slate-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Status text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-slate-400 text-lg mb-4"
      >
        {status === 'listening' && 'Ich höre zu...'}
        {status === 'asking' && 'Ich spreche...'}
        {status === 'processing' && 'Einen Moment...'}
        {status === 'paused' && 'Tippe zum Fortfahren'}
        {status === 'intro' && 'Los geht\'s!'}
        {status === 'summary' && 'Zusammenfassung'}
      </motion.div>

      {/* Interim transcript (what the user is saying) */}
      <AnimatePresence>
        {(interimTranscript || (status === 'processing' && lastTranscript)) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-slate-300 text-lg italic max-w-xs text-center"
          >
            "{interimTranscript || lastTranscript}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak indicator */}
      <AnimatePresence>
        {currentStreak >= 3 && status !== 'summary' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-8 right-8 text-orange-400 text-xl font-bold"
          >
            🔥 {currentStreak}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI indicator */}
      {usingAI && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-8 right-8 mt-12 flex items-center gap-1 text-purple-400 text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI</span>
        </motion.div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm"
            onClick={(e) => {
              e.stopPropagation()
              setError(null)
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="absolute bottom-8 text-slate-600 text-sm"
      >
        {status === 'paused' ? 'Tippe zum Fortfahren' : 'Tippe zum Pausieren'}
      </motion.div>

      {/* Stop button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-8 left-8 p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          ttsService.current.stop()
          sttService.current.stop()
          stop()
          onSessionComplete()
        }}
      >
        <Square className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
