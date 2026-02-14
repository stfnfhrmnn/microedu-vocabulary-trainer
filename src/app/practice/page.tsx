'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Bookmark, Plus, X, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'
import { useAllSections } from '@/lib/db/hooks/useBooks'
import { useVocabularyWithProgress } from '@/lib/db/hooks/useVocabulary'
import { useDueWords } from '@/lib/db/hooks/useDueWords'
import { usePracticeSession } from '@/stores/practice-session'
import { useSettings, type PracticePreset } from '@/stores/settings'
import type { ExerciseType, PracticeDirection } from '@/lib/db/schema'

const exerciseTypes: { id: ExerciseType; label: string; icon: string; short: string }[] = [
  { id: 'flashcard', label: 'Karteikarten', icon: '🎴', short: 'Karten' },
  { id: 'multipleChoice', label: 'Multiple Choice', icon: '🔘', short: 'MC' },
  { id: 'typed', label: 'Eingabe', icon: '⌨️', short: 'Tippen' },
]

const directions: { id: PracticeDirection; label: string; short: string }[] = [
  { id: 'sourceToTarget', label: 'DE → Fremdsprache', short: 'DE→FS' },
  { id: 'targetToSource', label: 'Fremdsprache → DE', short: 'FS→DE' },
  { id: 'mixed', label: 'Gemischt', short: 'Mix' },
]

const validExerciseTypes: ExerciseType[] = ['flashcard', 'multipleChoice', 'typed']

