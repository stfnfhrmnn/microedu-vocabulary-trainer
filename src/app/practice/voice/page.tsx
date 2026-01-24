'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Moon, Zap, Mic, Volume2, AlertCircle } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAllSections } from '@/lib/db/hooks/useBooks'
import { useVocabularyWithProgress } from '@/lib/db/hooks/useVocabulary'
import { useDueWords } from '@/lib/db/hooks/useDueWords'
import { useVoiceSession } from '@/stores/voice-session'
import { useSettings } from '@/stores/settings'
import { isTTSAvailable } from '@/lib/services/text-to-speech'
import { isSpeechRecognitionAvailable } from '@/lib/services/speech-recognition'
import type { PracticeDirection } from '@/lib/db/schema'
import type { VoicePracticeMode } from '@/lib/services/voice-tutor'
import { cn } from '@/lib/utils/cn'

const directions: { id: PracticeDirection; label: string; description: string }[] = [
  {
    id: 'sourceToTarget',
    label: 'Deutsch \u2192 Fremdsprache',
    description: 'Ich sage Deutsch, du antwortest in der Fremdsprache',
  },
  {
    id: 'targetToSource',
    label: 'Fremdsprache \u2192 Deutsch',
    description: 'Ich sage die Fremdsprache, du antwortest auf Deutsch',
  },
  { id: 'mixed', label: 'Gemischt', description: 'Wechselt ab' },
]

