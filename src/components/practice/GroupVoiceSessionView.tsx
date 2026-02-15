'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Volume2,
  Pause,
  Square,
  Users,
  Eye,
  Play,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useGroupVoiceSession } from '@/stores/group-voice-session'
import { useSettings } from '@/stores/settings'
import { useGoogleApiStatus } from '@/hooks/useGoogleApiStatus'
import { getUnifiedTTSService } from '@/lib/services/unified-tts'
import { getSpeechRecognitionService } from '@/lib/services/speech-recognition'
import { getGroupConversationService } from '@/lib/services/group-conversation'
import { toast } from '@/stores/toast'
import type { Language } from '@/lib/db/schema'

interface GroupVoiceSessionViewProps {
  onSessionComplete: () => void
}

type SessionPhase =
  | 'greeting'
  | 'asking'
  | 'waiting'
  | 'encouraging'
  | 'help_offer'
  | 'processing'
  | 'feedback'
  | 'next_question'
  | 'summary'

export function GroupVoiceSessionView({
  onSessionComplete,
}: GroupVoiceSessionViewProps) {
  const {
    status,
    players,
    spectators,
    targetLanguage,
    immersionLevel,
    timingMode,
    contentSource,
    conversationHistory,
    vocabularyPool,
    usedVocabularyIds,
    currentWord,
    currentSpeaker,
    currentExpectedAnswer,
    questionsAsked,
    difficultWords,
    lastTranscript,
    setStatus,
    setCurrentSpeaker,
    setLastTranscript,
    setCurrentQuestion,
    addConversationTurn,
    recordAnswer,
    markWordDifficult,
    getNextPlayer,
    endSession,
    pause,
    resume,
  } = useGroupVoiceSession()

  // Settings
  const {
    ttsProvider,
    ttsRate,
    ttsPitch,
    googleVoiceType,
    ttsLanguageOverride,
    sttLanguageOverride,
  } = useSettings()
  const { available: hasGoogleApi } = useGoogleApiStatus()

  // Services
  const ttsService = useRef(getUnifiedTTSService())
  const sttService = useRef(getSpeechRecognitionService())
  const conversationService = useRef(getGroupConversationService())

  // Local state
  const [phase, setPhase] = useState<SessionPhase>('greeting')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Timing refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const encouragementTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const helpOfferTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastLanguageWarningRef = useRef<string | null>(null)

  // Configure services
  useEffect(() => {
    ttsService.current.configure({
      provider: ttsProvider,
      googleEnabled: hasGoogleApi,
      googleVoiceType,
      ttsLanguageOverride,
    })
    conversationService.current.setEnabled(hasGoogleApi)
  }, [ttsProvider, hasGoogleApi, googleVoiceType, ttsLanguageOverride])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts()
      ttsService.current.stop()
      sttService.current.stop()
    }
  }, [])

  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (encouragementTimeoutRef.current)
      clearTimeout(encouragementTimeoutRef.current)
    if (helpOfferTimeoutRef.current) clearTimeout(helpOfferTimeoutRef.current)
  }, [])

  /**
   * Speak text using TTS
   */
  const speak = useCallback(
    async (text: string, language: Language | 'german' = 'german') => {
      setIsSpeaking(true)
      try {
        const effectiveRate = ttsRate * (timingMode === 'calm' ? 0.9 : 1.0)
        await ttsService.current.speak(text, language, {
          rate: effectiveRate,
          pitch: ttsPitch,
        })
      } catch (err) {
        console.error('TTS error:', err)
      } finally {
        setIsSpeaking(false)
      }
    },
    [ttsRate, ttsPitch, timingMode]
  )

  /**
   * Get timing values based on mode
   */
  const getTimings = useCallback(() => {
    if (timingMode === 'calm') {
      return {
        initialWait: 5000,
        encouragementDelay: 5000,
        helpOfferDelay: 6000,
        betweenQuestions: 2000,
      }
    }
    return {
      initialWait: 3000,
      encouragementDelay: 4000,
      helpOfferDelay: 4000,
      betweenQuestions: 1000,
    }
  }, [timingMode])

  /**
   * Start listening for speech
   */
  const startListening = useCallback(() => {
    setInterimTranscript('')
    setLastTranscript('')

    const listenLang =
      immersionLevel === 'beginner' ? 'german' : targetLanguage || 'german'
    const effectiveListenLang =
      sttLanguageOverride === 'auto' ? listenLang : sttLanguageOverride
    if (effectiveListenLang !== listenLang) {
      const warning = `Eingabe-Sprache überschrieben (${listenLang} → ${effectiveListenLang}).`
      if (lastLanguageWarningRef.current !== warning) {
        lastLanguageWarningRef.current = warning
        toast.info(warning, 3500)
      }
    }

    sttService.current.start(
      effectiveListenLang,
      (result) => {
        if (result.isFinal) {
          setLastTranscript(result.transcript)
          setInterimTranscript('')
        } else {
          setInterimTranscript(result.transcript)
        }
      },
      (error) => {
        console.error('STT error:', error)
      },
      { interimResults: true, continuous: true }
    )
  }, [immersionLevel, targetLanguage, sttLanguageOverride, setLastTranscript])

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    sttService.current.stop()
  }, [])

  /**
   * Build context for LLM
   */
  const buildContext = useCallback(() => {
    return {
      players,
      spectators,
      targetLanguage: targetLanguage!,
      immersionLevel,
      timingMode,
      contentSource: contentSource!,
      conversationHistory,
      currentWord: currentWord || undefined,
      currentSpeaker: currentSpeaker || undefined,
      questionsAsked,
      difficultWords,
    }
  }, [
    players,
    spectators,
    targetLanguage,
    immersionLevel,
    timingMode,
    contentSource,
    conversationHistory,
    currentWord,
    currentSpeaker,
    questionsAsked,
    difficultWords,
  ])

  /**
   * Get next vocabulary word
   */
  const getNextWord = useCallback(() => {
    const available = vocabularyPool.filter(
      (v) => !usedVocabularyIds.has(v.id)
    )
    if (available.length === 0) return null
    return available[Math.floor(Math.random() * available.length)]
  }, [vocabularyPool, usedVocabularyIds])

  /**
   * Run the greeting phase
   */
  const runGreeting = useCallback(async () => {
    try {
      const context = buildContext()
      const greeting = await conversationService.current.generateGreeting(
        context
      )

      addConversationTurn({ role: 'assistant', content: greeting })
      await speak(greeting, 'german')

      // Start listening and move to first question
      setPhase('next_question')
    } catch (err) {
      console.error('Greeting error:', err)
      setError('Fehler beim Starten der Session')
    }
  }, [buildContext, addConversationTurn, speak])

  /**
   * Ask the next question
   */
  const askNextQuestion = useCallback(async () => {
    const word = getNextWord()
    if (!word) {
      // No more words, end session
      setPhase('summary')
      return
    }

    const nextPlayer = getNextPlayer()
    if (!nextPlayer) {
      setError('Keine Spieler verfügbar')
      return
    }

    try {
      const context = buildContext()
      const question = await conversationService.current.generateQuestion(
        context,
        word,
        nextPlayer
      )

      // Update state
      setCurrentQuestion(word, question, word.targetText, nextPlayer)
      addConversationTurn({
        role: 'assistant',
        content: question,
        metadata: {
          questionTarget: nextPlayer,
          currentWord: word.sourceText,
          expectedAnswer: word.targetText,
        },
      })

      // Speak the question
      await speak(question, 'german')

      // Also speak the word in target language for clarity
      if (targetLanguage && immersionLevel !== 'full') {
        await new Promise((r) => setTimeout(r, 300))
        await speak(word.sourceText, 'german')
      }

      // Start listening and waiting
      setPhase('waiting')
      startListening()

      // Set up encouragement and help timeouts
      const timings = getTimings()

      encouragementTimeoutRef.current = setTimeout(() => {
        setPhase('encouraging')
      }, timings.encouragementDelay)

      helpOfferTimeoutRef.current = setTimeout(() => {
        setPhase('help_offer')
      }, timings.encouragementDelay + timings.helpOfferDelay)
    } catch (err) {
      console.error('Question error:', err)
      setError('Fehler beim Stellen der Frage')
    }
  }, [
    getNextWord,
    getNextPlayer,
    buildContext,
    setCurrentQuestion,
    addConversationTurn,
    speak,
    targetLanguage,
    immersionLevel,
    startListening,
    getTimings,
  ])

  /**
   * Generate and speak encouragement
   */
  const giveEncouragement = useCallback(async () => {
    if (!currentSpeaker) return

    try {
      const context = buildContext()
      const encouragement =
        await conversationService.current.generateEncouragement(
          context,
          currentSpeaker
        )

      addConversationTurn({ role: 'assistant', content: encouragement })
      await speak(encouragement, 'german')

      // Continue waiting
      setPhase('waiting')
    } catch (err) {
      console.error('Encouragement error:', err)
    }
  }, [currentSpeaker, buildContext, addConversationTurn, speak])

  /**
   * Offer help from others
   */
  const offerHelp = useCallback(async () => {
    if (!currentSpeaker) return

    try {
      const context = buildContext()
      const helpOffer = await conversationService.current.generateHelpOffer(
        context,
        currentSpeaker
      )

      addConversationTurn({ role: 'assistant', content: helpOffer })
      await speak(helpOffer, 'german')

      // Continue waiting for help or answer
      setPhase('waiting')

      // Final timeout - give answer if still no response
      timeoutRef.current = setTimeout(async () => {
        // Provide the answer
        if (currentExpectedAnswer && currentSpeaker && currentWord) {
          const answerText = `Die Antwort ist "${currentExpectedAnswer}".`
          addConversationTurn({ role: 'assistant', content: answerText })
          await speak(answerText, 'german')

          // Record as incorrect
          recordAnswer(currentSpeaker, false)
          markWordDifficult(
            currentWord.sourceText,
            currentWord.targetText,
            currentSpeaker
          )

          // Move to next question
          setPhase('next_question')
        }
      }, 5000)
    } catch (err) {
      console.error('Help offer error:', err)
    }
  }, [
    currentSpeaker,
    currentExpectedAnswer,
    currentWord,
    buildContext,
    addConversationTurn,
    speak,
    recordAnswer,
    markWordDifficult,
  ])

  /**
   * Process the user's answer
   */
  const processAnswer = useCallback(async () => {
    if (!lastTranscript || !currentExpectedAnswer || !currentSpeaker) return

    clearAllTimeouts()
    stopListening()
    setPhase('processing')

    try {
      const context = buildContext()
      const result = await conversationService.current.processAnswer(
        context,
        lastTranscript,
        currentExpectedAnswer,
        currentSpeaker
      )

      // Add user turn to history
      addConversationTurn({
        role: 'user',
        content: lastTranscript,
        speaker: result.helpedBy || currentSpeaker,
        metadata: {
          wasCorrect: result.isCorrect,
          helpedBy: result.helpedBy,
        },
      })

      // Handle different intents
      if (result.detectedIntent === 'stop') {
        addConversationTurn({ role: 'assistant', content: result.response })
        await speak(result.response, 'german')
        setPhase('summary')
        return
      }

      if (result.detectedIntent === 'repeat') {
        addConversationTurn({ role: 'assistant', content: result.response })
        await speak(result.response, 'german')
        // Re-ask current question
        if (currentWord) {
          await speak(currentWord.sourceText, 'german')
        }
        setPhase('waiting')
        startListening()
        return
      }

      if (result.detectedIntent === 'help_request') {
        addConversationTurn({ role: 'assistant', content: result.response })
        await speak(result.response, 'german')
        setPhase('waiting')
        startListening()
        return
      }

      // It's an answer (correct or incorrect)
      addConversationTurn({ role: 'assistant', content: result.response })
      await speak(result.response, 'german')

      // Record the answer
      recordAnswer(currentSpeaker, result.isCorrect, result.helpedBy)

      // Mark difficult if incorrect
      if (!result.isCorrect && currentWord) {
        markWordDifficult(
          currentWord.sourceText,
          currentWord.targetText,
          currentSpeaker
        )
      }

      // Move to next question after delay
      const timings = getTimings()
      await new Promise((r) => setTimeout(r, timings.betweenQuestions))
      setPhase('next_question')
    } catch (err) {
      console.error('Process answer error:', err)
      setError('Fehler bei der Verarbeitung')
      setPhase('waiting')
      startListening()
    }
  }, [
    lastTranscript,
    currentExpectedAnswer,
    currentSpeaker,
    currentWord,
    clearAllTimeouts,
    stopListening,
    buildContext,
    addConversationTurn,
    speak,
    recordAnswer,
    markWordDifficult,
    getTimings,
    startListening,
  ])

  /**
   * Generate and speak summary
   */
  const runSummary = useCallback(async () => {
    clearAllTimeouts()
    stopListening()

    try {
      const context = buildContext()
      const summary = await conversationService.current.generateSummary(context)

      addConversationTurn({ role: 'assistant', content: summary })
      await speak(summary, 'german')

      // End session
      endSession()
      setTimeout(() => {
        onSessionComplete()
      }, 2000)
    } catch (err) {
      console.error('Summary error:', err)
      setError('Fehler bei der Zusammenfassung')
      endSession()
      onSessionComplete()
    }
  }, [
    clearAllTimeouts,
    stopListening,
    buildContext,
    addConversationTurn,
    speak,
    endSession,
    onSessionComplete,
  ])

  /**
   * Main phase effect
   */
  useEffect(() => {
    if (status !== 'active' && status !== 'waiting' && status !== 'processing')
      return

    switch (phase) {
      case 'greeting':
        runGreeting()
        break
      case 'next_question':
        askNextQuestion()
        break
      case 'encouraging':
        giveEncouragement()
        break
      case 'help_offer':
        offerHelp()
        break
      case 'summary':
        runSummary()
        break
    }
  }, [
    phase,
    status,
    runGreeting,
    askNextQuestion,
    giveEncouragement,
    offerHelp,
    runSummary,
  ])

  /**
   * Handle transcript changes
   */
  useEffect(() => {
    if (phase === 'waiting' && lastTranscript && lastTranscript.length > 2) {
      // Debounce slightly to allow for complete utterances
      const timer = setTimeout(() => {
        processAnswer()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [lastTranscript, phase, processAnswer])

  /**
   * Handle tap to pause/resume
   */
  const handleTap = () => {
    if (status === 'paused') {
      resume()
      setPhase('waiting')
      startListening()
    } else if (status === 'active' || status === 'waiting') {
      clearAllTimeouts()
      stopListening()
      ttsService.current.stop()
      pause()
    }
  }

  /**
   * Handle stop button
   */
  const handleStop = () => {
    clearAllTimeouts()
    stopListening()
    ttsService.current.stop()
    setPhase('summary')
  }

  // Calculate stats
  const totalCorrect = players.reduce((sum, p) => sum + p.correctAnswers, 0)
  const totalAnswered = players.reduce((sum, p) => sum + p.questionsAnswered, 0)

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center p-6 transition-colors',
        'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800'
      )}
      onClick={handleTap}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Stop button */}
        <button
          className="p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleStop()
          }}
        >
          <Square className="w-5 h-5" />
        </button>

        {/* Participants */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Users className="w-4 h-4" />
            <span>{players.length} Spieler</span>
          </div>
          {spectators.length > 0 && (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Eye className="w-4 h-4" />
              <span>{spectators.length} Zuschauer</span>
            </div>
          )}
        </div>
      </div>

      {/* Players display */}
      <div className="flex flex-wrap justify-center gap-4 mb-8 mt-16">
        {players.map((player) => (
          <motion.div
            key={player.id}
            className={cn(
              'px-4 py-2 rounded-full border-2 transition-colors',
              player.name === currentSpeaker
                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                : 'border-white/30 bg-white/10 text-white/70'
            )}
            animate={
              player.name === currentSpeaker ? { scale: [1, 1.05, 1] } : {}
            }
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="font-medium">{player.name}</span>
            <span className="ml-2 text-sm opacity-70">
              {player.correctAnswers}/{player.questionsAnswered}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Main status indicator */}
      <div className="relative mb-8">
        <motion.div
          className={cn(
            'w-32 h-32 rounded-full flex items-center justify-center',
            'border-4 transition-colors',
            phase === 'waiting' && 'border-red-500 bg-red-500/10',
            (phase === 'asking' || phase === 'greeting') &&
              'border-blue-500 bg-blue-500/10',
            phase === 'processing' && 'border-yellow-500 bg-yellow-500/10',
            phase === 'feedback' && 'border-green-500 bg-green-500/10',
            phase === 'summary' && 'border-purple-500 bg-purple-500/10',
            status === 'paused' && 'border-gray-500 bg-gray-500/10'
          )}
          animate={
            phase === 'waiting'
              ? { scale: [1, 1.05, 1], borderWidth: ['4px', '6px', '4px'] }
              : {}
          }
          transition={
            phase === 'waiting'
              ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
              : {}
          }
        >
          <AnimatePresence mode="wait">
            {phase === 'waiting' && status !== 'paused' && (
              <motion.div
                key="mic"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Mic className="w-14 h-14 text-red-500" />
              </motion.div>
            )}
            {(phase === 'asking' ||
              phase === 'greeting' ||
              phase === 'encouraging' ||
              phase === 'help_offer' ||
              isSpeaking) &&
              status !== 'paused' && (
                <motion.div
                  key="speaker"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Volume2 className="w-14 h-14 text-blue-500 animate-pulse" />
                </motion.div>
              )}
            {phase === 'processing' && status !== 'paused' && (
              <motion.div
                key="processing"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{
                  rotate: { repeat: Infinity, duration: 1, ease: 'linear' },
                }}
                exit={{ scale: 0 }}
                className="w-14 h-14 border-4 border-yellow-500 border-t-transparent rounded-full"
              />
            )}
            {phase === 'summary' && status !== 'paused' && (
              <motion.div
                key="summary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Sparkles className="w-14 h-14 text-purple-400" />
              </motion.div>
            )}
            {status === 'paused' && (
              <motion.div
                key="paused"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Pause className="w-14 h-14 text-gray-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Current speaker indicator */}
      {currentSpeaker && phase === 'waiting' && status !== 'paused' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-yellow-300 text-lg mb-4"
        >
          {currentSpeaker}, du bist dran!
        </motion.div>
      )}

      {/* Status text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-white/60 text-lg mb-4"
      >
        {status === 'paused' && 'Pausiert - tippe zum Fortfahren'}
        {phase === 'waiting' && status !== 'paused' && 'Ich höre zu...'}
        {phase === 'processing' && 'Einen Moment...'}
        {phase === 'greeting' && 'Willkommen!'}
        {phase === 'summary' && 'Zusammenfassung'}
        {(phase === 'encouraging' || phase === 'help_offer') && 'Ich spreche...'}
      </motion.div>

      {/* Interim transcript */}
      <AnimatePresence>
        {(interimTranscript ||
          (phase === 'processing' && lastTranscript)) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-white/80 text-lg italic max-w-md text-center px-4"
          >
            &quot;{interimTranscript || lastTranscript}&quot;
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress stats */}
      <div className="absolute bottom-20 text-white/50 text-sm">
        {totalAnswered > 0 && (
          <span>
            {totalCorrect}/{totalAnswered} richtig
            {difficultWords.length > 0 &&
              ` | ${difficultWords.length} schwierige Wörter`}
          </span>
        )}
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm"
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
      <div className="absolute bottom-8 text-white/30 text-sm">
        {status === 'paused'
          ? 'Tippe zum Fortfahren'
          : 'Tippe zum Pausieren'}
      </div>
    </div>
  )
}