export default function PracticePage() {
  const router = useRouter()
  const { sections, isLoading: sectionsLoading } = useAllSections()
  const startSession = usePracticeSession((state) => state.startSession)
  const {
    defaultExerciseType,
    defaultDirection,
    lastPracticeConfig,
    practicePresets,
    setLastPracticeConfig,
    addPracticePreset,
    removePracticePreset,
  } = useSettings()

  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [exerciseType, setExerciseType] = useState<ExerciseType>(defaultExerciseType)
  const [direction, setDirection] = useState<PracticeDirection>(defaultDirection)
  const [dueOnly, setDueOnly] = useState(true)
  const [sectionsExpanded, setSectionsExpanded] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [shouldAutoStart, setShouldAutoStart] = useState(false)
  const hasAppliedEntryConfig = useRef(false)
  const hasAutoStarted = useRef(false)

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

  const applyPracticeConfig = useCallback((config: {
    exerciseType: ExerciseType
    direction: PracticeDirection
    dueOnly: boolean
    sectionIds: string[]
  }) => {
    setExerciseType(config.exerciseType)
    setDirection(config.direction)
    setDueOnly(config.dueOnly)

    const validSectionIds = config.sectionIds.filter((id) => sections.some((s) => s.id === id))
    if (validSectionIds.length > 0) {
      setSelectedSectionIds(validSectionIds)
    }
  }, [sections])

  // Support explicit entry modes from dashboard and summary links.
  // Apply once per page open so user interaction is never overwritten.
  useEffect(() => {
    if (hasAppliedEntryConfig.current || sections.length === 0) return
    hasAppliedEntryConfig.current = true

    const params = new URLSearchParams(window.location.search)
    const mode = params.get('mode')
    const requestedExerciseType = params.get('exerciseType')
    const shouldResume = params.get('resume') === '1'

    if (lastPracticeConfig) {
      applyPracticeConfig(lastPracticeConfig)
    }

    if (mode === 'free') {
      setDueOnly(false)
      setSectionsExpanded(true)
      setSettingsExpanded(true)
    }

    if (
      requestedExerciseType &&
      validExerciseTypes.includes(requestedExerciseType as ExerciseType)
    ) {
      setExerciseType(requestedExerciseType as ExerciseType)
      setSettingsExpanded(true)
    }

    if (shouldResume) {
      setShouldAutoStart(true)
      setSectionsExpanded(true)
      setSettingsExpanded(true)
    }
  }, [sections.length, lastPracticeConfig, applyPracticeConfig])

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

  const handleStart = useCallback(() => {
    if (wordCount === 0) return

    // Save this configuration for quick start
    setLastPracticeConfig({
      exerciseType,
      direction,
      dueOnly,
      sectionIds: selectedSectionIds,
    })

    // Get target language from the first selected section's book
    const selectedSection = sections.find((s) => selectedSectionIds.includes(s.id))
    const targetLanguage = selectedSection?.book?.language

    startSession({
      exerciseType,
      direction,
      sectionIds: selectedSectionIds,
      targetLanguage,
      items: wordsToStudy.map((v) => ({
        vocabulary: v,
        progress: v.progress,
      })),
    })

    router.push('/practice/session')
  }, [
    wordCount,
    exerciseType,
    direction,
    dueOnly,
    selectedSectionIds,
    sections,
    setLastPracticeConfig,
    startSession,
    wordsToStudy,
    router,
  ])

  // Resume flow from summary:
  // if no due words remain, automatically continue with all words.
  useEffect(() => {
    if (!shouldAutoStart || hasAutoStarted.current || sectionsLoading || vocabLoading) return
    if (selectedSectionIds.length === 0) return

    if (wordCount === 0) {
      if (dueOnly && allVocabulary.length > 0) {
        setDueOnly(false)
        return
      }
      setShouldAutoStart(false)
      return
    }

    hasAutoStarted.current = true
    handleStart()
  }, [
    shouldAutoStart,
    sectionsLoading,
    vocabLoading,
    selectedSectionIds.length,
    wordCount,
    dueOnly,
    allVocabulary.length,
    handleStart,
  ])

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    const preset: PracticePreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      exerciseType,
      direction,
      dueOnly,
      sectionIds: selectedSectionIds.length === sections.length ? 'all' : selectedSectionIds,
    }

    addPracticePreset(preset)
    setPresetName('')
    setShowSavePreset(false)
  }

  const handleLoadPreset = (preset: PracticePreset) => {
    if (preset.sectionIds === 'all') {
      applyPracticeConfig({
        exerciseType: preset.exerciseType,
        direction: preset.direction,
        dueOnly: preset.dueOnly,
        sectionIds: sections.map((s) => s.id),
      })
      return
    }

    applyPracticeConfig({
      exerciseType: preset.exerciseType,
      direction: preset.direction,
      dueOnly: preset.dueOnly,
      sectionIds: preset.sectionIds,
    })
  }

  // Get current settings summary for collapsed view
  const currentExercise = exerciseTypes.find(e => e.id === exerciseType)
  const currentDirection = directions.find(d => d.id === direction)
  const settingsSummary = `${currentExercise?.short} · ${currentDirection?.short} · ${dueOnly ? 'Fällige' : 'Alle'}`

  const isLoading = sectionsLoading || vocabLoading

  return (
    <PageContainer>
      <Header title="Übung einrichten" showBack />

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
        <>
          {/* Scrollable content with extra bottom padding for fixed footer */}
          <div className="space-y-4 pb-32">
            {/* Section Selection - Collapsible */}
            <Card>
              <CardContent className="p-0">
                <button
                  onClick={() => setSectionsExpanded(!sectionsExpanded)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">Abschnitte</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {selectedSectionIds.length} von {sections.length}
                    </span>
                  </div>
                  {sectionsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <AnimatePresence>
                  {sectionsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="flex justify-end gap-2 py-2">
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
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {sections.map((section) => (
                            <button
                              key={section.id}
                              onClick={() => toggleSection(section.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                                selectedSectionIds.includes(section.id)
                                  ? 'bg-primary-50 border-2 border-primary-500'
                                  : 'bg-gray-50 border-2 border-transparent'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  selectedSectionIds.includes(section.id)
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-200'
                                }`}
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
                                  {section.book?.name} › {section.chapter?.name}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Presets - Quick Access */}
            {practicePresets.length > 0 && (
              <Card>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Bookmark className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 text-sm">Voreinstellungen</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {practicePresets.map((preset) => (
                      <div key={preset.id} className="flex items-center">
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-l-full text-sm text-gray-700 transition-colors"
                        >
                          {preset.name}
                        </button>
                        <button
                          onClick={() => removePracticePreset(preset.id)}
                          className="px-2 py-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-r-full text-gray-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consolidated Settings - Collapsible */}
            <Card>
              <CardContent className="p-0">
                <button
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">Einstellungen</h3>
                    <span className="text-sm text-gray-500">
                      {settingsSummary}
                    </span>
                  </div>
                  {settingsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <AnimatePresence>
                  {settingsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-gray-100 space-y-4">
                        {/* Exercise Type */}
                        <div className="pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Übungsart</p>
                          <div className="grid grid-cols-3 gap-2">
                            {exerciseTypes.map((type) => (
                              <button
                                key={type.id}
                                onClick={() => setExerciseType(type.id)}
                                className={`p-2 rounded-xl text-center transition-colors ${
                                  exerciseType === type.id
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <span className="text-xl block">{type.icon}</span>
                                <span className="text-xs font-medium">{type.short}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Direction */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Richtung</p>
                          <div className="flex gap-2">
                            {directions.map((dir) => (
                              <button
                                key={dir.id}
                                onClick={() => setDirection(dir.id)}
                                className={`flex-1 p-2 rounded-xl text-center transition-colors ${
                                  direction === dir.id
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <p className="text-xs font-medium">{dir.short}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Due Only Toggle */}
                        <div>
                          <Toggle
                            checked={dueOnly}
                            onChange={setDueOnly}
                            label="Nur fällige Vokabeln"
                            description={
                              dueOnly
                                ? `${dueWords.length} bereit`
                                : `${allVocabulary.length} insgesamt`
                            }
                          />
                        </div>

                        {/* Save Preset */}
                        <div className="pt-2 border-t border-gray-100">
                          {showSavePreset ? (
                            <div className="flex gap-2">
                              <Input
                                placeholder="Name der Voreinstellung"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSavePreset}
                                disabled={!presetName.trim()}
                              >
                                Speichern
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowSavePreset(false)
                                  setPresetName('')
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowSavePreset(true)}
                              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                            >
                              <Plus className="w-4 h-4" />
                              Als Voreinstellung speichern
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Fixed Start Button Footer */}
          <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto"
            >
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleStart}
                disabled={wordCount === 0}
                className="shadow-lg"
              >
                {wordCount === 0
                  ? 'Keine Vokabeln ausgewählt'
                  : `${wordCount} ${wordCount === 1 ? 'Vokabel' : 'Vokabeln'} üben`}
              </Button>
            </motion.div>
          </div>
        </>
      )}
    </PageContainer>
  )
}
