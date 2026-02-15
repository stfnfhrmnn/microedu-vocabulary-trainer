/**
 * Stats Submission API Route
 *
 * POST /api/stats/submit - Submit practice session stats
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const SubmitStatsSchema = z.object({
  wordsReviewed: z.number().int().min(0),
  wordsMastered: z.number().int().min(0),
  correctCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  xpEarned: z.number().int().min(0),
  streakDays: z.number().int().min(0),
})

function getPeriodStart(periodType: string): Date {
  const now = new Date()
  switch (periodType) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'weekly':
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(now.getFullYear(), now.getMonth(), diff)
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'all_time':
      return new Date(0)
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const stats = SubmitStatsSchema.parse(body)

    const periods = ['daily', 'weekly', 'monthly', 'all_time'] as const

    for (const periodType of periods) {
      const periodStart = getPeriodStart(periodType)

      // Try to find existing stats
      const existing = await serverDb.query.competitionStats.findFirst({
        where: (s, { eq, and }) =>
          and(
            eq(s.userId, user.userId),
            eq(s.periodType, periodType),
            eq(s.periodStart, periodStart)
          ),
      })

      if (existing) {
        // Calculate new rolling accuracy
        const previousTotal = existing.wordsReviewed || 0
        const previousCorrect = Math.round(previousTotal * Number(existing.accuracyPercentage) / 100)
        const newTotal = previousTotal + stats.totalCount
        const newCorrect = previousCorrect + stats.correctCount
        const newAccuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0

        // Update existing stats
        await serverDb
          .update(schema.competitionStats)
          .set({
            wordsReviewed: (existing.wordsReviewed || 0) + stats.wordsReviewed,
            wordsMastered: (existing.wordsMastered || 0) + stats.wordsMastered,
            accuracyPercentage: String(Math.round(newAccuracy * 100) / 100),
            xpEarned: (existing.xpEarned || 0) + stats.xpEarned,
            streakDays: stats.streakDays,
            sessionsCompleted: (existing.sessionsCompleted || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(schema.competitionStats.id, existing.id))
      } else {
        // Create new stats record
        const accuracy = stats.totalCount > 0
          ? (stats.correctCount / stats.totalCount) * 100
          : 0

        await serverDb.insert(schema.competitionStats).values({
          userId: user.userId,
          periodType,
          periodStart,
          wordsReviewed: stats.wordsReviewed,
          wordsMastered: stats.wordsMastered,
          accuracyPercentage: String(Math.round(accuracy * 100) / 100),
          xpEarned: stats.xpEarned,
          streakDays: stats.streakDays,
          sessionsCompleted: 1,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Submit stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
