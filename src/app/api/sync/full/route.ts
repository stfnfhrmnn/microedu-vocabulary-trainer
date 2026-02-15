import { NextResponse } from 'next/server'
import { serverDb } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all non-deleted books
    const books = await serverDb.query.books.findMany({
      where: (books, { eq, isNull, and }) =>
        and(eq(books.userId, user.userId), isNull(books.deletedAt)),
    })

    // Fetch all non-deleted chapters
    const chapters = await serverDb.query.chapters.findMany({
      where: (chapters, { eq, isNull, and }) =>
        and(eq(chapters.userId, user.userId), isNull(chapters.deletedAt)),
    })

    // Fetch all non-deleted sections
    const sections = await serverDb.query.sections.findMany({
      where: (sections, { eq, isNull, and }) =>
        and(eq(sections.userId, user.userId), isNull(sections.deletedAt)),
    })

    // Fetch all non-deleted vocabulary items
    const vocabularyItems = await serverDb.query.vocabularyItems.findMany({
      where: (items, { eq, isNull, and }) =>
        and(eq(items.userId, user.userId), isNull(items.deletedAt)),
    })

    // Fetch all learning progress
    const learningProgress = await serverDb.query.learningProgress.findMany({
      where: (progress, { eq }) => eq(progress.userId, user.userId),
    })

    // Fetch user data (gamification, achievements, settings)
    const userData = await serverDb.query.userData.findFirst({
      where: (data, { eq }) => eq(data.userId, user.userId),
    })

    return NextResponse.json({
      success: true,
      books: books.map((b) => ({
        localId: b.localId,
        name: b.name,
        language: b.language,
        description: b.description,
        coverColor: b.coverColor,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      chapters: chapters.map((c) => ({
        localId: c.localId,
        localBookId: c.localBookId,
        name: c.name,
        order: c.order,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      sections: sections.map((s) => ({
        localId: s.localId,
        localChapterId: s.localChapterId,
        localBookId: s.localBookId,
        name: s.name,
        order: s.order,
        coveredInClass: s.coveredInClass === 1,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      vocabularyItems: vocabularyItems.map((v) => ({
        localId: v.localId,
        localSectionId: v.localSectionId ?? null,
        localChapterId: v.localChapterId ?? null,
        localBookId: v.localBookId,
        sourceText: v.sourceText,
        targetText: v.targetText,
        notes: v.notes,
        imageUrl: v.imageUrl,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      learningProgress: learningProgress.map((p) => ({
        id: p.id,
        localVocabularyId: p.localVocabularyId,
        easeFactor: parseFloat(p.easeFactor || '2.5'),
        interval: p.interval,
        repetitions: p.repetitions,
        nextReviewDate: p.nextReviewDate,
        totalReviews: p.totalReviews,
        correctReviews: p.correctReviews,
        lastReviewDate: p.lastReviewDate,
      })),
      gamification: userData?.gamification || {},
      achievements: userData?.achievements || {},
      settings: userData?.settings || {},
      serverTime: Date.now(),
    })
  } catch (error) {
    console.error('Full sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
