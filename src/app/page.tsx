'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, Settings2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { UserMenuButton, UserMenu } from '@/components/user'
import { CodeAwarenessPrompt } from '@/components/profile/CodeAwarenessPrompt'
import { StreakDisplay, DailyGoalCard, LevelBadge } from '@/components/gamification'
import {
  StudyRecommendationsCard,
  WeakWordsCard,
  ProgressPredictionCard,
  OptimalStudyTimeCard,
} from '@/components/recommendations'
import { useDueWordsCount, useVocabularyStats, useDueWords } from '@/lib/db/hooks/useDueWords'
import { useVocabularyCount } from '@/lib/db/hooks/useVocabulary'
import { useAllSections } from '@/lib/db/hooks/useBooks'
import { useOnboarding } from '@/stores/onboarding'
import { useGamification, useTodayProgress } from '@/stores/gamification'
import { usePracticeSession } from '@/stores/practice-session'
import { useSettings } from '@/stores/settings'
import type { ExerciseType, PracticeDirection } from '@/lib/db/schema'

export default function HomePage() {
  const router = useRouter()
  const dueCount = useDueWordsCount()
  const totalCount = useVocabularyCount()
  const { stats } = useVocabularyStats()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { hasCompletedOnboarding, dailyGoal } = useOnboarding()
  const { currentStreak, totalXP, level } = useGamification()
  const todayProgress = useTodayProgress(dailyGoal)

  // Quick start support
  const { sections } = useAllSections()
  const allSectionIds = sections.map(s => s.id)
  const { dueWords } = useDueWords(allSectionIds)
  const startSession = usePracticeSession((state) => state.startSession)
  const { lastPracticeConfig, setLastPracticeConfig, defaultExerciseType, defaultDirection } = useSettings()

  const startDueSession = (exerciseType: ExerciseType, direction: PracticeDirection) => {
    if (dueWords.length === 0) return

    // Get target language from first selected section
    const firstSection = sections.find((s) => allSectionIds.includes(s.id))
    const targetLanguage = firstSection?.book?.language

    setLastPracticeConfig({
      exerciseType,
      direction,
      wordScope: 'due',
      sectionIds: allSectionIds,
    })

    startSession({
      exerciseType,
      direction,
      sectionIds: allSectionIds,
      targetLanguage,
      items: dueWords.map((v) => ({
        vocabulary: v,
        progress: v.progress,
      })),
    })

    router.push('/practice/session')
  }

  const handleQuickStart = () => {
    const config = lastPracticeConfig || {
      exerciseType: defaultExerciseType,
      direction: defaultDirection,
    }

    startDueSession(config.exerciseType, config.direction)
  }

  const handleTypedDueStart = () => {
    startDueSession('typed', defaultDirection)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !hasCompletedOnboarding) {
      router.replace('/onboarding')
    }
  }, [mounted, hasCompletedOnboarding, router])

  if (!mounted || !hasCompletedOnboarding) {
    return null
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vokabeltrainer</h1>
          <p className="text-gray-500 mt-1">Willkommen zurück!</p>
        </div>
        <UserMenuButton onClick={() => setIsUserMenuOpen(true)} />
      </div>

      {/* User Menu Modal */}
      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />

      {/* Code Awareness Prompt - shows after first sync */}
      <CodeAwarenessPrompt />

      {/* Daily Goal & Streak Cards */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="py-4">
              <DailyGoalCard
                current={todayProgress.wordsReviewed}
                goal={dailyGoal}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex flex-col items-center justify-center">
              <StreakDisplay streak={currentStreak} size="md" />
              <LevelBadge level={level} totalXP={totalXP} size="sm" className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Due Words Card - Main CTA */}
      <Card className="bg-primary-500 border-primary-500 mb-6">
        <CardContent>
          <div className="text-white">
            <p className="text-primary-100 text-sm font-medium mb-1">
              Heute zu wiederholen
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{dueCount}</span>
              <span className="text-primary-200 text-lg">Vokabeln</span>
            </div>
            {dueCount > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  variant="secondary"
                  className="col-span-1"
                  onClick={handleQuickStart}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Schnell starten
                </Button>

                <Button
                  variant="outline"
                  className="col-span-1 border-white/30 text-white hover:bg-white/10"
                  onClick={handleTypedDueStart}
                >
                  ⌨️ Mit Eingabe
                </Button>

                <Link href="/practice?mode=free" className="col-span-2">
                  <Button variant="outline" fullWidth className="border-white/30 text-white hover:bg-white/10">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Frei üben (Abschnitte wählen)
                  </Button>
                </Link>
              </div>
            )}
            {dueCount === 0 && totalCount > 0 && (
              <div className="mt-3 space-y-3">
                <p className="text-primary-100 text-sm">
                  Super! Alles wiederholt
                </p>
                <Link href="/practice?mode=free">
                  <Button variant="outline" fullWidth className="border-white/30 text-white hover:bg-white/10">
                    Trotzdem frei üben
                  </Button>
                </Link>
              </div>
            )}
            {totalCount === 0 && (
              <p className="text-primary-100 text-sm mt-3">
                Füge deine ersten Vokabeln hinzu
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/add">
          <Card interactive className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Vokabeln</span>
              <span className="text-sm text-gray-500">hinzufügen</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/library">
          <Card interactive className="h-full">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Bibliothek</span>
              <span className="text-sm text-gray-500">verwalten</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Voice Practice Card */}
      {totalCount > 0 && (
        <Link href="/practice/voice">
          <motion.div
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Card className="bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600 mb-4">
              <CardContent>
                <div className="text-white flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">Sprachübung</p>
                    <p className="text-slate-300 text-sm">
                      Ohne Bildschirm lernen
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Link>
      )}

      {/* Parent Quiz Card */}
      {totalCount > 0 && (
        <Link href="/practice/parent-quiz">
          <motion.div
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 mb-4">
              <CardContent>
                <div className="text-white flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">Eltern-Quiz</p>
                    <p className="text-purple-100 text-sm">
                      Kind mündlich abfragen
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-purple-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Link>
      )}

      {/* Group Practice Card */}
      {totalCount > 0 && (
        <Link href="/practice/group">
          <motion.div
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-500 mb-6">
              <CardContent>
                <div className="text-white flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">Lernkreis</p>
                    <p className="text-indigo-100 text-sm">
                      Zusammen mit Freunden lernen
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-indigo-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Link>
      )}

      {/* Stats Overview */}
      {stats && totalCount > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">Dein Fortschritt</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.new}</div>
                <div className="text-xs text-gray-500">Neu</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-500">{stats.learning}</div>
                <div className="text-xs text-gray-500">Lernend</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-500">{stats.mastered}</div>
                <div className="text-xs text-gray-500">Gelernt</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {stats.mastered > 0 && (
                  <div
                    className="bg-success-500 transition-all duration-500"
                    style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
                  />
                )}
                {stats.learning > 0 && (
                  <div
                    className="bg-warning-400 transition-all duration-500"
                    style={{ width: `${(stats.learning / stats.total) * 100}%` }}
                  />
                )}
                {stats.new > 0 && (
                  <div
                    className="bg-gray-300 transition-all duration-500"
                    style={{ width: `${(stats.new / stats.total) * 100}%` }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {stats.total} Vokabeln insgesamt
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Recommendations */}
      {totalCount > 0 && (
        <div className="space-y-4 mb-6">
          {/* Optimal study time indicator */}
          <OptimalStudyTimeCard />

          {/* Personalized recommendations */}
          <StudyRecommendationsCard
            onAction={(rec) => {
              if (rec.action?.vocabularyIds || rec.action?.sectionIds) {
                router.push('/practice')
              } else if (rec.action) {
                router.push('/practice')
              }
            }}
          />

          {/* Progress prediction */}
          <ProgressPredictionCard />

          {/* Weak words needing attention */}
          <WeakWordsCard
            limit={3}
            onPractice={() => router.push('/practice')}
          />
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <EmptyState
          icon="📚"
          title="Bereit zum Lernen?"
          description="In nur 3 Schritten bist du startklar!"
          steps={[
            { icon: '1️⃣', text: 'Erstelle ein Buch für dein Schulbuch' },
            { icon: '2️⃣', text: 'Füge Kapitel und Abschnitte hinzu' },
            { icon: '3️⃣', text: 'Tippe oder scanne deine Vokabeln' },
          ]}
          action={{ label: "Los geht's!", href: '/library' }}
        />
      )}
    </PageContainer>
  )
}
