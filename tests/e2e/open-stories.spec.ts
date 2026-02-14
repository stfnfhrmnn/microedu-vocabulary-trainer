import { expect, test, type Page } from '@playwright/test'

async function seedPracticeData(
  page: Page,
  options: { includeSecondBook?: boolean } = {}
) {
  await page.goto('/login')

  await page.evaluate(async ({ includeSecondBook }) => {
    const DB_NAME = 'VocabularyTrainer'
    const DB_VERSION = 4
    const now = new Date()

    const stores: Record<string, string[]> = {
      books: ['name', 'language', 'createdAt'],
      chapters: ['bookId', 'name', 'order', 'createdAt'],
      sections: ['chapterId', 'bookId', 'name', 'order', 'coveredInClass', 'createdAt'],
      vocabularyItems: [
        'sectionId',
        'chapterId',
        'bookId',
        'sourceText',
        'targetText',
        'createdAt',
      ],
      learningProgress: ['vocabularyId', 'nextReviewDate', 'interval'],
      reviewSessions: ['exerciseType', 'startedAt', 'completedAt'],
      reviewAttempts: ['sessionId', 'vocabularyId', 'createdAt'],
      userSettings: [],
      cachedImages: ['vocabularyId', 'createdAt'],
      familyGroups: ['inviteCode', 'createdBy', 'createdAt'],
      familyMembers: ['familyId', 'userId', 'role', 'joinedAt'],
      sharedBooks: ['bookId', 'sharedBy', 'groupId', 'sharedAt'],
      progressShareSettings: ['userId', 'sharedWithId', 'updatedAt'],
      networks: ['inviteCode', 'ownerId', 'type', 'createdAt'],
      networkMembers: ['networkId', 'userId', 'role', 'joinedAt'],
      competitionStats: ['userId', 'periodType', 'periodStart', 'updatedAt'],
      networkSharedBooks: ['bookId', 'ownerId', 'networkId', 'sharedAt'],
      bookCopies: ['originalBookId', 'copiedBookId', 'copiedBy', 'copiedAt'],
      userBlocks: ['blockerId', 'blockedId', 'createdAt'],
      contentReports: ['reporterId', 'reportedUserId', 'networkId', 'status', 'createdAt'],
      deletionRequests: ['userId', 'itemType', 'itemId', 'status', 'createdAt'],
    }

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve()
    })

    await new Promise<void>((resolve, reject) => {
      const openReq = indexedDB.open(DB_NAME, DB_VERSION)

      openReq.onupgradeneeded = () => {
        const db = openReq.result
        Object.entries(stores).forEach(([storeName, indexes]) => {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })
          indexes.forEach((indexName) => {
            if (!store.indexNames.contains(indexName)) {
              store.createIndex(indexName, indexName, { unique: false })
            }
          })
        })
      }

      openReq.onerror = () => reject(openReq.error)

      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(
          ['books', 'chapters', 'sections', 'vocabularyItems', 'learningProgress'],
          'readwrite'
        )

        const books = tx.objectStore('books')
        const chapters = tx.objectStore('chapters')
        const sections = tx.objectStore('sections')
        const vocab = tx.objectStore('vocabularyItems')
        const progress = tx.objectStore('learningProgress')

        books.add({
          id: 'book-alpha',
          name: 'Alpha',
          language: 'french',
          description: null,
          coverColor: '#3b82f6',
          createdAt: now,
          updatedAt: now,
        })
        chapters.add({
          id: 'chapter-alpha',
          bookId: 'book-alpha',
          name: 'Kapitel A',
          order: 0,
          createdAt: now,
          updatedAt: now,
        })
        sections.add({
          id: 'section-alpha',
          chapterId: 'chapter-alpha',
          bookId: 'book-alpha',
          name: 'Abschnitt A',
          order: 0,
          coveredInClass: false,
          createdAt: now,
          updatedAt: now,
        })
        vocab.add({
          id: 'vocab-hard',
          sectionId: 'section-alpha',
          chapterId: 'chapter-alpha',
          bookId: 'book-alpha',
          sourceText: 'das Haus',
          targetText: 'la maison',
          notes: null,
          imageUrl: null,
          createdAt: now,
          updatedAt: now,
        })
        progress.add({
          id: 'progress-hard',
          vocabularyId: 'vocab-hard',
          easeFactor: 2.1,
          interval: 2,
          repetitions: 1,
          nextReviewDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          totalReviews: 6,
          correctReviews: 1,
          createdAt: now,
          updatedAt: now,
        })

        if (includeSecondBook) {
          books.add({
            id: 'book-beta',
            name: 'Beta',
            language: 'spanish',
            description: null,
            coverColor: '#22c55e',
            createdAt: now,
            updatedAt: now,
          })
          chapters.add({
            id: 'chapter-beta',
            bookId: 'book-beta',
            name: 'Kapitel B',
            order: 0,
            createdAt: now,
            updatedAt: now,
          })
          sections.add({
            id: 'section-beta',
            chapterId: 'chapter-beta',
            bookId: 'book-beta',
            name: 'Abschnitt B',
            order: 0,
            coveredInClass: false,
            createdAt: now,
            updatedAt: now,
          })
          vocab.add({
            id: 'vocab-beta',
            sectionId: 'section-beta',
            chapterId: 'chapter-beta',
            bookId: 'book-beta',
            sourceText: 'die Tür',
            targetText: 'la puerta',
            notes: null,
            imageUrl: null,
            createdAt: now,
            updatedAt: now,
          })
        }

        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      }
    })
  }, options)
}

test('network list shows actionable auth recovery', async ({ page }) => {
  await page.goto('/networks')

  await expect(page.getByText('Bitte melde dich an, um Netzwerke zu laden.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Erneut versuchen' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Zum Login' })).toBeVisible()

  await page.getByRole('button', { name: 'Zum Login' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('practice setup accepts difficult-scope deep link', async ({ page }) => {
  await seedPracticeData(page)

  await page.goto('/practice?scope=difficult')

  await expect(page.getByText('Wortauswahl')).toBeVisible()
  await expect(page.getByRole('button', { name: /Schwierige Vokabeln/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /1 Vokabel üben/i })).toBeVisible()
})

test('practice setup prefilters sections via bookId deep link', async ({ page }) => {
  await seedPracticeData(page, { includeSecondBook: true })

  await page.goto('/practice?mode=free&bookId=book-alpha')

  await expect(page.getByText('1 von 2')).toBeVisible()
  await expect(page.getByRole('button', { name: /1 Vokabel üben/i })).toBeVisible()
})
