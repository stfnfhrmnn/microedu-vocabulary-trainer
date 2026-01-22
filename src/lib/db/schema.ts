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

// Multi-language hint for vocabulary items
export interface LanguageHint {
  language: string              // 'english', 'french', etc.
  text: string                  // "similar to 'house'"
}

// Example sentence for vocabulary
export interface ExampleSentence {
  text: string                  // The example sentence
  translation?: string          // Optional translation
  source?: string              // Where this sentence came from (e.g., "textbook", "user")
}

// Conjugation entry for verbs
export interface ConjugationEntry {
  tense: string                 // 'present', 'past', 'future', 'imperfect', etc.
  forms: {
    person: string             // '1s', '2s', '3s', '1p', '2p', '3p' (singular/plural)
    form: string               // The conjugated form
  }[]
}

// Word type classification
export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'phrase' | 'other'

// Gender for nouns (language-specific)
export type GrammaticalGender = 'masculine' | 'feminine' | 'neuter' | 'common'

export interface VocabularyItem {
  id: string
  sectionId: string | null      // null = book-level vocabulary
  chapterId: string | null      // null = book-level vocabulary
  bookId: string                // Always required
  sourceText: string            // German
  targetText: string            // Foreign language
  notes?: string
  hints?: LanguageHint[]        // Multi-language hints
  imageUrl?: string
  // Enhanced content fields
  wordType?: WordType           // Classification of the word
  gender?: GrammaticalGender    // For nouns
  plural?: string               // Plural form (for nouns)
  examples?: ExampleSentence[]  // Example sentences
  conjugations?: ConjugationEntry[] // Verb conjugations
  audioUrl?: string             // URL to pronunciation audio
  pronunciation?: string        // IPA or phonetic spelling
  etymology?: string            // Word origin/etymology
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
// Family & Class Sharing
// ============================================================================

export type UserRole = 'child' | 'parent' | 'teacher'

export interface FamilyGroup {
  id: string
  name: string                 // e.g., "Familie Müller"
  createdBy: string           // User ID of creator
  inviteCode: string          // Code for joining
  createdAt: Date
  updatedAt: Date
}

export interface FamilyMember {
  id: string
  familyId: string
  userId: string              // References user profile ID
  role: UserRole
  nickname?: string           // Display name within family
  joinedAt: Date
}

export interface SharedBook {
  id: string
  bookId: string
  sharedBy: string            // User ID
  sharedWith: 'family' | 'class'
  groupId: string             // Family or class group ID
  permissions: 'view' | 'copy' | 'edit'
  sharedAt: Date
}

export interface ProgressShareSettings {
  id: string
  userId: string              // Child user ID
  sharedWithId: string        // Parent user ID
  shareProgress: boolean      // Show learning progress
  shareStreak: boolean        // Show streak data
  shareWeakWords: boolean     // Show struggling vocabulary
  updatedAt: Date
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

export const LanguageHintSchema = z.object({
  language: z.string().min(1),
  text: z.string().min(1).max(500),
})

export const ExampleSentenceSchema = z.object({
  text: z.string().min(1).max(500),
  translation: z.string().max(500).optional(),
  source: z.string().max(100).optional(),
})

export const ConjugationFormSchema = z.object({
  person: z.enum(['1s', '2s', '3s', '1p', '2p', '3p']),
  form: z.string().min(1).max(100),
})

export const ConjugationEntrySchema = z.object({
  tense: z.string().min(1).max(50),
  forms: z.array(ConjugationFormSchema),
})

export const WordTypeSchema = z.enum(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'phrase', 'other'])

export const GrammaticalGenderSchema = z.enum(['masculine', 'feminine', 'neuter', 'common'])

export const VocabularyItemSchema = z.object({
  sourceText: z.string().min(1, 'Deutsches Wort ist erforderlich').max(200),
  targetText: z.string().min(1, 'Fremdwort ist erforderlich').max(200),
  sectionId: z.string().min(1).nullable().optional(),  // null = book-level vocab
  chapterId: z.string().min(1).nullable().optional(),  // null = book-level vocab
  bookId: z.string().min(1),
  notes: z.string().max(500).optional(),
  hints: z.array(LanguageHintSchema).optional(),
  // Enhanced content
  wordType: WordTypeSchema.optional(),
  gender: GrammaticalGenderSchema.optional(),
  plural: z.string().max(200).optional(),
  examples: z.array(ExampleSentenceSchema).optional(),
  conjugations: z.array(ConjugationEntrySchema).optional(),
  audioUrl: z.string().url().optional(),
  pronunciation: z.string().max(200).optional(),
  etymology: z.string().max(1000).optional(),
})

export const UserSettingsSchema = z.object({
  defaultDirection: z.enum(['sourceToTarget', 'targetToSource', 'mixed']),
  defaultExerciseType: z.enum(['flashcard', 'multipleChoice', 'typed']),
  typingStrictness: z.enum(['strict', 'normal', 'lenient']),
  ocrProvider: z.enum(['tesseract', 'gemini']),
  geminiApiKey: z.string().optional(),
  soundEnabled: z.boolean(),
})

export const UserRoleSchema = z.enum(['child', 'parent', 'teacher'])

export const FamilyGroupSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
})

export const FamilyMemberSchema = z.object({
  familyId: z.string().min(1),
  userId: z.string().min(1),
  role: UserRoleSchema,
  nickname: z.string().max(50).optional(),
})

export const SharedBookSchema = z.object({
  bookId: z.string().min(1),
  sharedWith: z.enum(['family', 'class']),
  groupId: z.string().min(1),
  permissions: z.enum(['view', 'copy', 'edit']),
})

export const ProgressShareSettingsSchema = z.object({
  userId: z.string().min(1),
  sharedWithId: z.string().min(1),
  shareProgress: z.boolean(),
  shareStreak: z.boolean(),
  shareWeakWords: z.boolean(),
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
