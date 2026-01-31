import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { db } from '@/lib/db/db'
import { applyFullData, applyServerChanges } from '@/lib/sync/apply-changes'

describe('sync apply changes', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.close()
  })

  it('applies full data with unsorted vocabulary (null section/chapter)', async () => {
    const now = new Date()

    await applyFullData({
      books: [
        {
          id: 'server-book-1',
          localId: 'book-1',
          name: 'Book One',
          language: 'french',
          description: undefined,
          coverColor: '#000000',
          createdAt: now,
          updatedAt: now,
        },
      ],
      chapters: [],
      sections: [],
      vocabularyItems: [
        {
          id: 'server-vocab-1',
          localId: 'vocab-1',
          localSectionId: null,
          localChapterId: null,
          localBookId: 'book-1',
          sectionId: null,
          chapterId: null,
          bookId: 'server-book-1',
          sourceText: 'Haus',
          targetText: 'maison',
          notes: undefined,
          imageUrl: undefined,
          createdAt: now,
          updatedAt: now,
        },
      ],
      learningProgress: [],
      gamification: {},
      achievements: {},
      settings: {},
    })

    const items = await db.vocabularyItems.toArray()
    expect(items).toHaveLength(1)
    expect(items[0]?.sectionId).toBeNull()
    expect(items[0]?.chapterId).toBeNull()
    expect(items[0]?.bookId).toBe('book-1')
  })

  it('applies server changes with null section/chapter for vocab items', async () => {
    await applyServerChanges([
      {
        table: 'vocabularyItems',
        operation: 'create',
        localId: 'vocab-2',
        data: {
          id: 'vocab-2',
          sectionId: null,
          chapterId: null,
          bookId: 'book-2',
          sourceText: 'Hund',
          targetText: 'chien',
          notes: undefined,
          imageUrl: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        timestamp: Date.now(),
      },
    ])

    const items = await db.vocabularyItems.toArray()
    expect(items).toHaveLength(1)
    expect(items[0]?.sectionId).toBeNull()
    expect(items[0]?.chapterId).toBeNull()
    expect(items[0]?.bookId).toBe('book-2')
  })
})
