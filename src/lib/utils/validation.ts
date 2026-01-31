import { z } from 'zod'

/**
 * Common validation schemas for user input
 */

// Text input limits
export const TEXT_LIMITS = {
  name: 100,
  description: 500,
  notes: 500,
  vocabulary: 200,
  nickname: 50,
} as const

// Common validation schemas
export const nameSchema = z
  .string()
  .min(1, 'Name ist erforderlich')
  .max(TEXT_LIMITS.name, `Maximal ${TEXT_LIMITS.name} Zeichen`)
  .transform((s) => s.trim())

export const descriptionSchema = z
  .string()
  .max(TEXT_LIMITS.description, `Maximal ${TEXT_LIMITS.description} Zeichen`)
  .transform((s) => s.trim())
  .optional()

export const notesSchema = z
  .string()
  .max(TEXT_LIMITS.notes, `Maximal ${TEXT_LIMITS.notes} Zeichen`)
  .transform((s) => s.trim())
  .optional()

export const vocabularyTextSchema = z
  .string()
  .min(1, 'Text ist erforderlich')
  .max(TEXT_LIMITS.vocabulary, `Maximal ${TEXT_LIMITS.vocabulary} Zeichen`)
  .transform((s) => s.trim())

export const nicknameSchema = z
  .string()
  .max(TEXT_LIMITS.nickname, `Maximal ${TEXT_LIMITS.nickname} Zeichen`)
  .transform((s) => s.trim())
  .optional()

/**
 * Sanitize text input - removes potential XSS vectors
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
}

/**
 * Validate and sanitize a name field
 */
export function validateName(input: string): { valid: boolean; error?: string; value: string } {
  const result = nameSchema.safeParse(input)
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'Ungültiger Name',
      value: input,
    }
  }
  return { valid: true, value: result.data }
}

/**
 * Check if text exceeds limit
 */
export function exceedsLimit(text: string, limit: keyof typeof TEXT_LIMITS): boolean {
  return text.length > TEXT_LIMITS[limit]
}

/**
 * Get remaining characters
 */
export function remainingChars(text: string, limit: keyof typeof TEXT_LIMITS): number {
  return TEXT_LIMITS[limit] - text.length
}
