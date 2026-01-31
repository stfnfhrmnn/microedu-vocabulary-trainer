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

export type UserRole = 'child' | 'parent' | 'teacher' | 'admin'

// ============================================================================
// Network Types (Classes/Study Groups)
// ============================================================================

export type NetworkType = 'class' | 'study_group' | 'family'
export type MemberVisibility = 'visible' | 'hidden'
export type JoinStatus = 'active' | 'pending' | 'blocked'
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'all_time'
export type BlockType = 'full' | 'messages_only'
export type ReportType = 'inappropriate_content' | 'spam' | 'harassment' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
export type DeletionStatus = 'pending' | 'confirmed' | 'rejected'

export interface Network {
  id: string
  name: string
  type: NetworkType
  inviteCode: string           // XXX-XXX format
  ownerId: string
  settings: NetworkSettings
  createdAt: Date
  archivedAt?: Date
}

export interface NetworkSettings {
  allowChildInvites?: boolean
  leaderboardVisible?: boolean
  parentsSeeAllProgress?: boolean
}

export interface NetworkMember {
  id: string
  networkId: string
  userId: string
  role: UserRole
  nickname?: string
  visibility: MemberVisibility
  joinStatus: JoinStatus
  joinedAt: Date
}

export interface CompetitionStats {
  id: string
  userId: string
  periodType: PeriodType
  periodStart: Date
  wordsReviewed: number
  wordsMastered: number
  accuracyPercentage: number
  xpEarned: number
  streakDays: number
  sessionsCompleted: number
  updatedAt: Date
}

export interface NetworkSharedBook {
  id: string
  bookId: string
  ownerId: string
  networkId: string
  permissions: 'copy'          // Only copy model supported
  copyCount: number
  sharedAt: Date
}

export interface BookCopy {
  id: string
  originalBookId?: string      // null if original deleted
  copiedBookId: string
  copiedBy: string
  copiedFromUserId?: string    // null if original owner deleted
  copiedAt: Date
}

export interface UserBlock {
  id: string
  blockerId: string
  blockedId: string
  blockType: BlockType
  createdAt: Date
}

export interface ContentReport {
  id: string
  reporterId: string
  reportedUserId?: string
  reportedBookId?: string
  networkId?: string
  reportType: ReportType
  description?: string
  status: ReportStatus
  createdAt: Date
}

export interface DeletionRequest {
  id: string
  userId: string
  itemType: 'vocabulary' | 'book' | 'chapter' | 'section'
  itemId: string
  totalReviews: number
  requiresConfirmation: boolean
  status: DeletionStatus
  confirmedBy?: string
  createdAt: Date
}

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

export const UserRoleSchema = z.enum(['child', 'parent', 'teacher', 'admin'])

// Network Schemas
export const NetworkTypeSchema = z.enum(['class', 'study_group', 'family'])
export const MemberVisibilitySchema = z.enum(['visible', 'hidden'])
export const JoinStatusSchema = z.enum(['active', 'pending', 'blocked'])
export const PeriodTypeSchema = z.enum(['daily', 'weekly', 'monthly', 'all_time'])
export const BlockTypeSchema = z.enum(['full', 'messages_only'])
export const ReportTypeSchema = z.enum(['inappropriate_content', 'spam', 'harassment', 'other'])
export const ReportStatusSchema = z.enum(['pending', 'reviewed', 'resolved', 'dismissed'])
export const DeletionStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])

export const NetworkSettingsSchema = z.object({
  allowChildInvites: z.boolean().optional(),
  leaderboardVisible: z.boolean().optional(),
  parentsSeeAllProgress: z.boolean().optional(),
})

export const NetworkSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
  type: NetworkTypeSchema,
  settings: NetworkSettingsSchema.optional(),
})

export const NetworkMemberSchema = z.object({
  networkId: z.string().min(1),
  userId: z.string().min(1),
  role: UserRoleSchema,
  nickname: z.string().max(50).optional(),
  visibility: MemberVisibilitySchema.optional(),
})

export const CompetitionStatsSchema = z.object({
  periodType: PeriodTypeSchema,
  wordsReviewed: z.number().int().min(0),
  wordsMastered: z.number().int().min(0),
  accuracyPercentage: z.number().min(0).max(100),
  xpEarned: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  sessionsCompleted: z.number().int().min(0),
})

export const NetworkSharedBookSchema = z.object({
  bookId: z.string().min(1),
  networkId: z.string().min(1),
})

export const UserBlockSchema = z.object({
  blockedId: z.string().min(1),
  blockType: BlockTypeSchema.optional(),
})

export const ContentReportSchema = z.object({
  reportedUserId: z.string().min(1).optional(),
  reportedBookId: z.string().min(1).optional(),
  networkId: z.string().min(1).optional(),
  reportType: ReportTypeSchema,
  description: z.string().max(1000).optional(),
})

export const DeletionRequestSchema = z.object({
  itemType: z.enum(['vocabulary', 'book', 'chapter', 'section']),
  itemId: z.string().min(1),
})

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

// Network helper types
export type CreateNetwork = z.infer<typeof NetworkSchema>
export type CreateNetworkMember = z.infer<typeof NetworkMemberSchema>
export type CreateCompetitionStats = z.infer<typeof CompetitionStatsSchema>
export type CreateNetworkSharedBook = z.infer<typeof NetworkSharedBookSchema>
export type CreateUserBlock = z.infer<typeof UserBlockSchema>
export type CreateContentReport = z.infer<typeof ContentReportSchema>
export type CreateDeletionRequest = z.infer<typeof DeletionRequestSchema>

// Leaderboard entry for display
export interface LeaderboardEntry {
  userId: string
  nickname: string
  role: UserRole
  rank: number
  xpEarned: number
  wordsReviewed: number
  wordsMastered: number
  accuracyPercentage: number
  streakDays: number
}

// Network with member count for display
export interface NetworkWithMembers extends Network {
  memberCount: number
  myRole?: UserRole
}
