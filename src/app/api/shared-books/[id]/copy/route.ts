/**
 * Copy Shared Book API Route
 *
 * POST /api/shared-books/:id/copy - Copy a shared book to user's library
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq, and, isNull } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sharedBookId } = await params

    // Get shared book record
    const sharedBook = await serverDb.query.networkSharedBooks.findFirst({
      where: (shared, { eq }) => eq(shared.id, sharedBookId),
    })

    if (!sharedBook) {
      return NextResponse.json({ error: 'Shared book not found' }, { status: 404 })
    }

    // Check membership
    const membership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, sharedBook.networkId), eq(members.userId, user.userId), eq(members.joinStatus, 'active')),
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
    }

    // Check if already copied
    const existingCopy = await serverDb.query.bookCopies.findFirst({
      where: (copies, { eq, and }) =>
        and(eq(copies.originalBookId, sharedBook.bookId), eq(copies.copiedBy, user.userId)),
    })

    if (existingCopy) {
      return NextResponse.json({ error: 'Du hast dieses Buch bereits kopiert', copiedBookId: existingCopy.copiedBookId }, { status: 409 })
    }

    // Get original book
    const originalBook = await serverDb.query.books.findFirst({
      where: (books, { eq, isNull, and }) =>
        and(eq(books.id, sharedBook.bookId), isNull(books.deletedAt)),
    })

    if (!originalBook) {
      return NextResponse.json({ error: 'Original book not found' }, { status: 404 })
    }

    // Copy the book - create new book for the user
    const [newBook] = await serverDb
      .insert(schema.books)
      .values({
        userId: user.userId,
        localId: crypto.randomUUID(),
        name: `${originalBook.name} (Kopie)`,
        language: originalBook.language,
        description: originalBook.description,
        coverColor: originalBook.coverColor,
      })
      .returning()

    // Copy chapters
    const chapters = await serverDb.query.chapters.findMany({
      where: (chapters, { eq, isNull, and }) =>
        and(eq(chapters.bookId, sharedBook.bookId), isNull(chapters.deletedAt)),
    })

    const chapterIdMap = new Map<string, string>()
    for (const chapter of chapters) {
      const [newChapter] = await serverDb
        .insert(schema.chapters)
        .values({
          userId: user.userId,
          bookId: newBook.id,
          localId: crypto.randomUUID(),
          localBookId: newBook.localId,
          name: chapter.name,
          order: chapter.order,
        })
        .returning()
      chapterIdMap.set(chapter.id, newChapter.id)
    }

    // Copy sections
    const sections = await serverDb.query.sections.findMany({
      where: (sections, { eq, isNull, and }) =>
        and(eq(sections.bookId, sharedBook.bookId), isNull(sections.deletedAt)),
    })

    const sectionIdMap = new Map<string, string>()
    for (const section of sections) {
      const newChapterId = chapterIdMap.get(section.chapterId)
      if (!newChapterId) continue

      const newChapter = await serverDb.query.chapters.findFirst({
        where: (c, { eq }) => eq(c.id, newChapterId),
      })

      const [newSection] = await serverDb
        .insert(schema.sections)
        .values({
          userId: user.userId,
          chapterId: newChapterId,
          bookId: newBook.id,
          localId: crypto.randomUUID(),
          localChapterId: newChapter?.localId || '',
          localBookId: newBook.localId,
          name: section.name,
          order: section.order,
          coveredInClass: section.coveredInClass,
        })
        .returning()
      sectionIdMap.set(section.id, newSection.id)
    }

    // Copy vocabulary items
    const vocabItems = await serverDb.query.vocabularyItems.findMany({
      where: (vocab, { eq, isNull, and }) =>
        and(eq(vocab.bookId, sharedBook.bookId), isNull(vocab.deletedAt)),
    })

    for (const vocab of vocabItems) {
      const hasChapter = !!vocab.chapterId
      const hasSection = !!vocab.sectionId

      if (hasChapter !== hasSection) {
        console.warn(`Skipping vocabulary item ${vocab.id} - mismatched chapter/section mapping`)
        continue
      }

      let newChapterId: string | null = null
      let newSectionId: string | null = null
      let newChapterLocalId: string | null = null
      let newSectionLocalId: string | null = null

      if (hasChapter && hasSection) {
        newChapterId = chapterIdMap.get(vocab.chapterId as string) || null
        newSectionId = sectionIdMap.get(vocab.sectionId as string) || null

        // Skip items that don't have valid mappings (shouldn't happen normally)
        if (!newChapterId || !newSectionId) {
          console.warn(`Skipping vocabulary item ${vocab.id} - missing chapter or section mapping`)
          continue
        }

        const newChapter = await serverDb.query.chapters.findFirst({
          where: (c, { eq }) => eq(c.id, newChapterId),
        })
        const newSection = await serverDb.query.sections.findFirst({
          where: (s, { eq }) => eq(s.id, newSectionId),
        })
        newChapterLocalId = newChapter?.localId || null
        newSectionLocalId = newSection?.localId || null
      }

      await serverDb.insert(schema.vocabularyItems).values({
        userId: user.userId,
        sectionId: newSectionId,
        chapterId: newChapterId,
        bookId: newBook.id,
        localId: crypto.randomUUID(),
        localSectionId: newSectionLocalId,
        localChapterId: newChapterLocalId,
        localBookId: newBook.localId,
        sourceText: vocab.sourceText,
        targetText: vocab.targetText,
        notes: vocab.notes,
        imageUrl: vocab.imageUrl,
      })
    }

    // Record the copy
    await serverDb.insert(schema.bookCopies).values({
      originalBookId: sharedBook.bookId,
      copiedBookId: newBook.id,
      copiedBy: user.userId,
      copiedFromUserId: sharedBook.ownerId,
    })

    // Increment copy count
    await serverDb
      .update(schema.networkSharedBooks)
      .set({ copyCount: (sharedBook.copyCount || 0) + 1 })
      .where(eq(schema.networkSharedBooks.id, sharedBookId))

    return NextResponse.json({
      success: true,
      copiedBook: {
        id: newBook.id,
        name: newBook.name,
        language: newBook.language,
        coverColor: newBook.coverColor,
      },
    })
  } catch (error) {
    console.error('Copy book error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
