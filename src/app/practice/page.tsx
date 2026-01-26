'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { useAllSections } from '@/lib/db/hooks/useBooks'
import { useVocabularyWithProgress } from '@/lib/db/hooks/useVocabulary'
import { useDueWords } from '@/lib/db/hooks/useDueWords'
import { usePracticeSession } from '@/stores/practice-session'
import { useSettings } from '@/stores/settings'
import type { ExerciseType, PracticeDirection } from '@/lib/db/schema'

const exerciseTypes: { id: ExerciseType; label: string; icon: string }[] = [
  { id: 'flashcard', label: 'Karteikarten', icon: '🎴' },
  { id: 'multipleChoice', label: 'Multiple Choice', icon: '🔘' },
  { id: 'typed', label: 'Eingabe', icon: '⌨️' },
]

const directions: { id: PracticeDirection; label: string; description: string }[] = [
  {
    id: 'sourceToTarget',
    label: 'Deutsch → Fremdsprache',
    description: 'Übersetze deutsche Wörter',
  },
  {
    id: 'targetToSource',
    label: 'Fremdsprache → Deutsch',
    description: 'Übersetze Fremdwörter',
  },
  { id: 'mixed', label: 'Gemischt', description: 'Wechselt ab' },
]

export default function PracticePage() {
  const router = useRouter()
  const { sections, isLoading: sectionsLoading } = useAllSections()
  const startSession = usePracticeSession((state) => state.startSession)
  const settings = useSettings()

  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [exerciseType, setExerciseType] = useState<ExerciseType>(
    settings.defaultExerciseType
  )
  const [direction, setDirection] = useState<PracticeDirection>(
    settings.defaultDirection
  )
  const [dueOnly, setDueOnly] = useState(true)
  const [sectionsExpanded, setSectionsExpanded] = useState(false)

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
  }

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

            {/* Exercise Type - Compact */}
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-3">Übungsart</h3>
                <div className="grid grid-cols-3 gap-2">
                  {exerciseTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setExerciseType(type.id)}
                      className={`p-3 rounded-xl text-center transition-colors ${
                        exerciseType === type.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Direction - Compact horizontal layout */}
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-3">Richtung</h3>
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
                      <p className="text-xs font-medium">
                        {dir.id === 'sourceToTarget' ? 'DE → FS' : dir.id === 'targetToSource' ? 'FS → DE' : 'Gemischt'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Due Only Toggle */}
            <Card>
              <CardContent>
                <Toggle
                  checked={dueOnly}
                  onChange={setDueOnly}
                  label="Nur fällige Vokabeln"
                  description={
                    dueOnly
                      ? `${dueWords.length} bereit zur Wiederholung`
                      : `${allVocabulary.length} insgesamt`
                  }
                />
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
