'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionSuggestions } from '@/components/practice/SectionSuggestions'
import { useSectionDueStats } from '@/lib/db/hooks/useSectionDueStats'
import { useDueWords } from '@/lib/db/hooks/useDueWords'
import { usePracticeSession } from '@/stores/practice-session'
import { cn } from '@/lib/utils/cn'
import type { PracticeDirection } from '@/lib/db/schema'

const directions: { id: PracticeDirection; label: string }[] = [
  { id: 'sourceToTarget', label: 'Deutsch → Fremd' },
  { id: 'targetToSource', label: 'Fremd → Deutsch' },
]

export default function ParentQuizSetupPage() {
  const router = useRouter()
  const { sections, isLoading } = useSectionDueStats()
  const startSession = usePracticeSession((state) => state.startSession)

  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [direction, setDirection] = useState<PracticeDirection>('sourceToTarget')
  const [showAllSections, setShowAllSections] = useState(false)

  // Get vocabulary for selected sections
  const { dueWords } = useDueWords(
    selectedSectionIds.length > 0 ? selectedSectionIds : undefined
  )

  const wordCount = useMemo(() => {
    if (selectedSectionIds.length === 0) return 0
    return dueWords.filter((w) => w.sectionId && selectedSectionIds.includes(w.sectionId)).length
  }, [dueWords, selectedSectionIds])

  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const selectAll = () => {
    setSelectedSectionIds(sections.map((s) => s.section.id))
  }

  const deselectAll = () => {
    setSelectedSectionIds([])
  }

  const handleStart = () => {
    if (wordCount === 0) return

    const wordsToStudy = dueWords.filter((w) =>
      w.sectionId && selectedSectionIds.includes(w.sectionId)
    )

    startSession({
      exerciseType: 'flashcard',
      direction,
      sectionIds: selectedSectionIds,
      quizMode: 'parent',
      items: wordsToStudy.map((v) => ({
        vocabulary: v,
        progress: v.progress,
      })),
    })

    router.push('/practice/parent-quiz/session')
  }

  // Sections not in suggestions (for "All Sections" list)
  const suggestedSectionIds = new Set(
    sections.filter((s) => s.dueCount > 0).slice(0, 3).map((s) => s.section.id)
  )
  const otherSections = sections.filter(
    (s) => !suggestedSectionIds.has(s.section.id) || s.dueCount === 0
  )

  return (
    <PageContainer>
      <Header title="Eltern-Quiz" showBack />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-3" />
                <div className="h-16 bg-gray-100 rounded" />
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
        <div className="space-y-6">
          {/* Suggested Sections */}
          <Card>
            <CardContent>
              <SectionSuggestions
                sections={sections}
                selectedSectionIds={selectedSectionIds}
                onToggleSection={toggleSection}
              />
            </CardContent>
          </Card>

          {/* All Sections (expandable) */}
          {otherSections.length > 0 && (
            <Card>
              <CardContent>
                <button
                  onClick={() => setShowAllSections(!showAllSections)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <h3 className="font-semibold text-gray-900">Alle Abschnitte</h3>
                  <svg
                    className={cn(
                      'w-5 h-5 text-gray-500 transition-transform',
                      showAllSections && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showAllSections && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="flex items-center justify-end gap-2 mb-3">
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
                      {otherSections.map((stat) => {
                        const isSelected = selectedSectionIds.includes(
                          stat.section.id
                        )
                        return (
                          <button
                            key={stat.section.id}
                            onClick={() => toggleSection(stat.section.id)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                              isSelected
                                ? 'bg-primary-50 border-2 border-primary-500'
                                : 'bg-gray-50 border-2 border-transparent'
                            )}
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center',
                                isSelected
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-200'
                              )}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {stat.section.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {stat.book.name} › {stat.chapter.name}
                              </p>
                            </div>
                            {stat.dueCount > 0 && (
                              <span className="text-xs text-gray-500">
                                {stat.dueCount} fällig
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Direction Selection */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-3">Richtung</h3>
              <div className="grid grid-cols-2 gap-3">
                {directions.map((dir) => (
                  <button
                    key={dir.id}
                    onClick={() => setDirection(dir.id)}
                    className={cn(
                      'p-3 rounded-xl text-center transition-colors font-medium',
                      direction === dir.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {dir.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Word Count & Start */}
          <motion.div
            className="bg-primary-500 rounded-2xl p-4 text-white text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-4xl font-bold">{wordCount}</p>
            <p className="text-primary-100 mb-4">
              {wordCount === 1 ? 'Vokabel' : 'Vokabeln'} zum Abfragen
            </p>
            <Button
              variant="secondary"
              fullWidth
              onClick={handleStart}
              disabled={wordCount === 0}
            >
              {wordCount === 0 ? 'Wähle Abschnitte aus' : 'Quiz starten'}
            </Button>
          </motion.div>
        </div>
      )}
    </PageContainer>
  )
}
