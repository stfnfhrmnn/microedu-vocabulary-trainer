// Language code mapping for browser spellcheck
import type { Language } from '@/lib/db/schema'

export const LANG_CODES: Record<Language, string> = {
  french: 'fr',
  spanish: 'es',
  latin: 'la',
}

// German for source text
export const SOURCE_LANG_CODE = 'de'

/**
 * Get the HTML lang attribute for a language
 */
export function getLangCode(language: Language | undefined): string | undefined {
  if (!language) return undefined
  return LANG_CODES[language]
}
