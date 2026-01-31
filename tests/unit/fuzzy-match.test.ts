import { describe, it, expect } from 'vitest'
import {
  levenshteinDistance,
  normalizeText,
  checkAnswer,
  highlightDifferences,
  hasAccentMismatchOnly,
  type StrictnessLevel,
} from '@/lib/learning/fuzzy-match'

describe('Fuzzy Matching', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0)
    })

    it('should return string length for empty comparison', () => {
      expect(levenshteinDistance('hello', '')).toBe(5)
      expect(levenshteinDistance('', 'world')).toBe(5)
    })

    it('should return 0 for two empty strings', () => {
      expect(levenshteinDistance('', '')).toBe(0)
    })

    it('should calculate distance for single character difference', () => {
      expect(levenshteinDistance('cat', 'bat')).toBe(1) // substitution
      expect(levenshteinDistance('cat', 'cats')).toBe(1) // insertion
      expect(levenshteinDistance('cats', 'cat')).toBe(1) // deletion
    })

    it('should calculate distance for multiple differences', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
      expect(levenshteinDistance('flaw', 'lawn')).toBe(2)
    })

    it('should handle German vocabulary with umlauts', () => {
      // 'Haus' -> 'Häuser' = substitute a->ä, insert e, insert r = 3
      expect(levenshteinDistance('Haus', 'Häuser')).toBe(3)
      expect(levenshteinDistance('schön', 'schon')).toBe(1)
    })
  })

  describe('normalizeText', () => {
    it('should convert to lowercase', () => {
      expect(normalizeText('HELLO')).toBe('hello')
      expect(normalizeText('HeLLo WoRLd')).toBe('hello world')
    })

    it('should trim whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello')
      expect(normalizeText('\thello\n')).toBe('hello')
    })

    it('should collapse multiple spaces', () => {
      expect(normalizeText('hello    world')).toBe('hello world')
      expect(normalizeText('das   Haus')).toBe('das haus')
    })

    it('should preserve diacritics by default', () => {
      expect(normalizeText('café')).toBe('café')
      expect(normalizeText('ÜBER')).toBe('über')
      expect(normalizeText('naïve')).toBe('naïve')
    })

    it('should remove diacritics when requested', () => {
      expect(normalizeText('café', true)).toBe('cafe')
      expect(normalizeText('über', true)).toBe('uber')
      expect(normalizeText('naïve', true)).toBe('naive')
      expect(normalizeText('résumé', true)).toBe('resume')
    })

    it('should handle German special characters', () => {
      expect(normalizeText('schön', true)).toBe('schon')
      expect(normalizeText('größe', true)).toBe('große') // ß stays, ö -> o
      expect(normalizeText('mädchen', true)).toBe('madchen')
    })
  })

  describe('checkAnswer', () => {
    describe('exact matches', () => {
      it('should accept exact match', () => {
        const result = checkAnswer('Haus', 'Haus')
        expect(result.isCorrect).toBe(true)
        expect(result.similarity).toBe(1)
        expect(result.distance).toBe(0)
      })

      it('should be case insensitive', () => {
        const result = checkAnswer('Haus', 'haus')
        expect(result.isCorrect).toBe(true)
        expect(result.similarity).toBe(1)
      })

      it('should handle whitespace variations', () => {
        const result = checkAnswer('das Haus', '  das   haus  ')
        expect(result.isCorrect).toBe(true)
      })
    })

    describe('strict mode', () => {
      it('should require exact diacritics in strict mode', () => {
        const result = checkAnswer('café', 'cafe', 'strict')
        expect(result.isCorrect).toBe(false)
      })

      it('should accept perfect match with diacritics in strict mode', () => {
        const result = checkAnswer('café', 'café', 'strict')
        expect(result.isCorrect).toBe(true)
      })

      it('should reject any typos in strict mode', () => {
        const result = checkAnswer('Haus', 'Hous', 'strict')
        expect(result.isCorrect).toBe(false)
      })
    })

    describe('normal mode (default)', () => {
      it('should accept small typos (up to ~15% error)', () => {
        // "bonjour" has 7 chars, 1 error = 86% similarity (above 85% threshold)
        const result = checkAnswer('bonjour', 'bonjoure', 'normal')
        expect(result.isCorrect).toBe(true)
        expect(result.similarity).toBeGreaterThanOrEqual(0.85)
      })

      it('should accept diacritic variations in normal mode', () => {
        const result = checkAnswer('café', 'cafe', 'normal')
        expect(result.isCorrect).toBe(true)
      })

      it('should reject large errors', () => {
        const result = checkAnswer('maison', 'maizn', 'normal')
        expect(result.isCorrect).toBe(false)
      })
    })

    describe('lenient mode', () => {
      it('should accept larger typos (up to ~30% error)', () => {
        // "bonjour" has 7 chars, 2 errors = 71% similarity
        const result = checkAnswer('bonjour', 'bonjur', 'lenient')
        expect(result.isCorrect).toBe(true)
      })

      it('should still reject very wrong answers', () => {
        const result = checkAnswer('maison', 'voiture', 'lenient')
        expect(result.isCorrect).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle empty expected string', () => {
        const result = checkAnswer('', '')
        expect(result.isCorrect).toBe(true)
        expect(result.similarity).toBe(1)
      })

      it('should handle empty actual string against non-empty expected', () => {
        const result = checkAnswer('Haus', '')
        expect(result.isCorrect).toBe(false)
        expect(result.similarity).toBe(0)
      })

      it('should return normalized strings in result', () => {
        const result = checkAnswer('  HAUS  ', 'haus')
        expect(result.normalizedExpected).toBe('haus')
        expect(result.normalizedActual).toBe('haus')
      })
    })

    describe('realistic vocabulary scenarios', () => {
      it('should handle German-French vocabulary', () => {
        expect(checkAnswer('la maison', 'la maison').isCorrect).toBe(true)
        // 'la maison' -> 'la maisone' - one extra char, should be above 85%
        expect(checkAnswer('la maison', 'la maisone').isCorrect).toBe(true) // typo
        // Using lenient mode for larger typos
        expect(checkAnswer('le chien', 'le chein', 'lenient').isCorrect).toBe(true) // typo
      })

      it('should handle German-Spanish vocabulary', () => {
        expect(checkAnswer('la casa', 'la casa').isCorrect).toBe(true)
        expect(checkAnswer('el perro', 'el pero').isCorrect).toBe(true) // typo
      })

      it('should handle Latin vocabulary', () => {
        expect(checkAnswer('domus', 'domus').isCorrect).toBe(true)
        expect(checkAnswer('agricola', 'agricolla').isCorrect).toBe(true) // typo
      })
    })
  })

  describe('highlightDifferences', () => {
    it('should return original string when identical', () => {
      const result = highlightDifferences('hello', 'hello')
      expect(result).toEqual([{ text: 'hello', isHighlighted: false }])
    })

    it('should mark differing characters', () => {
      const result = highlightDifferences('cat', 'bat')
      // First character 'c' differs from 'b'
      expect(result.some(s => s.isHighlighted && s.text.includes('c'))).toBe(true)
    })

    it('should handle diacritics as identical when normalized', () => {
      const result = highlightDifferences('café', 'cafe')
      // Returns original when normalized versions match
      expect(result).toEqual([{ text: 'café', isHighlighted: false }])
    })
  })

  describe('hasAccentMismatchOnly', () => {
    it('should return true when only accents differ', () => {
      expect(hasAccentMismatchOnly('café', 'cafe')).toBe(true)
      expect(hasAccentMismatchOnly('naïve', 'naive')).toBe(true)
      expect(hasAccentMismatchOnly('résumé', 'resume')).toBe(true)
    })

    it('should return false when other characters differ', () => {
      expect(hasAccentMismatchOnly('cat', 'bat')).toBe(false)
      expect(hasAccentMismatchOnly('café', 'caff')).toBe(false)
    })

    it('should return false when strings are identical', () => {
      expect(hasAccentMismatchOnly('hello', 'hello')).toBe(false)
      expect(hasAccentMismatchOnly('café', 'café')).toBe(false)
    })

    it('should handle German umlauts', () => {
      expect(hasAccentMismatchOnly('schön', 'schon')).toBe(true)
      expect(hasAccentMismatchOnly('über', 'uber')).toBe(true)
    })
  })

  describe('similarity calculation', () => {
    it('should calculate correct similarity percentage', () => {
      // "hello" vs "hallo" - 1 char different out of 5 = 80% similar
      const result = checkAnswer('hello', 'hallo')
      expect(result.similarity).toBeCloseTo(0.8, 1)
    })

    it('should handle varying string lengths', () => {
      // "test" vs "tests" - 1 insertion out of max(4,5)=5 = 80% similar
      const result = checkAnswer('test', 'tests')
      expect(result.similarity).toBeCloseTo(0.8, 1)
    })
  })
})
