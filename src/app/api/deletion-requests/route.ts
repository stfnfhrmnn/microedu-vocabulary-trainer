/**
 * Deletion Requests API Routes
 *
 * POST /api/deletion-requests - Request deletion of protected content
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const DeletionRequestSchema = z.object({
  itemType: z.enum(['vocabulary', 'book', 'chapter', 'section']),
  itemId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemType, itemId } = DeletionRequestSchema.parse(body)

    // Calculate total reviews for the item
    let totalReviews = 0

    if (itemType === 'vocabulary') {
      const progress = await serverDb.query.learningProgress.findFirst({
        where: (p, { eq }) => eq(p.localVocabularyId, itemId),
      })
      totalReviews = progress?.totalReviews || 0
    } else if (itemType === 'book') {
      const items = await serverDb.query.vocabularyItems.findMany({
        where: (v, { eq, isNull, and }) =>
          and(eq(v.bookId, itemId), isNull(v.deletedAt)),
        columns: { localId: true },
      })
      const localIds = items.map((i) => i.localId)

      if (localIds.length > 0) {
        const progress = await serverDb.query.learningProgress.findMany({
          where: (p, { inArray }) => inArray(p.localVocabularyId, localIds),
        })
        totalReviews = progress.reduce((sum, p) => sum + (p.totalReviews || 0), 0)
      }
    } else if (itemType === 'chapter') {
      const items = await serverDb.query.vocabularyItems.findMany({
        where: (v, { eq, isNull, and }) =>
          and(eq(v.chapterId, itemId), isNull(v.deletedAt)),
        columns: { localId: true },
      })
      const localIds = items.map((i) => i.localId)

      if (localIds.length > 0) {
        const progress = await serverDb.query.learningProgress.findMany({
          where: (p, { inArray }) => inArray(p.localVocabularyId, localIds),
        })
        totalReviews = progress.reduce((sum, p) => sum + (p.totalReviews || 0), 0)
      }
    } else if (itemType === 'section') {
      const items = await serverDb.query.vocabularyItems.findMany({
        where: (v, { eq, isNull, and }) =>
          and(eq(v.sectionId, itemId), isNull(v.deletedAt)),
        columns: { localId: true },
      })
      const localIds = items.map((i) => i.localId)

      if (localIds.length > 0) {
        const progress = await serverDb.query.learningProgress.findMany({
          where: (p, { inArray }) => inArray(p.localVocabularyId, localIds),
        })
        totalReviews = progress.reduce((sum, p) => sum + (p.totalReviews || 0), 0)
      }
    }

    // Determine if confirmation is required
    const requiresConfirmation = totalReviews >= 10

    // Create deletion request
    const [deletionRequest] = await serverDb
      .insert(schema.deletionRequests)
      .values({
        userId: user.userId,
        itemType,
        itemId,
        totalReviews,
        requiresConfirmation,
        status: 'pending',
      })
      .returning()

    return NextResponse.json({
      success: true,
      deletionRequest: {
        id: deletionRequest.id,
        itemType: deletionRequest.itemType,
        itemId: deletionRequest.itemId,
        totalReviews: deletionRequest.totalReviews,
        requiresConfirmation: deletionRequest.requiresConfirmation,
        status: deletionRequest.status,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Deletion request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