export default function VoicePracticeSetupPage() {
  const router = useRouter()
  const { sections, isLoading: sectionsLoading } = useAllSections()
  const startSession = useVoiceSession((state) => state.startSession)
  const settings = useSettings()

  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [mode, setMode] = useState<VoicePracticeMode>('calm')
  const [direction, setDirection] = useState<PracticeDirection>(settings.defaultDirection)
  const [dueOnly, setDueOnly] = useState(false)

  // Check browser support
  const [ttsSupported, setTtsSupported] = useState(true)
  const [sttSupported, setSttSupported] = useState(true)

  useEffect(() => {
    setTtsSupported(isTTSAvailable())
    setSttSupported(isSpeechRecognitionAvailable())
  }, [])

  // Get vocabulary for selected sections
  const { vocabulary: allVocabulary, isLoading: vocabLoading } =
    useVocabularyWithProgress(selectedSectionIds)
  const { dueWords } = useDueWords(selectedSectionIds)

  const wordsToStudy = dueOnly ? dueWords : allVocabulary
  const wordCount = wordsToStudy.length

  // Auto-select all sections initially
  useEffect(() => {
    if (sections.length > 0 && selectedSectionIds.length === 0) {
      setSelectedSectionIds(sections.map((s) => s.id))
    }
  }, [sections, selectedSectionIds.length])

  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const selectAll = () => {
    setSelectedSectionIds(sections.map((s) => s.id))
  }

  const deselectAll = () => {
    setSelectedSectionIds([])
  }

  const handleStart = () => {
    if (wordCount === 0) return

    // Get target language and section names
    const selectedSections = sections.filter((s) => selectedSectionIds.includes(s.id))
    const targetLanguage = selectedSections[0]?.book?.language
    const sectionNames = selectedSections.map((s) => s.name)

    if (!targetLanguage) return

    startSession({
      mode,
      direction,
      sectionIds: selectedSectionIds,
      sectionNames,
      targetLanguage,
      items: wordsToStudy.map((v) => ({
        vocabulary: v,
        progress: v.progress,
      })),
    })

    router.push('/practice/voice/session')
  }

  const isLoading = sectionsLoading || vocabLoading
  const canStart = ttsSupported && sttSupported && wordCount > 0

  return (
    <PageContainer>
      <Header title="Sprachübung" showBack />

      {/* Browser support warning */}
      {(!ttsSupported || !sttSupported) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="bg-warning-50 border-warning-200">
            <CardContent className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning-800">Browser nicht vollständig unterstützt</p>
                <p className="text-sm text-warning-700 mt-1">
                  {!ttsSupported && 'Sprachausgabe wird nicht unterstützt. '}
                  {!sttSupported && 'Spracherkennung wird nicht unterstützt. '}
                  Bitte verwende Chrome oder Safari für die beste Erfahrung.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-3" />
                <div className="h-10 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">
              Füge zuerst Vokabeln hinzu um zu üben.
            </p>
            <Button variant="primary" onClick={() => router.push('/add')}>
              Vokabeln hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Mode Selection */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-3">Modus</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('calm')}
                  className={cn(
                    'p-4 rounded-xl text-center transition-all',
                    mode === 'calm'
                      ? 'bg-slate-800 text-white ring-2 ring-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  <Moon className={cn(
                    'w-8 h-8 mx-auto mb-2',
                    mode === 'calm' ? 'text-blue-300' : 'text-slate-500'
                  )} />
                  <span className="font-medium block">Ruhig</span>
                  <span className="text-xs opacity-70">Entspanntes Tempo</span>
                </button>
                <button
                  onClick={() => setMode('challenge')}
                  className={cn(
                    'p-4 rounded-xl text-center transition-all',
                    mode === 'challenge'
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white ring-2 ring-purple-400'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  )}
                >
                  <Zap className={cn(
                    'w-8 h-8 mx-auto mb-2',
                    mode === 'challenge' ? 'text-yellow-300' : 'text-purple-500'
                  )} />
                  <span className="font-medium block">Challenge</span>
                  <span className="text-xs opacity-70">Schnelles Tempo</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Section Selection */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Abschnitte</h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Alle
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Keine
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl transition-colors',
                      selectedSectionIds.includes(section.id)
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'bg-gray-50 border-2 border-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center',
                        selectedSectionIds.includes(section.id)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200'
                      )}
                    >
                      {selectedSectionIds.includes(section.id) && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{section.name}</p>
                      <p className="text-xs text-gray-500">
                        {section.book?.name} &rsaquo; {section.chapter?.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Direction */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-3">Richtung</h3>
              <div className="space-y-2">
                {directions.map((dir) => (
                  <button
                    key={dir.id}
                    onClick={() => setDirection(dir.id)}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-colors',
                      direction === dir.id
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'bg-gray-50 border-2 border-transparent'
                    )}
                  >
                    <p className="font-medium text-gray-900">{dir.label}</p>
                    <p className="text-xs text-gray-500">{dir.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Due Only Toggle */}
          <Card>
            <CardContent>
              <button
                onClick={() => setDueOnly(!dueOnly)}
                className="w-full flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">Nur fällige Vokabeln</p>
                  <p className="text-sm text-gray-500">
                    {dueOnly
                      ? `${dueWords.length} Vokabeln bereit zur Wiederholung`
                      : `${allVocabulary.length} Vokabeln insgesamt`}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-12 h-7 rounded-full transition-colors relative',
                    dueOnly ? 'bg-primary-500' : 'bg-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow',
                      dueOnly ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="flex items-start gap-3">
              <div className="flex gap-1 flex-shrink-0 mt-0.5">
                <Mic className="w-4 h-4 text-blue-600" />
                <Volume2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Tipps für die Sprachübung:</p>
                <ul className="mt-1 space-y-1 list-disc list-inside text-blue-700">
                  <li>Finde einen ruhigen Ort</li>
                  <li>Sprich deutlich und nicht zu schnell</li>
                  <li>Sage &quot;nochmal&quot; um zu wiederholen</li>
                  <li>Sage &quot;weiter&quot; um zu überspringen</li>
                  <li>Sage &quot;stop&quot; um zu beenden</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Word Count & Start */}
          <motion.div
            className={cn(
              'rounded-2xl p-4 text-center',
              mode === 'calm'
                ? 'bg-slate-800 text-white'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-4xl font-bold">{wordCount}</p>
            <p className={cn(
              'mb-4',
              mode === 'calm' ? 'text-slate-300' : 'text-purple-200'
            )}>
              {wordCount === 1 ? 'Vokabel' : 'Vokabeln'} zum Üben
            </p>
            <Button
              variant="secondary"
              fullWidth
              onClick={handleStart}
              disabled={!canStart}
            >
              {!canStart
                ? 'Nicht verfügbar'
                : wordCount === 0
                  ? 'Keine Vokabeln ausgewählt'
                  : mode === 'calm'
                    ? 'Ruhige Übung starten'
                    : 'Challenge starten'}
            </Button>
          </motion.div>
        </div>
      )}
    </PageContainer>
  )
}
