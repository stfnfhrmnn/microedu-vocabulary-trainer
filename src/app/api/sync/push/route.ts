import { NextResponse } from 'next/server'
import { eq, and, isNull } from 'drizzle-orm'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { z } from 'zod'

const ChangeSchema = z.object({
  id: z.string(),
  table: z.enum(['books', 'chapters', 'sections', 'vocabularyItems', 'learningProgress']),
  operation: z.enum(['create', 'update', 'delete']),
  localId: z.string(),
  data: z.record(z.unknown()).nullable(),
  timestamp: z.number(),
})

const PushSchema = z.object({
  changes: z.array(ChangeSchema),
})

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { changes } = PushSchema.parse(body)

    // Find the server user
    const serverUser = await serverDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.userId),
    })

    if (!serverUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let processed = 0
    const errors: Array<{ changeId: string; error: string }> = []

    // Process changes in order
    for (const change of changes) {
      try {
        await processChange(user.userId, change)
        processed++
      } catch (error) {
        errors.push({
          changeId: change.id,
          error: (error as Error).message,
        })
      }
    }

    // Update last synced timestamp
    await serverDb
      .update(schema.users)
      .set({ lastSyncedAt: new Date() })
      .where(eq(schema.users.id, user.userId))

    return NextResponse.json({
      success: true,
      processed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Push error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface Change {
  table: string
  operation: string
  localId: string
  data: Record<string, unknown> | null
}

async function processChange(userId: string, change: Change): Promise<void> {
  const { table, operation, localId, data } = change

  switch (table) {
    case 'books':
      await processBookChange(userId, operation, localId, data)
      break
    case 'chapters':
      await processChapterChange(userId, operation, localId, data)
      break
    case 'sections':
      await processSectionChange(userId, operation, localId, data)
      break
    case 'vocabularyItems':
      await processVocabularyChange(userId, operation, localId, data)
      break
    case 'learningProgress':
      await processProgressChange(userId, operation, localId, data)
      break
  }
}

async function processBookChange(
  userId: string,
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await serverDb
      .update(schema.books)
      .set({ deletedAt: new Date() })
      .where(and(eq(schema.books.userId, userId), eq(schema.books.localId, localId)))
  } else if (data) {
    const existing = await serverDb.query.books.findFirst({
      where: (books, { eq, and }) =>
        and(eq(books.userId, userId), eq(books.localId, localId)),
    })

    if (existing) {
      await serverDb
        .update(schema.books)
        .set({
          name: data.name as string,
          language: data.language as string,
          description: data.description as string | undefined,
          coverColor: data.coverColor as string,
          updatedAt: new Date(),
          deletedAt: null, // Restore if previously deleted
        })
        .where(eq(schema.books.id, existing.id))
    } else {
      await serverDb.insert(schema.books).values({
        userId,
        localId,
        name: data.name as string,
        language: data.language as string,
        description: data.description as string | undefined,
        coverColor: data.coverColor as string,
      })
    }
  }
}

async function processChapterChange(
  userId: string,
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await serverDb
      .update(schema.chapters)
      .set({ deletedAt: new Date() })
      .where(and(eq(schema.chapters.userId, userId), eq(schema.chapters.localId, localId)))
  } else if (data) {
    // Find the server book ID from local book ID
    const book = await serverDb.query.books.findFirst({
      where: (books, { eq, and, isNull }) =>
        and(
          eq(books.userId, userId),
          eq(books.localId, data.bookId as string),
          isNull(books.deletedAt)
        ),
    })

    if (!book) {
      throw new Error(`Book not found: ${data.bookId}`)
    }

    const existing = await serverDb.query.chapters.findFirst({
      where: (chapters, { eq, and }) =>
        and(eq(chapters.userId, userId), eq(chapters.localId, localId)),
    })

    if (existing) {
      await serverDb
        .update(schema.chapters)
        .set({
          name: data.name as string,
          order: data.order as number,
          updatedAt: new Date(),
          deletedAt: null,
        })
        .where(eq(schema.chapters.id, existing.id))
    } else {
      await serverDb.insert(schema.chapters).values({
        userId,
        bookId: book.id,
        localId,
        localBookId: data.bookId as string,
        name: data.name as string,
        order: data.order as number,
      })
    }
  }
}

async function processSectionChange(
  userId: string,
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await serverDb
      .update(schema.sections)
      .set({ deletedAt: new Date() })
      .where(and(eq(schema.sections.userId, userId), eq(schema.sections.localId, localId)))
  } else if (data) {
    // Find the server chapter and book IDs
    const chapter = await serverDb.query.chapters.findFirst({
      where: (chapters, { eq, and, isNull }) =>
        and(
          eq(chapters.userId, userId),
          eq(chapters.localId, data.chapterId as string),
          isNull(chapters.deletedAt)
        ),
    })

    const book = await serverDb.query.books.findFirst({
      where: (books, { eq, and, isNull }) =>
        and(
          eq(books.userId, userId),
          eq(books.localId, data.bookId as string),
          isNull(books.deletedAt)
        ),
    })

    if (!chapter || !book) {
      throw new Error(`Chapter or book not found`)
    }

    const existing = await serverDb.query.sections.findFirst({
      where: (sections, { eq, and }) =>
        and(eq(sections.userId, userId), eq(sections.localId, localId)),
    })

    if (existing) {
      await serverDb
        .update(schema.sections)
        .set({
          name: data.name as string,
          order: data.order as number,
          coveredInClass: (data.coveredInClass as boolean) ? 1 : 0,
          updatedAt: new Date(),
          deletedAt: null,
        })
        .where(eq(schema.sections.id, existing.id))
    } else {
      await serverDb.insert(schema.sections).values({
        userId,
        chapterId: chapter.id,
        bookId: book.id,
        localId,
        localChapterId: data.chapterId as string,
        localBookId: data.bookId as string,
        name: data.name as string,
        order: data.order as number,
        coveredInClass: (data.coveredInClass as boolean) ? 1 : 0,
      })
    }
  }
}

