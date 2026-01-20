import { z } from 'zod'

// ============================================================================
// Enums
// ============================================================================

export type Language = 'french' | 'spanish' | 'latin'
export type PracticeDirection = 'sourceToTarget' | 'targetToSource' | 'mixed'
export type ExerciseType = 'flashcard' | 'multipleChoice' | 'typed'
export type QualityRating = 1 | 2 | 3 | 4 | 5

// ============================================================================
// Base Types
// ============================================================================

export interface Book {
  id: string
  name: string
  language: Language
  description?: string
  coverColor: string
  createdAt: Date
  updatedAt: Date
}

export interface Chapter {
  id: string
  bookId: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Section {
  id: string
  chapterId: string
  bookId: string
  name: string
  order: number
  coveredInClass: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VocabularyItem {
  id: string
  sectionId: string
  chapterId: string
  bookId: string
  sourceText: string // German
  targetText: string // Foreign language
  notes?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Learning Progress
// ============================================================================

export interface LearningProgress {
  id: string
  vocabularyId: string
  // SM-2 algorithm fields
  easeFactor: number // Default 2.5, min 1.3
  interval: number // Days until next review
  repetitions: number // Number of successful reviews in a row
  nextReviewDate: Date
  // Statistics
  totalReviews: number
  correctReviews: number
  lastReviewDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ReviewSession {
  id: string
  exerciseType: ExerciseType
  direction: PracticeDirection
  sectionIds: string[]
  totalItems: number
  correctCount: number
  startedAt: Date
  completedAt?: Date
}

export interface ReviewAttempt {
  id: string
  sessionId: string
  vocabularyId: string
  exerciseType: ExerciseType
  direction: PracticeDirection
  userAnswer: string
  wasCorrect: boolean
  qualityRating: QualityRating
  responseTimeMs: number
  createdAt: Date
}

// ============================================================================
// User Settings
// ============================================================================

export interface UserSettings {
  id: string // Always 'settings' (singleton)
  defaultDirection: PracticeDirection
  defaultExerciseType: ExerciseType
  typingStrictness: 'strict' | 'normal' | 'lenient'
  ocrProvider: 'tesseract' | 'gemini'
  geminiApiKey?: string
  soundEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Cached Resources
// ============================================================================

export interface CachedImage {
  id: string
  vocabularyId?: string
  blob: Blob
  mimeType: string
  createdAt: Date
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const BookSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  language: z.enum(['french', 'spanish', 'latin']),
  description: z.string().max(500).optional(),
  coverColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

export const ChapterSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  bookId: z.string().min(1),
  order: z.number().int().min(0),
})

export const SectionSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  chapterId: z.string().min(1),
  bookId: z.string().min(1),
  order: z.number().int().min(0),
  coveredInClass: z.boolean().default(false),
})

export const VocabularyItemSchema = z.object({
  sourceText: z.string().min(1, 'Deutsches Wort ist erforderlich').max(200),
  targetText: z.string().min(1, 'Fremdwort ist erforderlich').max(200),
  sectionId: z.string().min(1),
  chapterId: z.string().min(1),
  bookId: z.string().min(1),
  notes: z.string().max(500).optional(),
})

export const UserSettingsSchema = z.object({
  defaultDirection: z.enum(['sourceToTarget', 'targetToSource', 'mixed']),
  defaultExerciseType: z.enum(['flashcard', 'multipleChoice', 'typed']),
  typingStrictness: z.enum(['strict', 'normal', 'lenient']),
  ocrProvider: z.enum(['tesseract', 'gemini']),
  geminiApiKey: z.string().optional(),
  soundEnabled: z.boolean(),
})

// ============================================================================
// Helper Types
// ============================================================================

export type CreateBook = z.infer<typeof BookSchema>
export type CreateChapter = z.infer<typeof ChapterSchema>
export type CreateSection = z.infer<typeof SectionSchema>
export type CreateVocabularyItem = z.infer<typeof VocabularyItemSchema>
export type UpdateUserSettings = Partial<z.infer<typeof UserSettingsSchema>>

// Book with nested data
export interface BookWithChapters extends Book {
  chapters: ChapterWithSections[]
}

export interface ChapterWithSections extends Chapter {
  sections: SectionWithVocabulary[]
}

export interface SectionWithVocabulary extends Section {
  vocabularyItems: VocabularyItem[]
}

// Vocabulary with progress for practice
export interface VocabularyWithProgress extends VocabularyItem {
  progress?: LearningProgress
}

// Practice session item
export interface PracticeItem {
  vocabulary: VocabularyItem
  progress?: LearningProgress
  answered: boolean
  correct?: boolean
  qualityRating?: QualityRating
  userAnswer?: string
}

// Statistics
export interface VocabularyStats {
  total: number
  new: number // Never reviewed
  learning: number // Interval < 21 days
  mastered: number // Interval >= 21 days
  dueToday: number
}

export interface SectionStats extends VocabularyStats {
  sectionId: string
  sectionName: string
}
