import { NextResponse } from 'next/server'
import { gt, eq, and, or, isNull } from 'drizzle-orm'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get 'since' timestamp from query params
    const url = new URL(request.url)
    const since = parseInt(url.searchParams.get('since') || '0', 10)
    const sinceDate = new Date(since)

    // Build changes array from all tables
    const changes: Array<{
      table: string
      operation: 'create' | 'update' | 'delete'
      localId: string
      data: Record<string, unknown> | null
      timestamp: number
    }> = []

    // Fetch books changed since timestamp
    const books = await serverDb.query.books.findMany({
      where: (books, { eq, gt, and, or }) =>
        and(
          eq(books.userId, user.userId),
          or(gt(books.updatedAt, sinceDate), gt(books.deletedAt, sinceDate))
        ),
    })

    for (const book of books) {
      const isDeleted = book.deletedAt !== null
      changes.push({
        table: 'books',
        operation: isDeleted ? 'delete' : 'update',
        localId: book.localId,
        data: isDeleted
          ? null
          : {
              id: book.localId,
              name: book.name,
              language: book.language,
              description: book.description,
              coverColor: book.coverColor,
              createdAt: book.createdAt,
              updatedAt: book.updatedAt,
            },
        timestamp: (isDeleted ? book.deletedAt : book.updatedAt)?.getTime() || Date.now(),
      })
    }

    // Fetch chapters changed since timestamp
    const chapters = await serverDb.query.chapters.findMany({
      where: (chapters, { eq, gt, and, or }) =>
        and(
          eq(chapters.userId, user.userId),
          or(gt(chapters.updatedAt, sinceDate), gt(chapters.deletedAt, sinceDate))
        ),
    })

    for (const chapter of chapters) {
      const isDeleted = chapter.deletedAt !== null
      changes.push({
        table: 'chapters',
        operation: isDeleted ? 'delete' : 'update',
        localId: chapter.localId,
        data: isDeleted
          ? null
          : {
              id: chapter.localId,
              bookId: chapter.localBookId,
              name: chapter.name,
              order: chapter.order,
              createdAt: chapter.createdAt,
              updatedAt: chapter.updatedAt,
            },
        timestamp: (isDeleted ? chapter.deletedAt : chapter.updatedAt)?.getTime() || Date.now(),
      })
    }

    // Fetch sections changed since timestamp
    const sections = await serverDb.query.sections.findMany({
      where: (sections, { eq, gt, and, or }) =>
        and(
          eq(sections.userId, user.userId),
          or(gt(sections.updatedAt, sinceDate), gt(sections.deletedAt, sinceDate))
        ),
    })

    for (const section of sections) {
      const isDeleted = section.deletedAt !== null
      changes.push({
        table: 'sections',
        operation: isDeleted ? 'delete' : 'update',
        localId: section.localId,
        data: isDeleted
          ? null
          : {
              id: section.localId,
              chapterId: section.localChapterId,
              bookId: section.localBookId,
              name: section.name,
              order: section.order,
              coveredInClass: section.coveredInClass === 1,
              createdAt: section.createdAt,
              updatedAt: section.updatedAt,
            },
        timestamp: (isDeleted ? section.deletedAt : section.updatedAt)?.getTime() || Date.now(),
      })
    }

    // Fetch vocabulary items changed since timestamp
    const vocabularyItems = await serverDb.query.vocabularyItems.findMany({
      where: (items, { eq, gt, and, or }) =>
        and(
          eq(items.userId, user.userId),
          or(gt(items.updatedAt, sinceDate), gt(items.deletedAt, sinceDate))
        ),
    })

    for (const item of vocabularyItems) {
      const isDeleted = item.deletedAt !== null
      changes.push({
        table: 'vocabularyItems',
        operation: isDeleted ? 'delete' : 'update',
        localId: item.localId,
        data: isDeleted
          ? null
          : {
              id: item.localId,
              sectionId: item.localSectionId ?? null,
              chapterId: item.localChapterId ?? null,
              bookId: item.localBookId,
              sourceText: item.sourceText,
              targetText: item.targetText,
              notes: item.notes,
              imageUrl: item.imageUrl,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            },
        timestamp: (isDeleted ? item.deletedAt : item.updatedAt)?.getTime() || Date.now(),
      })
    }

    // Fetch learning progress changed since timestamp
    const progress = await serverDb.query.learningProgress.findMany({
      where: (progress, { eq, gt, and }) =>
        and(eq(progress.userId, user.userId), gt(progress.updatedAt, sinceDate)),
    })

    for (const p of progress) {
      changes.push({
        table: 'learningProgress',
        operation: 'update',
        localId: p.localVocabularyId,
        data: {
          id: p.id,
          vocabularyId: p.localVocabularyId,
          easeFactor: parseFloat(p.easeFactor || '2.5'),
          interval: p.interval,
          repetitions: p.repetitions,
          nextReviewDate: p.nextReviewDate,
          totalReviews: p.totalReviews,
          correctReviews: p.correctReviews,
          lastReviewDate: p.lastReviewDate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
        timestamp: p.updatedAt?.getTime() || Date.now(),
      })
    }

    // Sort changes by timestamp
    changes.sort((a, b) => a.timestamp - b.timestamp)

    return NextResponse.json({
      success: true,
      changes,
      serverTime: Date.now(),
    })
  } catch (error) {
    console.error('Pull error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
