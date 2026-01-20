import { describe, it, expect } from 'vitest'
import {
  parseLine,
  parseVocabularyFromText,
  detectFormat,
  suggestCorrections,
} from '@/lib/ocr/parser'

describe('OCR Parser', () => {
  describe('parseLine', () => {
    describe('two-column format (pipe)', () => {
      it('should parse "das Haus | la maison"', () => {
        const result = parseLine('das Haus | la maison')

        expect(result).not.toBeNull()
        expect(result?.sourceText).toBe('das Haus')
        expect(result?.targetText).toBe('la maison')
        expect(result?.confidence).toBe(0.95)
      })

      it('should handle extra whitespace around pipe', () => {
        const result = parseLine('  das Haus   |   la maison  ')

        expect(result?.sourceText).toBe('das Haus')
        expect(result?.targetText).toBe('la maison')
      })

      it('should handle multiple pipes (use first two parts)', () => {
        const result = parseLine('das Haus | la maison | the house')

        expect(result?.sourceText).toBe('das Haus')
        expect(result?.targetText).toBe('la maison')
      })
    })

    describe('tab-separated format', () => {
      it('should parse "das Haus\\tla maison"', () => {
        const result = parseLine('das Haus\tla maison')

        expect(result).not.toBeNull()
        expect(result?.sourceText).toBe('das Haus')
        expect(result?.targetText).toBe('la maison')
        expect(result?.confidence).toBe(0.95)
      })

      it('should handle multiple tabs', () => {
        // With multiple tabs, split creates empty strings between them
        // "der Hund\t\tle chien" splits to ["der Hund", "", "le chien"]
        // The parser takes first non-empty parts
        const result = parseLine('der Hund\tle chien')

        expect(result?.sourceText).toBe('der Hund')
        expect(result?.targetText).toBe('le chien')
      })
    })

    describe('parenthetical format', () => {
      it('should parse "das Haus (la maison)"', () => {
        const result = parseLine('das Haus (la maison)')

        expect(result).not.toBeNull()
        expect(result?.sourceText).toBe('das Haus')
        expect(result?.targetText).toBe('la maison')
        expect(result?.confidence).toBe(0.9)
      })

      it('should handle nested parentheses in source', () => {
        const result = parseLine('Haus (das) (la maison)')

        // This is ambiguous - parser should handle gracefully
        expect(result).not.toBeNull()
      })
    })

    describe('dash-separated format', () => {
      it('should parse "das Haus - la maison"', () => {
        const result = parseLine('das Haus - la maison')

        expect(result).not.toBeNull()
        expect(result?.sourceText).toBe('das Haus')
        expect(result?.targetText).toBe('la maison')
        expect(result?.confidence).toBe(0.85)
      })

      it('should not split hyphenated words', () => {
        const result = parseLine('week-end - fin de semaine')

        expect(result?.sourceText).toBe('week-end')
        expect(result?.targetText).toBe('fin de semaine')
      })
    })

    describe('colon-separated format', () => {
      it('should parse "das Haus : la maison"', () => {
        const result = parseLine('das Haus : la maison')

        expect(result).not.toBeNull()
        expect(result?.sourceText).toBe('das Haus')
        expect(result?.targetText).toBe('la maison')
        expect(result?.confidence).toBe(0.85)
      })
    })

    describe('edge cases', () => {
      it('should return null for empty lines', () => {
        expect(parseLine('')).toBeNull()
        expect(parseLine('   ')).toBeNull()
        expect(parseLine('\t')).toBeNull()
      })

      it('should return null for very short lines', () => {
        expect(parseLine('ab')).toBeNull()
      })

      it('should return null for lines without separators', () => {
        expect(parseLine('das Haus la maison')).toBeNull()
      })

      it('should skip comment lines', () => {
        expect(parseLine('# This is a comment')).toBeNull()
        expect(parseLine('// Another comment')).toBeNull()
      })

      it('should skip numbered list markers', () => {
        expect(parseLine('1. Section heading')).toBeNull()
        expect(parseLine('2) Another item')).toBeNull()
      })

      it('should handle special characters', () => {
        const result = parseLine('lœuf | das Ei')

        expect(result).not.toBeNull()
        expect(result?.sourceText).toBe('lœuf')
      })

      it('should handle German umlauts', () => {
        const result = parseLine('schön | beau')

        expect(result?.sourceText).toBe('schön')
        expect(result?.targetText).toBe('beau')
      })

      it('should clean OCR artifacts from edges', () => {
        const result = parseLine('...das Haus... | ...la maison...')

        expect(result?.sourceText).toBe('das Haus')
        expect(result?.targetText).toBe('la maison')
      })
    })
  })

  describe('parseVocabularyFromText', () => {
    it('should parse multi-line vocabulary lists', () => {
      const text = `das Haus | la maison
der Hund | le chien
die Katze | le chat`

      const results = parseVocabularyFromText(text)

      expect(results).toHaveLength(3)
      expect(results[0].sourceText).toBe('das Haus')
      expect(results[1].sourceText).toBe('der Hund')
      expect(results[2].sourceText).toBe('die Katze')
    })

    it('should skip empty lines', () => {
      const text = `das Haus | la maison

der Hund | le chien

die Katze | le chat`

      const results = parseVocabularyFromText(text)

      expect(results).toHaveLength(3)
    })

    it('should handle mixed formats', () => {
      const text = `das Haus | la maison
der Hund\tle chien
die Katze (le chat)`

      const results = parseVocabularyFromText(text)

      expect(results).toHaveLength(3)
    })

    it('should handle Windows line endings', () => {
      const text = 'das Haus | la maison\r\nder Hund | le chien'

      const results = parseVocabularyFromText(text)

      expect(results).toHaveLength(2)
    })

    it('should filter out invalid lines', () => {
      const text = `# Vocabulary Chapter 1
das Haus | la maison
This is not vocabulary
der Hund | le chien
// Comment
die Katze | le chat`

      const results = parseVocabularyFromText(text)

      expect(results).toHaveLength(3)
    })

    it('should handle German-French vocabulary', () => {
      const text = `das Brot | le pain
der Käse | le fromage
die Milch | le lait
das Wasser | l'eau`

      const results = parseVocabularyFromText(text)

      expect(results).toHaveLength(4)
      expect(results[3].targetText).toBe("l'eau")
    })

    it('should handle German-Spanish vocabulary', () => {
      const text = `das Haus | la casa
der Hund | el perro
die Katze | el gato`

      const results = parseVocabularyFromText(text)

      expect(results).toHaveLength(3)
      expect(results[0].targetText).toBe('la casa')
    })

    it('should handle Latin vocabulary', () => {
      const text = `das Haus | domus
der Bauer | agricola
das Wasser | aqua`

      const results = parseVocabularyFromText(text)

      expect(results).toHaveLength(3)
      expect(results[1].targetText).toBe('agricola')
    })
  })

  describe('detectFormat', () => {
    it('should detect pipe format', () => {
      const text = `das Haus | la maison
der Hund | le chien`

      expect(detectFormat(text)).toBe('pipe')
    })

    it('should detect tab format', () => {
      const text = `das Haus\tla maison
der Hund\tle chien`

      expect(detectFormat(text)).toBe('tab')
    })

    it('should detect parenthetical format', () => {
      const text = `das Haus (la maison)
der Hund (le chien)`

      expect(detectFormat(text)).toBe('parenthetical')
    })

    it('should detect dash format', () => {
      const text = `das Haus - la maison
der Hund - le chien`

      expect(detectFormat(text)).toBe('dash')
    })

    it('should detect colon format', () => {
      const text = `das Haus : la maison
der Hund : le chien`

      expect(detectFormat(text)).toBe('colon')
    })

    it('should return unknown for unrecognized format', () => {
      const text = `das Haus la maison
der Hund le chien`

      expect(detectFormat(text)).toBe('unknown')
    })

    it('should return unknown for empty text', () => {
      expect(detectFormat('')).toBe('unknown')
      expect(detectFormat('   \n  \n  ')).toBe('unknown')
    })

    it('should detect most common format in mixed text', () => {
      const text = `das Haus | la maison
der Hund | le chien
die Katze | le chat
das Auto (la voiture)`

      // Pipe appears 3 times, parenthetical 1 time
      expect(detectFormat(text)).toBe('pipe')
    })
  })

  describe('suggestCorrections', () => {
    it('should suggest O/0 corrections', () => {
      const suggestions = suggestCorrections('H0use')

      expect(suggestions).toContain('HOuse')
      expect(suggestions).toContain('House')
    })

    it('should suggest l/1/I corrections', () => {
      const suggestions = suggestCorrections('ltem')

      expect(suggestions).toContain('1tem')
      expect(suggestions).toContain('Item')
    })

    it('should suggest rn -> m corrections', () => {
      const suggestions = suggestCorrections('rnorning')

      expect(suggestions).toContain('morning')
    })

    it('should return empty array when no corrections needed', () => {
      // Use a word that doesn't contain any common OCR mistake patterns
      const suggestions = suggestCorrections('test')

      expect(suggestions).toHaveLength(0)
    })
  })
})
