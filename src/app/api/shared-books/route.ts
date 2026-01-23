/**
 * Shared Books API Routes
 *
 * POST /api/shared-books - Share a book with a network
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const ShareBookSchema = z.object({
  bookId: z.string().uuid(),
  networkId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookId, networkId } = ShareBookSchema.parse(body)

    // Check membership
    const membership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.userId, user.userId), eq(members.joinStatus, 'active')),
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
    }

    // Check book ownership (simplified - check if book exists for this user)
    const book = await serverDb.query.books.findFirst({
      where: (books, { eq, and, isNull }) =>
        and(eq(books.id, bookId), eq(books.userId, user.userId), isNull(books.deletedAt)),
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found or not owned by you' }, { status: 404 })
    }

    // Check if already shared
    const existing = await serverDb.query.networkSharedBooks.findFirst({
      where: (shared, { eq, and }) =>
        and(eq(shared.bookId, bookId), eq(shared.networkId, networkId)),
    })

    if (existing) {
      return NextResponse.json({ error: 'Book is already shared with this network' }, { status: 409 })
    }

    // Create shared book record
    const [sharedBook] = await serverDb
      .insert(schema.networkSharedBooks)
      .values({
        bookId,
        ownerId: user.userId,
        networkId,
        permissions: 'copy',
        copyCount: 0,
      })
      .returning()

    return NextResponse.json({
      success: true,
      sharedBook: {
        id: sharedBook.id,
        bookId: sharedBook.bookId,
        networkId: sharedBook.networkId,
        sharedAt: sharedBook.sharedAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Share book error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
