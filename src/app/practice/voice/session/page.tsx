'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useVoiceSession } from '@/stores/voice-session'
import { useGamification } from '@/stores/gamification'
import { useOnboarding } from '@/stores/onboarding'
import { useAchievements } from '@/stores/achievements'
import { VoiceSessionView } from '@/components/practice/VoiceSessionView'
import { db } from '@/lib/db/db'
import type { ReviewSession, ReviewAttempt } from '@/lib/db/schema'

export default function VoiceSessionPage() {
  const router = useRouter()

  const {
    status,
    items,
    direction,
    sectionIds,
    reset,
  } = useVoiceSession()

  const recordSessionComplete = useGamification((s) => s.recordSessionComplete)
  const currentStreak = useGamification((s) => s.currentStreak)
  const longestStreak = useGamification((s) => s.longestStreak)
  const dailyGoal = useOnboarding((s) => s.dailyGoal)
  const recordSession = useAchievements((s) => s.recordSession)
  const recordWordsLearned = useAchievements((s) => s.recordWordsLearned)
  const checkAndUnlockAchievements = useAchievements((s) => s.checkAndUnlockAchievements)

  const hasRecordedSession = useRef(false)
  const sessionIdRef = useRef<string | null>(null)

  // Redirect if no active session
  useEffect(() => {
    if (status === 'idle' && items.length === 0) {
      router.replace('/practice/voice')
    }
  }, [status, items.length, router])

  // Create session record when starting
  useEffect(() => {
    if (status === 'intro' && items.length > 0 && !sessionIdRef.current) {
      const createSession = async () => {
        const session: ReviewSession = {
          id: crypto.randomUUID(),
          exerciseType: 'typed', // Voice uses typed-like matching
          direction,
          sectionIds,
          totalItems: items.length,
          correctCount: 0,
          startedAt: new Date(),
        }
        await db.reviewSessions.add(session)
        sessionIdRef.current = session.id
      }
      createSession()
    }
  }, [status, items.length, direction, sectionIds])

  const handleSessionComplete = async () => {
    // Only record once
    if (hasRecordedSession.current) {
      reset()
      router.push('/practice/voice/summary')
      return
    }
    hasRecordedSession.current = true

    const correctCount = items.filter((i) => i.correct).length
    const totalCount = items.length

    // Update session record
    if (sessionIdRef.current) {
      await db.reviewSessions.update(sessionIdRef.current, {
        correctCount,
        completedAt: new Date(),
      })

      // Record attempts
      const attempts: ReviewAttempt[] = items
        .filter((item) => item.answered)
        .map((item) => ({
          id: crypto.randomUUID(),
          sessionId: sessionIdRef.current!,
          vocabularyId: item.vocabulary.id,
          exerciseType: 'typed' as const,
          direction,
          userAnswer: item.extractedAnswer || item.userTranscript || '',
          wasCorrect: item.correct || false,
          qualityRating: item.qualityRating || 1,
          responseTimeMs: 0, // Voice sessions don't track response time the same way
          createdAt: new Date(),
        }))

      await db.reviewAttempts.bulkAdd(attempts)

      // Update learning progress for each item
      for (const item of items) {
        if (item.answered && item.qualityRating) {
          const existing = await db.learningProgress
            .where('vocabularyId')
            .equals(item.vocabulary.id)
            .first()

          if (existing) {
            // Import SM-2 calculation
            const { calculateNextReview } = await import('@/lib/learning/sm2')
            const update = calculateNextReview(
              {
                easeFactor: existing.easeFactor,
                interval: existing.interval,
                repetitions: existing.repetitions,
              },
              item.qualityRating
            )

            await db.learningProgress.update(existing.id, {
              ...update,
              totalReviews: existing.totalReviews + 1,
              correctReviews: existing.correctReviews + (item.correct ? 1 : 0),
              lastReviewDate: new Date(),
              updatedAt: new Date(),
            })
          } else {
            // Create new progress record
            const { calculateNextReview, getDefaultProgress } = await import('@/lib/learning/sm2')
            const update = calculateNextReview(getDefaultProgress(), item.qualityRating)

            await db.learningProgress.add({
              id: crypto.randomUUID(),
              vocabularyId: item.vocabulary.id,
              ...update,
              totalReviews: 1,
              correctReviews: item.correct ? 1 : 0,
              lastReviewDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        }
      }
    }

    // Record gamification
    recordSessionComplete(correctCount, totalCount, dailyGoal)

    // Record achievements
    recordSession(correctCount, totalCount, false)
    recordWordsLearned(totalCount)
    checkAndUnlockAchievements(currentStreak, longestStreak)

    // Navigate to summary
    router.push('/practice/voice/summary')
  }

  // Show nothing while checking for valid session
  if (status === 'idle' && items.length === 0) {
    return null
  }

  return <VoiceSessionView onSessionComplete={handleSessionComplete} />
}
