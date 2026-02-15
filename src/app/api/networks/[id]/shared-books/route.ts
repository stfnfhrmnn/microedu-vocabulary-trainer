/**
 * Network Shared Books API Routes
 *
 * GET /api/networks/:id/shared-books - List books shared with network
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: networkId } = await params

    // Check membership
    const membership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.userId, user.userId), eq(members.joinStatus, 'active')),
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
    }

    const network = await serverDb.query.networks.findFirst({
      where: (networks, { eq }) => eq(networks.id, networkId),
    })

    if (!network) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 })
    }

    // Family rule: parents automatically see child-owned books as read-only/shareable copies.
    // We materialize missing share records once so existing copy/unshare flows work unchanged.
    if (network.type === 'family' && membership.role === 'parent') {
      const familyMembers = await serverDb.query.networkMembers.findMany({
        where: (members, { eq, and }) =>
          and(eq(members.networkId, networkId), eq(members.joinStatus, 'active')),
      })

      const childUserIds = familyMembers
        .filter((member) => member.role === 'child')
        .map((member) => member.userId)

      if (childUserIds.length > 0) {
        const childBooks = await serverDb.query.books.findMany({
          where: (books, { inArray, and, isNull }) =>
            and(inArray(books.userId, childUserIds), isNull(books.deletedAt)),
          columns: { id: true, userId: true },
        })

        if (childBooks.length > 0) {
          const existingShares = await serverDb.query.networkSharedBooks.findMany({
            where: (shared, { eq }) => eq(shared.networkId, networkId),
            columns: { bookId: true },
          })
          const sharedBookIds = new Set(existingShares.map((row) => row.bookId))

          const missingShares = childBooks.filter((book) => !sharedBookIds.has(book.id))
          if (missingShares.length > 0) {
            await serverDb.insert(schema.networkSharedBooks).values(
              missingShares.map((book) => ({
                bookId: book.id,
                ownerId: book.userId,
                networkId,
                permissions: 'copy' as const,
                copyCount: 0,
              }))
            )
          }
        }
      }
    }

    // Get shared books
    const sharedBooks = await serverDb.query.networkSharedBooks.findMany({
      where: (shared, { eq }) => eq(shared.networkId, networkId),
    })

    if (sharedBooks.length === 0) {
      return NextResponse.json({ sharedBooks: [] })
    }

    // Get book details
    const bookIds = sharedBooks.map((s) => s.bookId)
    const books = await serverDb.query.books.findMany({
      where: (books, { inArray, isNull, and }) =>
        and(inArray(books.id, bookIds), isNull(books.deletedAt)),
    })
    const bookMap = new Map(books.map((b) => [b.id, b]))

    // Get owner info
    const ownerIds = [...new Set(sharedBooks.map((s) => s.ownerId))]
    const owners = await serverDb.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, ownerIds),
      columns: { id: true, name: true, avatar: true },
    })
    const ownerMap = new Map(owners.map((o) => [o.id, o]))

    // Get member nicknames
    const memberRecords = await serverDb.query.networkMembers.findMany({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.joinStatus, 'active')),
    })
    const nicknameMap = new Map(memberRecords.map((m) => [m.userId, m.nickname]))

    // Check if user already has copies
    const copies = await serverDb.query.bookCopies.findMany({
      where: (copies, { eq }) => eq(copies.copiedBy, user.userId),
    })
    const copiedBooksByOriginal = new Map(
      copies.map((copy) => [copy.originalBookId, copy.copiedBookId])
    )

    // Build response
    const result = sharedBooks
      .map((shared) => {
        const book = bookMap.get(shared.bookId)
        if (!book) return null

        const owner = ownerMap.get(shared.ownerId)
        const ownerNickname = nicknameMap.get(shared.ownerId)

        return {
          id: shared.id,
          book: {
            id: book.id,
            name: book.name,
            language: book.language,
            coverColor: book.coverColor,
            description: book.description,
          },
          owner: {
            id: shared.ownerId,
            name: ownerNickname || owner?.name || 'Anonym',
            avatar: owner?.avatar || '👤',
          },
          copyCount: shared.copyCount || 0,
          sharedAt: shared.sharedAt,
          alreadyCopied: copiedBooksByOriginal.has(shared.bookId),
          copiedBookId: copiedBooksByOriginal.get(shared.bookId) ?? null,
          isOwner: shared.ownerId === user.userId,
          canUnshare:
            shared.ownerId === user.userId ||
            membership.role === 'admin' ||
            membership.role === 'teacher',
        }
      })
      .filter(Boolean)

    return NextResponse.json({ sharedBooks: result })
  } catch (error) {
    console.error('Get shared books error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
