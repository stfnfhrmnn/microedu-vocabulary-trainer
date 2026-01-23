/**
 * Confirm Deletion Request API Route
 *
 * POST /api/deletion-requests/:id/confirm - Confirm a pending deletion request
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: requestId } = await params

    // Get the deletion request
    const deletionRequest = await serverDb.query.deletionRequests.findFirst({
      where: (dr, { eq }) => eq(dr.id, requestId),
    })

    if (!deletionRequest) {
      return NextResponse.json({ error: 'Deletion request not found' }, { status: 404 })
    }

    if (deletionRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }

    // Only the requester or a parent can confirm
    // For now, allow the requester to confirm their own request
    if (deletionRequest.userId !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to confirm this request' }, { status: 403 })
    }

    // Update status
    await serverDb
      .update(schema.deletionRequests)
      .set({
        status: 'confirmed',
        confirmedBy: user.userId,
      })
      .where(eq(schema.deletionRequests.id, requestId))

    // Perform the actual deletion based on item type
    const { itemType, itemId } = deletionRequest

    if (itemType === 'vocabulary') {
      await serverDb
        .update(schema.vocabularyItems)
        .set({ deletedAt: new Date() })
        .where(eq(schema.vocabularyItems.id, itemId))
    } else if (itemType === 'book') {
      // Soft delete the book and cascade to children
      await serverDb
        .update(schema.books)
        .set({ deletedAt: new Date() })
        .where(eq(schema.books.id, itemId))

      await serverDb
        .update(schema.chapters)
        .set({ deletedAt: new Date() })
        .where(eq(schema.chapters.bookId, itemId))

      await serverDb
        .update(schema.sections)
        .set({ deletedAt: new Date() })
        .where(eq(schema.sections.bookId, itemId))

      await serverDb
        .update(schema.vocabularyItems)
        .set({ deletedAt: new Date() })
        .where(eq(schema.vocabularyItems.bookId, itemId))
    } else if (itemType === 'chapter') {
      await serverDb
        .update(schema.chapters)
        .set({ deletedAt: new Date() })
        .where(eq(schema.chapters.id, itemId))

      await serverDb
        .update(schema.sections)
        .set({ deletedAt: new Date() })
        .where(eq(schema.sections.chapterId, itemId))

      await serverDb
        .update(schema.vocabularyItems)
        .set({ deletedAt: new Date() })
        .where(eq(schema.vocabularyItems.chapterId, itemId))
    } else if (itemType === 'section') {
      await serverDb
        .update(schema.sections)
        .set({ deletedAt: new Date() })
        .where(eq(schema.sections.id, itemId))

      await serverDb
        .update(schema.vocabularyItems)
        .set({ deletedAt: new Date() })
        .where(eq(schema.vocabularyItems.sectionId, itemId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Confirm deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