async function processVocabularyChange(
  userId: string,
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await serverDb
      .update(schema.vocabularyItems)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(schema.vocabularyItems.userId, userId), eq(schema.vocabularyItems.localId, localId))
      )
  } else if (data) {
    const localSectionId = (data.sectionId as string | null) ?? null
    const localChapterId = (data.chapterId as string | null) ?? null
    const localBookId = data.bookId as string

    if (!localBookId) {
      throw new Error('Book ID missing')
    }

    // Book is always required
    const book = await serverDb.query.books.findFirst({
      where: (books, { eq, and, isNull }) =>
        and(
          eq(books.userId, userId),
          eq(books.localId, localBookId),
          isNull(books.deletedAt)
        ),
    })

    if (!book) {
      throw new Error(`Book not found: ${localBookId}`)
    }

    // Section + chapter are optional together (unsorted vocab)
    if ((localSectionId && !localChapterId) || (!localSectionId && localChapterId)) {
      throw new Error('Section and chapter must both be provided or both be null')
    }

    let sectionId: string | null = null
    let chapterId: string | null = null

    if (localSectionId && localChapterId) {
      const section = await serverDb.query.sections.findFirst({
        where: (sections, { eq, and, isNull }) =>
          and(
            eq(sections.userId, userId),
            eq(sections.localId, localSectionId),
            isNull(sections.deletedAt)
          ),
      })

      const chapter = await serverDb.query.chapters.findFirst({
        where: (chapters, { eq, and, isNull }) =>
          and(
            eq(chapters.userId, userId),
            eq(chapters.localId, localChapterId),
            isNull(chapters.deletedAt)
          ),
      })

      if (!section || !chapter) {
        throw new Error('Section or chapter not found')
      }

      sectionId = section.id
      chapterId = chapter.id
    }

    const existing = await serverDb.query.vocabularyItems.findFirst({
      where: (items, { eq, and }) =>
        and(eq(items.userId, userId), eq(items.localId, localId)),
    })

    if (existing) {
      await serverDb
        .update(schema.vocabularyItems)
        .set({
          sectionId,
          chapterId,
          bookId: book.id,
          localSectionId,
          localChapterId,
          localBookId,
          sourceText: data.sourceText as string,
          targetText: data.targetText as string,
          notes: data.notes as string | undefined,
          imageUrl: data.imageUrl as string | undefined,
          updatedAt: new Date(),
          deletedAt: null,
        })
        .where(eq(schema.vocabularyItems.id, existing.id))
    } else {
      await serverDb.insert(schema.vocabularyItems).values({
        userId,
        sectionId,
        chapterId,
        bookId: book.id,
        localId,
        localSectionId,
        localChapterId,
        localBookId,
        sourceText: data.sourceText as string,
        targetText: data.targetText as string,
        notes: data.notes as string | undefined,
        imageUrl: data.imageUrl as string | undefined,
      })
    }
  }
}

async function processProgressChange(
  userId: string,
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    // Learning progress doesn't have soft delete
    await serverDb
      .delete(schema.learningProgress)
      .where(
        and(
          eq(schema.learningProgress.userId, userId),
          eq(schema.learningProgress.localVocabularyId, localId)
        )
      )
  } else if (data) {
    const existing = await serverDb.query.learningProgress.findFirst({
      where: (progress, { eq, and }) =>
        and(
          eq(progress.userId, userId),
          eq(progress.localVocabularyId, data.vocabularyId as string)
        ),
    })

    if (existing) {
      await serverDb
        .update(schema.learningProgress)
        .set({
          easeFactor: String(data.easeFactor),
          interval: data.interval as number,
          repetitions: data.repetitions as number,
          nextReviewDate: new Date(data.nextReviewDate as string),
          totalReviews: data.totalReviews as number,
          correctReviews: data.correctReviews as number,
          lastReviewDate: data.lastReviewDate
            ? new Date(data.lastReviewDate as string)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.learningProgress.id, existing.id))
    } else {
      await serverDb.insert(schema.learningProgress).values({
        userId,
        localVocabularyId: data.vocabularyId as string,
        easeFactor: String(data.easeFactor),
        interval: data.interval as number,
        repetitions: data.repetitions as number,
        nextReviewDate: new Date(data.nextReviewDate as string),
        totalReviews: data.totalReviews as number,
        correctReviews: data.correctReviews as number,
        lastReviewDate: data.lastReviewDate
          ? new Date(data.lastReviewDate as string)
          : null,
      })
    }
  }
}
