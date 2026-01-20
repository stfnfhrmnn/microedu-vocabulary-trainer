import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  db,
  createBook,
  updateBook,
  deleteBook,
  createChapter,
  updateChapter,
  deleteChapter,
  createSection,
  updateSection,
  deleteSection,
  createVocabularyItem,
  createVocabularyItems,
  updateVocabularyItem,
  deleteVocabularyItem,
  getOrCreateProgress,
  updateProgress,
  getVocabularyStats,
  getSettings,
  updateSettings,
} from '@/lib/db/db'

describe('Database Integration Tests', () => {
  // Clear database before each test
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.close()
  })

  describe('Book Operations', () => {
    it('should create a book', async () => {
      const book = await createBook({
        name: 'Französisch 1',
        language: 'french',
        description: 'Erstes Französisch Buch',
        coverColor: '#3b82f6',
      })

      expect(book.id).toBeDefined()
      expect(book.name).toBe('Französisch 1')
      expect(book.language).toBe('french')
      expect(book.createdAt).toBeInstanceOf(Date)

      // Verify in database
      const stored = await db.books.get(book.id)
      expect(stored).toBeDefined()
      expect(stored?.name).toBe('Französisch 1')
    })

    it('should update a book', async () => {
      const book = await createBook({
        name: 'Original Name',
        language: 'french',
        coverColor: '#3b82f6',
      })

      await updateBook(book.id, { name: 'Updated Name' })

      const updated = await db.books.get(book.id)
      expect(updated?.name).toBe('Updated Name')
    })

    it('should delete a book and cascade to related entities', async () => {
      // Create book with chapter, section, vocabulary, and progress
      const book = await createBook({
        name: 'To Delete',
        language: 'french',
        coverColor: '#3b82f6',
      })

      const chapter = await createChapter({
        name: 'Chapter 1',
        bookId: book.id,
        order: 0,
      })

      const section = await createSection({
        name: 'Section 1',
        chapterId: chapter.id,
        bookId: book.id,
        order: 0,
        coveredInClass: false,
      })

      const vocab = await createVocabularyItem({
        sourceText: 'das Haus',
        targetText: 'la maison',
        sectionId: section.id,
        chapterId: chapter.id,
        bookId: book.id,
      })

      await getOrCreateProgress(vocab.id)

      // Delete book
      await deleteBook(book.id)

      // Verify all related entities are deleted
      expect(await db.books.get(book.id)).toBeUndefined()
      expect(await db.chapters.get(chapter.id)).toBeUndefined()
      expect(await db.sections.get(section.id)).toBeUndefined()
      expect(await db.vocabularyItems.get(vocab.id)).toBeUndefined()
      expect(
        await db.learningProgress.where('vocabularyId').equals(vocab.id).first()
      ).toBeUndefined()
    })
  })

  describe('Chapter Operations', () => {
    let bookId: string

    beforeEach(async () => {
      const book = await createBook({
        name: 'Test Book',
        language: 'french',
        coverColor: '#3b82f6',
      })
      bookId = book.id
    })

    it('should create a chapter within a book', async () => {
      const chapter = await createChapter({
        name: 'Chapitre 1',
        bookId,
        order: 0,
      })

      expect(chapter.id).toBeDefined()
      expect(chapter.bookId).toBe(bookId)
      expect(chapter.name).toBe('Chapitre 1')
      expect(chapter.order).toBe(0)
    })

    it('should update a chapter', async () => {
      const chapter = await createChapter({
        name: 'Original',
        bookId,
        order: 0,
      })

      await updateChapter(chapter.id, { name: 'Updated' })

      const updated = await db.chapters.get(chapter.id)
      expect(updated?.name).toBe('Updated')
    })

    it('should delete a chapter and cascade', async () => {
      const chapter = await createChapter({
        name: 'To Delete',
        bookId,
        order: 0,
      })

      const section = await createSection({
        name: 'Section 1',
        chapterId: chapter.id,
        bookId,
        order: 0,
        coveredInClass: false,
      })

      const vocab = await createVocabularyItem({
        sourceText: 'Test',
        targetText: 'Test',
        sectionId: section.id,
        chapterId: chapter.id,
        bookId,
      })

      await deleteChapter(chapter.id)

      expect(await db.chapters.get(chapter.id)).toBeUndefined()
      expect(await db.sections.get(section.id)).toBeUndefined()
      expect(await db.vocabularyItems.get(vocab.id)).toBeUndefined()
    })
  })

  describe('Section Operations', () => {
    let bookId: string
    let chapterId: string

    beforeEach(async () => {
      const book = await createBook({
        name: 'Test Book',
        language: 'french',
        coverColor: '#3b82f6',
      })
      bookId = book.id

      const chapter = await createChapter({
        name: 'Test Chapter',
        bookId,
        order: 0,
      })
      chapterId = chapter.id
    })

    it('should create a section within a chapter', async () => {
      const section = await createSection({
        name: 'Section 1',
        chapterId,
        bookId,
        order: 0,
        coveredInClass: false,
      })

      expect(section.id).toBeDefined()
      expect(section.chapterId).toBe(chapterId)
      expect(section.bookId).toBe(bookId)
      expect(section.coveredInClass).toBe(false)
    })

    it('should update a section', async () => {
      const section = await createSection({
        name: 'Original',
        chapterId,
        bookId,
        order: 0,
        coveredInClass: false,
      })

      await updateSection(section.id, { coveredInClass: true })

      const updated = await db.sections.get(section.id)
      expect(updated?.coveredInClass).toBe(true)
    })

    it('should delete a section and cascade', async () => {
      const section = await createSection({
        name: 'To Delete',
        chapterId,
        bookId,
        order: 0,
        coveredInClass: false,
      })

      const vocab = await createVocabularyItem({
        sourceText: 'Test',
        targetText: 'Test',
        sectionId: section.id,
        chapterId,
        bookId,
      })

      await getOrCreateProgress(vocab.id)

      await deleteSection(section.id)

      expect(await db.sections.get(section.id)).toBeUndefined()
      expect(await db.vocabularyItems.get(vocab.id)).toBeUndefined()
    })
  })

  describe('Vocabulary Operations', () => {
    let bookId: string
    let chapterId: string
    let sectionId: string

    beforeEach(async () => {
      const book = await createBook({
        name: 'Test Book',
        language: 'french',
        coverColor: '#3b82f6',
      })
      bookId = book.id

      const chapter = await createChapter({
        name: 'Test Chapter',
        bookId,
        order: 0,
      })
      chapterId = chapter.id

      const section = await createSection({
        name: 'Test Section',
        chapterId,
        bookId,
        order: 0,
        coveredInClass: false,
      })
      sectionId = section.id
    })

    it('should create a vocabulary item', async () => {
      const vocab = await createVocabularyItem({
        sourceText: 'das Haus',
        targetText: 'la maison',
        sectionId,
        chapterId,
        bookId,
        notes: 'feminine noun',
      })

      expect(vocab.id).toBeDefined()
      expect(vocab.sourceText).toBe('das Haus')
      expect(vocab.targetText).toBe('la maison')
      expect(vocab.notes).toBe('feminine noun')
    })

    it('should create multiple vocabulary items at once', async () => {
      const items = await createVocabularyItems([
        {
          sourceText: 'das Haus',
          targetText: 'la maison',
          sectionId,
          chapterId,
          bookId,
        },
        {
          sourceText: 'der Hund',
          targetText: 'le chien',
          sectionId,
          chapterId,
          bookId,
        },
        {
          sourceText: 'die Katze',
          targetText: 'le chat',
          sectionId,
          chapterId,
          bookId,
        },
      ])

      expect(items).toHaveLength(3)
      expect(items[0].sourceText).toBe('das Haus')
      expect(items[1].sourceText).toBe('der Hund')
      expect(items[2].sourceText).toBe('die Katze')

      // Verify in database
      const stored = await db.vocabularyItems.where('sectionId').equals(sectionId).toArray()
      expect(stored).toHaveLength(3)
    })

    it('should update a vocabulary item', async () => {
      const vocab = await createVocabularyItem({
        sourceText: 'das Haus',
        targetText: 'la maison',
        sectionId,
        chapterId,
        bookId,
      })

      await updateVocabularyItem(vocab.id, { notes: 'Updated notes' })

      const updated = await db.vocabularyItems.get(vocab.id)
      expect(updated?.notes).toBe('Updated notes')
    })

    it('should delete a vocabulary item and its progress', async () => {
      const vocab = await createVocabularyItem({
        sourceText: 'das Haus',
        targetText: 'la maison',
        sectionId,
        chapterId,
        bookId,
      })

      await getOrCreateProgress(vocab.id)

      await deleteVocabularyItem(vocab.id)

      expect(await db.vocabularyItems.get(vocab.id)).toBeUndefined()
      expect(
        await db.learningProgress.where('vocabularyId').equals(vocab.id).first()
      ).toBeUndefined()
    })
  })

  describe('Learning Progress Operations', () => {
    let vocabId: string

    beforeEach(async () => {
      const book = await createBook({
        name: 'Test Book',
        language: 'french',
        coverColor: '#3b82f6',
      })

      const chapter = await createChapter({
        name: 'Test Chapter',
        bookId: book.id,
        order: 0,
      })

      const section = await createSection({
        name: 'Test Section',
        chapterId: chapter.id,
        bookId: book.id,
        order: 0,
        coveredInClass: false,
      })

      const vocab = await createVocabularyItem({
        sourceText: 'das Haus',
        targetText: 'la maison',
        sectionId: section.id,
        chapterId: chapter.id,
        bookId: book.id,
      })
      vocabId = vocab.id
    })

    it('should create progress on first access', async () => {
      const progress = await getOrCreateProgress(vocabId)

      expect(progress.id).toBeDefined()
      expect(progress.vocabularyId).toBe(vocabId)
      expect(progress.easeFactor).toBe(2.5)
      expect(progress.interval).toBe(0)
      expect(progress.repetitions).toBe(0)
      expect(progress.totalReviews).toBe(0)
    })

    it('should return existing progress on subsequent access', async () => {
      const progress1 = await getOrCreateProgress(vocabId)
      await updateProgress(progress1.id, { totalReviews: 5 })

      const progress2 = await getOrCreateProgress(vocabId)

      expect(progress2.id).toBe(progress1.id)
      expect(progress2.totalReviews).toBe(5)
    })

    it('should update progress', async () => {
      const progress = await getOrCreateProgress(vocabId)

      await updateProgress(progress.id, {
        easeFactor: 2.6,
        interval: 6,
        repetitions: 2,
        totalReviews: 3,
        correctReviews: 2,
      })

      const updated = await db.learningProgress.get(progress.id)
      expect(updated?.easeFactor).toBe(2.6)
      expect(updated?.interval).toBe(6)
      expect(updated?.repetitions).toBe(2)
      expect(updated?.totalReviews).toBe(3)
      expect(updated?.correctReviews).toBe(2)
    })
  })

  describe('Vocabulary Statistics', () => {
    let bookId: string
    let chapterId: string
    let sectionId: string

    beforeEach(async () => {
      const book = await createBook({
        name: 'Test Book',
        language: 'french',
        coverColor: '#3b82f6',
      })
      bookId = book.id

      const chapter = await createChapter({
        name: 'Test Chapter',
        bookId,
        order: 0,
      })
      chapterId = chapter.id

      const section = await createSection({
        name: 'Test Section',
        chapterId,
        bookId,
        order: 0,
        coveredInClass: false,
      })
      sectionId = section.id
    })

    it('should return correct stats for new vocabulary', async () => {
      await createVocabularyItems([
        { sourceText: 'Wort 1', targetText: 'Word 1', sectionId, chapterId, bookId },
        { sourceText: 'Wort 2', targetText: 'Word 2', sectionId, chapterId, bookId },
        { sourceText: 'Wort 3', targetText: 'Word 3', sectionId, chapterId, bookId },
      ])

      const stats = await getVocabularyStats()

      expect(stats.total).toBe(3)
      expect(stats.new).toBe(3)
      expect(stats.learning).toBe(0)
      expect(stats.mastered).toBe(0)
      expect(stats.dueToday).toBe(3) // New words are due
    })

    it('should categorize learning words correctly', async () => {
      const vocab = await createVocabularyItem({
        sourceText: 'das Haus',
        targetText: 'la maison',
        sectionId,
        chapterId,
        bookId,
      })

      const progress = await getOrCreateProgress(vocab.id)
      await updateProgress(progress.id, {
        interval: 6, // Learning (< 21 days)
        totalReviews: 2,
        nextReviewDate: new Date(), // Due today
      })

      const stats = await getVocabularyStats()

      expect(stats.learning).toBe(1)
      expect(stats.dueToday).toBe(1)
    })

    it('should categorize mastered words correctly', async () => {
      const vocab = await createVocabularyItem({
        sourceText: 'das Haus',
        targetText: 'la maison',
        sectionId,
        chapterId,
        bookId,
      })

      const progress = await getOrCreateProgress(vocab.id)

      // Set to mastered (interval >= 21) and not due
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      await updateProgress(progress.id, {
        interval: 30,
        totalReviews: 10,
        nextReviewDate: futureDate,
      })

      const stats = await getVocabularyStats()

      expect(stats.mastered).toBe(1)
      expect(stats.dueToday).toBe(0)
    })
  })

  describe('User Settings', () => {
    it('should return default settings on first access', async () => {
      const settings = await getSettings()

      expect(settings.id).toBe('settings')
      expect(settings.defaultDirection).toBe('sourceToTarget')
      expect(settings.defaultExerciseType).toBe('flashcard')
      expect(settings.typingStrictness).toBe('normal')
      expect(settings.ocrProvider).toBe('tesseract')
      expect(settings.soundEnabled).toBe(true)
    })

    it('should update settings', async () => {
      await getSettings() // Initialize
      await updateSettings({
        defaultDirection: 'targetToSource',
        soundEnabled: false,
      })

      const updated = await getSettings()

      expect(updated.defaultDirection).toBe('targetToSource')
      expect(updated.soundEnabled).toBe(false)
      // Unchanged values preserved
      expect(updated.defaultExerciseType).toBe('flashcard')
    })
  })
})
