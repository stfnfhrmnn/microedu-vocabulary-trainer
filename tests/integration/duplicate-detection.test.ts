import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  db,
  createBook,
  createChapter,
  createSection,
  createVocabularyItem,
  createVocabularyItems,
} from '@/lib/db/db'
import {
  checkDuplicate,
  checkDuplicates,
  annotateCandidatesWithDuplicates,
} from '@/lib/services/duplicate-detection'

describe('Duplicate Detection Integration Tests', () => {
  let bookId: string
  let chapterId: string
  let sectionId: string

  beforeEach(async () => {
    await db.delete()
    await db.open()

    // Create test data structure
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

    // Add some existing vocabulary
    await createVocabularyItems([
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
  })

  afterEach(async () => {
    await db.close()
  })

  describe('checkDuplicate', () => {
    describe('exact matches', () => {
      it('should detect exact duplicate', async () => {
        const result = await checkDuplicate('das Haus', 'la maison', bookId)

        expect(result.isDuplicate).toBe(true)
        expect(result.similarity).toBe(1)
        expect(result.duplicateOf?.sourceText).toBe('das Haus')
      })

      it('should detect exact source match even with different target', async () => {
        const result = await checkDuplicate('das Haus', 'une maison', bookId)

        expect(result.isDuplicate).toBe(true)
        expect(result.duplicateOf?.sourceText).toBe('das Haus')
      })
    })

    describe('case insensitivity', () => {
      it('should detect duplicate with different case', async () => {
        const result = await checkDuplicate('Das Haus', 'La Maison', bookId)

        expect(result.isDuplicate).toBe(true)
        expect(result.similarity).toBe(1)
      })

      it('should detect duplicate with all uppercase', async () => {
        const result = await checkDuplicate('DAS HAUS', 'LA MAISON', bookId)

        expect(result.isDuplicate).toBe(true)
        expect(result.similarity).toBe(1)
      })
    })

    describe('article handling', () => {
      it('should ignore German articles when comparing', async () => {
        const result = await checkDuplicate('Haus', 'maison', bookId)

        expect(result.isDuplicate).toBe(true)
        expect(result.similarity).toBe(1)
      })

      it('should match "der Hund" with "Hund"', async () => {
        const result = await checkDuplicate('Hund', 'le chien', bookId)

        expect(result.isDuplicate).toBe(true)
      })

      it('should match "die Katze" with just "Katze"', async () => {
        const result = await checkDuplicate('Katze', 'chat', bookId)

        expect(result.isDuplicate).toBe(true)
      })
    })

    describe('similarity threshold', () => {
      it('should detect high similarity as duplicate', async () => {
        // "Hause" is very similar to "Haus"
        const result = await checkDuplicate('das Hause', 'la maison', bookId)

        expect(result.isDuplicate).toBe(true)
        expect(result.similarity).toBeGreaterThanOrEqual(0.9)
      })

      it('should not flag low similarity as duplicate', async () => {
        const result = await checkDuplicate('das Auto', 'la voiture', bookId)

        expect(result.isDuplicate).toBe(false)
        expect(result.similarity).toBeLessThan(0.9)
      })

      it('should respect custom similarity threshold', async () => {
        // Use a very low threshold
        const result = await checkDuplicate('das Baum', 'la arbre', bookId, 0.5)

        // With low threshold, might match something
        // But "Baum" vs "Haus/Hund/Katze" shouldn't match even at 0.5
        expect(result.isDuplicate).toBe(false)
      })
    })

    describe('whitespace handling', () => {
      it('should handle extra whitespace in source', async () => {
        const result = await checkDuplicate('  das Haus  ', 'la maison', bookId)

        expect(result.isDuplicate).toBe(true)
      })

      it('should handle extra whitespace in target', async () => {
        const result = await checkDuplicate('das Haus', '  la maison  ', bookId)

        expect(result.isDuplicate).toBe(true)
      })
    })

    describe('empty book', () => {
      it('should return not duplicate for empty book', async () => {
        // Create a new empty book
        const emptyBook = await createBook({
          name: 'Empty Book',
          language: 'spanish',
          coverColor: '#10b981',
        })

        const result = await checkDuplicate('das Haus', 'la casa', emptyBook.id)

        expect(result.isDuplicate).toBe(false)
        expect(result.similarity).toBe(0)
      })
    })
  })

  describe('checkDuplicates (batch)', () => {
    it('should check multiple candidates efficiently', async () => {
      const candidates = [
        { sourceText: 'das Haus', targetText: 'la maison' },
        { sourceText: 'das Auto', targetText: 'la voiture' },
        { sourceText: 'der Hund', targetText: 'le chien' },
        { sourceText: 'der Vogel', targetText: 'loiseau' },
      ]

      const results = await checkDuplicates(candidates, bookId)

      // Index 0 (das Haus) and index 2 (der Hund) should be duplicates
      expect(results.has(0)).toBe(true)
      expect(results.has(1)).toBe(false)
      expect(results.has(2)).toBe(true)
      expect(results.has(3)).toBe(false)

      expect(results.get(0)?.isDuplicate).toBe(true)
      expect(results.get(2)?.isDuplicate).toBe(true)
    })

    it('should return empty map when no duplicates', async () => {
      const candidates = [
        { sourceText: 'das Auto', targetText: 'la voiture' },
        { sourceText: 'der Vogel', targetText: 'loiseau' },
      ]

      const results = await checkDuplicates(candidates, bookId)

      expect(results.size).toBe(0)
    })

    it('should handle empty candidates array', async () => {
      const results = await checkDuplicates([], bookId)

      expect(results.size).toBe(0)
    })
  })

  describe('annotateCandidatesWithDuplicates', () => {
    it('should annotate candidates with duplicate info', async () => {
      const candidates = [
        { sourceText: 'das Haus', targetText: 'la maison', confidence: 0.95 },
        { sourceText: 'das Auto', targetText: 'la voiture', confidence: 0.9 },
        { sourceText: 'der Hund', targetText: 'le chien', confidence: 0.85 },
      ]

      const annotated = await annotateCandidatesWithDuplicates(candidates, bookId)

      expect(annotated).toHaveLength(3)

      // First item (das Haus) should be marked as duplicate
      expect(annotated[0].sourceText).toBe('das Haus')
      expect(annotated[0].confidence).toBe(0.95)
      expect(annotated[0].duplicate?.isDuplicate).toBe(true)

      // Second item (das Auto) should not be a duplicate
      expect(annotated[1].sourceText).toBe('das Auto')
      expect(annotated[1].duplicate).toBeUndefined()

      // Third item (der Hund) should be marked as duplicate
      expect(annotated[2].sourceText).toBe('der Hund')
      expect(annotated[2].duplicate?.isDuplicate).toBe(true)
    })

    it('should preserve all candidate fields', async () => {
      const candidates = [
        {
          sourceText: 'das Fenster',
          targetText: 'la fenetre',
          confidence: 0.9,
          notes: 'test note',
        },
      ]

      const annotated = await annotateCandidatesWithDuplicates(candidates, bookId)

      expect(annotated[0].sourceText).toBe('das Fenster')
      expect(annotated[0].targetText).toBe('la fenetre')
      expect(annotated[0].confidence).toBe(0.9)
      expect(annotated[0].notes).toBe('test note')
    })
  })

  describe('edge cases', () => {
    it('should handle special characters', async () => {
      // Add vocabulary with special characters
      await createVocabularyItem({
        sourceText: 'loeuf',
        targetText: 'das Ei',
        sectionId,
        chapterId,
        bookId,
      })

      const result = await checkDuplicate('loeuf', 'das Ei', bookId)

      expect(result.isDuplicate).toBe(true)
    })

    it('should handle German umlauts', async () => {
      await createVocabularyItem({
        sourceText: 'schön',
        targetText: 'beau',
        sectionId,
        chapterId,
        bookId,
      })

      const result = await checkDuplicate('schön', 'beau', bookId)

      expect(result.isDuplicate).toBe(true)
    })

    it('should handle punctuation in vocabulary', async () => {
      await createVocabularyItem({
        sourceText: 'Wie gehts?',
        targetText: 'Comment allez-vous?',
        sectionId,
        chapterId,
        bookId,
      })

      // Check without punctuation
      const result = await checkDuplicate('Wie gehts', 'Comment allez-vous', bookId)

      expect(result.isDuplicate).toBe(true)
    })

    it('should handle phrases with multiple words', async () => {
      await createVocabularyItem({
        sourceText: 'guten Morgen',
        targetText: 'bonjour',
        sectionId,
        chapterId,
        bookId,
      })

      const result = await checkDuplicate('guten Morgen', 'bonjour', bookId)

      expect(result.isDuplicate).toBe(true)
    })
  })
})
