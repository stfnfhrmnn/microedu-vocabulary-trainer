/**
 * Individual Shared Book API Routes
 *
 * DELETE /api/shared-books/:id - Unshare a book
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq } from 'drizzle-orm'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sharedBookId } = await params

    // Get shared book
    const sharedBook = await serverDb.query.networkSharedBooks.findFirst({
      where: (shared, { eq }) => eq(shared.id, sharedBookId),
    })

    if (!sharedBook) {
      return NextResponse.json({ error: 'Shared book not found' }, { status: 404 })
    }

    // Check ownership or admin permission
    if (sharedBook.ownerId !== user.userId) {
      const membership = await serverDb.query.networkMembers.findFirst({
        where: (members, { eq, and }) =>
          and(eq(members.networkId, sharedBook.networkId), eq(members.userId, user.userId)),
      })

      if (!membership || !['admin', 'teacher'].includes(membership.role)) {
        return NextResponse.json({ error: 'Not authorized to unshare this book' }, { status: 403 })
      }
    }

    // Delete shared book record
    await serverDb
      .delete(schema.networkSharedBooks)
      .where(eq(schema.networkSharedBooks.id, sharedBookId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unshare book error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
