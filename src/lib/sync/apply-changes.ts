/**
 * Data application logic for sync operations
 * Handles applying server changes to local IndexedDB
 */

import { db } from '@/lib/db/db'
import type {
  Book,
  Chapter,
  Section,
  VocabularyItem,
  LearningProgress,
} from '@/lib/db/schema'
import type { SyncChange } from './sync-queue'

export interface ServerData {
  books: Array<Book & { localId: string }>
  chapters: Array<Chapter & { localId: string; localBookId: string }>
  sections: Array<Section & { localId: string; localChapterId: string; localBookId: string }>
  vocabularyItems: Array<
    VocabularyItem & {
      localId: string
      localSectionId: string
      localChapterId: string
      localBookId: string
    }
  >
  learningProgress: Array<LearningProgress & { localVocabularyId: string }>
  gamification: Record<string, unknown>
  achievements: Record<string, unknown>
  settings: Record<string, unknown>
}

/**
 * Apply incremental changes from server to IndexedDB
 */
export async function applyServerChanges(changes: SyncChange[]): Promise<void> {
  for (const change of changes) {
    try {
      await applyChange(change)
    } catch (error) {
      console.error(`Failed to apply change:`, change, error)
    }
  }
}

/**
 * Apply a single change to IndexedDB
 */
async function applyChange(change: SyncChange): Promise<void> {
  const { table, operation, localId, data } = change

  switch (table) {
    case 'books':
      await applyBookChange(operation, localId, data)
      break
    case 'chapters':
      await applyChapterChange(operation, localId, data)
      break
    case 'sections':
      await applySectionChange(operation, localId, data)
      break
    case 'vocabularyItems':
      await applyVocabularyChange(operation, localId, data)
      break
    case 'learningProgress':
      await applyProgressChange(operation, localId, data)
      break
  }
}

async function applyBookChange(
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await db.books.delete(localId)
  } else if (data) {
    const existing = await db.books.get(localId)
    if (existing) {
      await db.books.update(localId, data as Partial<Book>)
    } else {
      await db.books.add({ ...data, id: localId } as Book)
    }
  }
}

async function applyChapterChange(
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await db.chapters.delete(localId)
  } else if (data) {
    const existing = await db.chapters.get(localId)
    if (existing) {
      await db.chapters.update(localId, data as Partial<Chapter>)
    } else {
      await db.chapters.add({ ...data, id: localId } as Chapter)
    }
  }
}

async function applySectionChange(
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await db.sections.delete(localId)
  } else if (data) {
    const existing = await db.sections.get(localId)
    if (existing) {
      await db.sections.update(localId, data as Partial<Section>)
    } else {
      await db.sections.add({ ...data, id: localId } as Section)
    }
  }
}

async function applyVocabularyChange(
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await db.vocabularyItems.delete(localId)
  } else if (data) {
    const existing = await db.vocabularyItems.get(localId)
    if (existing) {
      await db.vocabularyItems.update(localId, data as Partial<VocabularyItem>)
    } else {
      await db.vocabularyItems.add({ ...data, id: localId } as VocabularyItem)
    }
  }
}

async function applyProgressChange(
  operation: string,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  if (operation === 'delete') {
    await db.learningProgress.delete(localId)
  } else if (data) {
    const existing = await db.learningProgress.get(localId)
    if (existing) {
      await db.learningProgress.update(localId, data as Partial<LearningProgress>)
    } else {
      await db.learningProgress.add({ ...data, id: localId } as LearningProgress)
    }
  }
}

/**
 * Apply full data dump to IndexedDB (for new device)
 */
export async function applyFullData(data: ServerData): Promise<void> {
  await db.transaction(
    'rw',
    [db.books, db.chapters, db.sections, db.vocabularyItems, db.learningProgress],
    async () => {
      await applyBooks(data.books)
      await applyChapters(data.chapters)
      await applySections(data.sections)
      await applyVocabularyItems(data.vocabularyItems)
      await applyLearningProgress(data.learningProgress)
    }
  )
}

async function applyBooks(books: ServerData['books']): Promise<void> {
  for (const book of books) {
    const existing = await db.books.get(book.localId)
    if (!existing) {
      await db.books.add({
        id: book.localId,
        name: book.name,
        language: book.language as 'french' | 'spanish' | 'latin',
        description: book.description,
        coverColor: book.coverColor,
        createdAt: new Date(book.createdAt),
        updatedAt: new Date(book.updatedAt),
      })
    }
  }
}

async function applyChapters(chapters: ServerData['chapters']): Promise<void> {
  for (const chapter of chapters) {
    const existing = await db.chapters.get(chapter.localId)
    if (!existing) {
      await db.chapters.add({
        id: chapter.localId,
        bookId: chapter.localBookId,
        name: chapter.name,
        order: chapter.order,
        createdAt: new Date(chapter.createdAt),
        updatedAt: new Date(chapter.updatedAt),
      })
    }
  }
}

async function applySections(sections: ServerData['sections']): Promise<void> {
  for (const section of sections) {
    const existing = await db.sections.get(section.localId)
    if (!existing) {
      await db.sections.add({
        id: section.localId,
        chapterId: section.localChapterId,
        bookId: section.localBookId,
        name: section.name,
        order: section.order,
        coveredInClass: section.coveredInClass,
        createdAt: new Date(section.createdAt),
        updatedAt: new Date(section.updatedAt),
      })
    }
  }
}

async function applyVocabularyItems(items: ServerData['vocabularyItems']): Promise<void> {
  for (const item of items) {
    const existing = await db.vocabularyItems.get(item.localId)
    if (!existing) {
      await db.vocabularyItems.add({
        id: item.localId,
        sectionId: item.localSectionId,
        chapterId: item.localChapterId,
        bookId: item.localBookId,
        sourceText: item.sourceText,
        targetText: item.targetText,
        notes: item.notes,
        imageUrl: item.imageUrl,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })
    }
  }
}

async function applyLearningProgress(progressItems: ServerData['learningProgress']): Promise<void> {
  for (const progress of progressItems) {
    const existing = await db.learningProgress
      .where('vocabularyId')
      .equals(progress.localVocabularyId)
      .first()
    if (!existing) {
      await db.learningProgress.add({
        id: progress.id,
        vocabularyId: progress.localVocabularyId,
        easeFactor: Number(progress.easeFactor),
        interval: progress.interval,
        repetitions: progress.repetitions,
        nextReviewDate: new Date(progress.nextReviewDate),
        totalReviews: progress.totalReviews,
        correctReviews: progress.correctReviews,
        lastReviewDate: progress.lastReviewDate
          ? new Date(progress.lastReviewDate)
          : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }
}
