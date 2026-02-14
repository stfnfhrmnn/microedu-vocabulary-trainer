import Dexie, { type Table } from 'dexie'
import { generateId } from '@/lib/utils/id'
import type {
  Book,
  Chapter,
  Section,
  VocabularyItem,
  LearningProgress,
  ReviewSession,
  ReviewAttempt,
  UserSettings,
  CachedImage,
  FamilyGroup,
  FamilyMember,
  SharedBook,
  ProgressShareSettings,
  CreateBook,
  CreateChapter,
  CreateSection,
  CreateVocabularyItem,
  LanguageHint,
  Network,
  NetworkMember,
  CompetitionStats,
  NetworkSharedBook,
  BookCopy,
  UserBlock,
  ContentReport,
  DeletionRequest,
} from './schema'

type ChangeTable = 'books' | 'chapters' | 'sections' | 'vocabularyItems' | 'learningProgress'

// Helper to safely queue changes (lazy loads sync module)
async function safeQueueChange(
  table: ChangeTable,
  operation: 'create' | 'update' | 'delete',
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  try {
    // Lazy import to avoid loading sync module until needed
    const { queueChange } = await import('@/lib/sync/sync-queue')
    await queueChange(table, operation, localId, data)
  } catch (error) {
    // Silently fail - sync is optional
    console.warn('Failed to queue sync change:', error)
  }
}

// ============================================================================
// Database Class
// ============================================================================

export class VocabularyDatabase extends Dexie {
  books!: Table<Book, string>
  chapters!: Table<Chapter, string>
  sections!: Table<Section, string>
  vocabularyItems!: Table<VocabularyItem, string>
  learningProgress!: Table<LearningProgress, string>
  reviewSessions!: Table<ReviewSession, string>
  reviewAttempts!: Table<ReviewAttempt, string>
  userSettings!: Table<UserSettings, string>
  cachedImages!: Table<CachedImage, string>
  familyGroups!: Table<FamilyGroup, string>
  familyMembers!: Table<FamilyMember, string>
  sharedBooks!: Table<SharedBook, string>
  progressShareSettings!: Table<ProgressShareSettings, string>
  // Network/Competition tables
  networks!: Table<Network, string>
  networkMembers!: Table<NetworkMember, string>
  competitionStats!: Table<CompetitionStats, string>
  networkSharedBooks!: Table<NetworkSharedBook, string>
  bookCopies!: Table<BookCopy, string>
  userBlocks!: Table<UserBlock, string>
  contentReports!: Table<ContentReport, string>
  deletionRequests!: Table<DeletionRequest, string>

  constructor() {
    super('VocabularyTrainer')

    this.version(1).stores({
      books: 'id, name, language, createdAt',
      chapters: 'id, bookId, name, order, createdAt',
      sections: 'id, chapterId, bookId, name, order, coveredInClass, createdAt',
      vocabularyItems: 'id, sectionId, chapterId, bookId, sourceText, targetText, createdAt',
      learningProgress: 'id, vocabularyId, nextReviewDate, interval',
      reviewSessions: 'id, exerciseType, startedAt, completedAt',
      reviewAttempts: 'id, sessionId, vocabularyId, createdAt',
      userSettings: 'id',
      cachedImages: 'id, vocabularyId, createdAt',
    })

    // Version 2: Support for book-level vocabulary (nullable sectionId/chapterId)
    // and multi-language hints
    this.version(2).stores({
      books: 'id, name, language, createdAt',
      chapters: 'id, bookId, name, order, createdAt',
      sections: 'id, chapterId, bookId, name, order, coveredInClass, createdAt',
      vocabularyItems: 'id, sectionId, chapterId, bookId, sourceText, targetText, createdAt',
      learningProgress: 'id, vocabularyId, nextReviewDate, interval',
      reviewSessions: 'id, exerciseType, startedAt, completedAt',
      reviewAttempts: 'id, sessionId, vocabularyId, createdAt',
      userSettings: 'id',
      cachedImages: 'id, vocabularyId, createdAt',
    })

    // Version 3: Family & class sharing support
    this.version(3).stores({
      books: 'id, name, language, createdAt',
      chapters: 'id, bookId, name, order, createdAt',
      sections: 'id, chapterId, bookId, name, order, coveredInClass, createdAt',
      vocabularyItems: 'id, sectionId, chapterId, bookId, sourceText, targetText, createdAt',
      learningProgress: 'id, vocabularyId, nextReviewDate, interval',
      reviewSessions: 'id, exerciseType, startedAt, completedAt',
      reviewAttempts: 'id, sessionId, vocabularyId, createdAt',
      userSettings: 'id',
      cachedImages: 'id, vocabularyId, createdAt',
      familyGroups: 'id, inviteCode, createdBy, createdAt',
      familyMembers: 'id, familyId, userId, role, joinedAt',
      sharedBooks: 'id, bookId, sharedBy, groupId, sharedAt',
      progressShareSettings: 'id, userId, sharedWithId, updatedAt',
    })

    // Version 4: Network competition & sharing
    this.version(4).stores({
      books: 'id, name, language, createdAt',
      chapters: 'id, bookId, name, order, createdAt',
      sections: 'id, chapterId, bookId, name, order, coveredInClass, createdAt',
      vocabularyItems: 'id, sectionId, chapterId, bookId, sourceText, targetText, createdAt',
      learningProgress: 'id, vocabularyId, nextReviewDate, interval',
      reviewSessions: 'id, exerciseType, startedAt, completedAt',
      reviewAttempts: 'id, sessionId, vocabularyId, createdAt',
      userSettings: 'id',
      cachedImages: 'id, vocabularyId, createdAt',
      familyGroups: 'id, inviteCode, createdBy, createdAt',
      familyMembers: 'id, familyId, userId, role, joinedAt',
      sharedBooks: 'id, bookId, sharedBy, groupId, sharedAt',
      progressShareSettings: 'id, userId, sharedWithId, updatedAt',
      // Network/Competition tables
      networks: 'id, inviteCode, ownerId, type, createdAt',
      networkMembers: 'id, networkId, userId, role, joinedAt',
      competitionStats: 'id, userId, periodType, periodStart, updatedAt',
      networkSharedBooks: 'id, bookId, ownerId, networkId, sharedAt',
      bookCopies: 'id, originalBookId, copiedBookId, copiedBy, copiedAt',
      userBlocks: 'id, blockerId, blockedId, createdAt',
      contentReports: 'id, reporterId, reportedUserId, networkId, status, createdAt',
      deletionRequests: 'id, userId, itemType, itemId, status, createdAt',
    })

    // Add timestamp hooks
    this.books.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })
    this.books.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: new Date() }
    })

    this.chapters.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })
    this.chapters.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: new Date() }
    })

    this.sections.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })
    this.sections.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: new Date() }
    })

    this.vocabularyItems.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })
    this.vocabularyItems.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: new Date() }
    })

    this.learningProgress.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })
    this.learningProgress.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: new Date() }
    })

    this.userSettings.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })
    this.userSettings.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: new Date() }
    })
  }
}

// Singleton instance
export const db = new VocabularyDatabase()

// ============================================================================
// Book Operations
// ============================================================================

export async function createBook(data: CreateBook): Promise<Book> {
  const book: Book = {
    id: generateId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await db.books.add(book)
  await safeQueueChange('books', 'create', book.id, book as unknown as Record<string, unknown>)
  return book
}

export async function updateBook(id: string, data: Partial<CreateBook>): Promise<void> {
  await db.books.update(id, data)
  const updated = await db.books.get(id)
  if (updated) {
    await safeQueueChange('books', 'update', id, updated as unknown as Record<string, unknown>)
  }
}

export async function deleteBook(id: string): Promise<void> {
  // Collect IDs before deletion for sync
  const chapters = await db.chapters.where('bookId').equals(id).toArray()
  const sections = await db.sections.where('bookId').equals(id).toArray()
  const vocabItems = await db.vocabularyItems.where('bookId').equals(id).toArray()

  await db.transaction('rw', [db.books, db.chapters, db.sections, db.vocabularyItems, db.learningProgress], async () => {
    // Get all vocabulary items for this book
    const vocabIds = await db.vocabularyItems
      .where('bookId')
      .equals(id)
      .primaryKeys()

    // Delete learning progress for these vocabulary items
    await db.learningProgress
      .where('vocabularyId')
      .anyOf(vocabIds)
      .delete()

    // Delete vocabulary items
    await db.vocabularyItems.where('bookId').equals(id).delete()

    // Delete sections
    await db.sections.where('bookId').equals(id).delete()

    // Delete chapters
    await db.chapters.where('bookId').equals(id).delete()

    // Delete book
    await db.books.delete(id)
  })

  // Queue delete changes for sync
  for (const vocab of vocabItems) {
    await safeQueueChange('vocabularyItems', 'delete', vocab.id, null)
    await safeQueueChange('learningProgress', 'delete', vocab.id, null)
  }
  for (const section of sections) {
    await safeQueueChange('sections', 'delete', section.id, null)
  }
  for (const chapter of chapters) {
    await safeQueueChange('chapters', 'delete', chapter.id, null)
  }
  await safeQueueChange('books', 'delete', id, null)
}

// ============================================================================
// Chapter Operations
// ============================================================================

export async function createChapter(data: CreateChapter): Promise<Chapter> {
  const chapter: Chapter = {
    id: generateId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await db.chapters.add(chapter)
  await safeQueueChange('chapters', 'create', chapter.id, chapter as unknown as Record<string, unknown>)
  return chapter
}

export async function updateChapter(id: string, data: Partial<CreateChapter>): Promise<void> {
  await db.chapters.update(id, data)
  const updated = await db.chapters.get(id)
  if (updated) {
    await safeQueueChange('chapters', 'update', id, updated as unknown as Record<string, unknown>)
  }
}

export async function deleteChapter(id: string): Promise<void> {
  // Collect IDs before deletion for sync
  const sections = await db.sections.where('chapterId').equals(id).toArray()
  const vocabItems = await db.vocabularyItems.where('chapterId').equals(id).toArray()

  await db.transaction('rw', [db.chapters, db.sections, db.vocabularyItems, db.learningProgress], async () => {
    const vocabIds = await db.vocabularyItems
      .where('chapterId')
      .equals(id)
      .primaryKeys()

    await db.learningProgress
      .where('vocabularyId')
      .anyOf(vocabIds)
      .delete()

    await db.vocabularyItems.where('chapterId').equals(id).delete()
    await db.sections.where('chapterId').equals(id).delete()
    await db.chapters.delete(id)
  })

  // Queue delete changes for sync
  for (const vocab of vocabItems) {
    await safeQueueChange('vocabularyItems', 'delete', vocab.id, null)
    await safeQueueChange('learningProgress', 'delete', vocab.id, null)
  }
  for (const section of sections) {
    await safeQueueChange('sections', 'delete', section.id, null)
  }
  await safeQueueChange('chapters', 'delete', id, null)
}

// ============================================================================
// Section Operations
// ============================================================================

export async function createSection(data: CreateSection): Promise<Section> {
  const section: Section = {
    id: generateId(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await db.sections.add(section)
  await safeQueueChange('sections', 'create', section.id, section as unknown as Record<string, unknown>)
  return section
}

export async function updateSection(id: string, data: Partial<CreateSection>): Promise<void> {
  await db.sections.update(id, data)
  const updated = await db.sections.get(id)
  if (updated) {
    await safeQueueChange('sections', 'update', id, updated as unknown as Record<string, unknown>)
  }
}

export async function deleteSection(id: string): Promise<void> {
  // Collect IDs before deletion for sync
  const vocabItems = await db.vocabularyItems.where('sectionId').equals(id).toArray()

  await db.transaction('rw', [db.sections, db.vocabularyItems, db.learningProgress], async () => {
    const vocabIds = await db.vocabularyItems
      .where('sectionId')
      .equals(id)
      .primaryKeys()

    await db.learningProgress
      .where('vocabularyId')
      .anyOf(vocabIds)
      .delete()

    await db.vocabularyItems.where('sectionId').equals(id).delete()
    await db.sections.delete(id)
  })

  // Queue delete changes for sync
  for (const vocab of vocabItems) {
    await safeQueueChange('vocabularyItems', 'delete', vocab.id, null)
    await safeQueueChange('learningProgress', 'delete', vocab.id, null)
  }
  await safeQueueChange('sections', 'delete', id, null)
}

export async function toggleSectionCovered(id: string, covered: boolean): Promise<void> {
  await db.sections.update(id, { coveredInClass: covered })
  const updated = await db.sections.get(id)
  if (updated) {
    await safeQueueChange('sections', 'update', id, updated as unknown as Record<string, unknown>)
  }
}

// ============================================================================
// Vocabulary Operations
// ============================================================================

export async function createVocabularyItem(data: CreateVocabularyItem): Promise<VocabularyItem> {
  const item: VocabularyItem = {
    id: generateId(),
    sourceText: data.sourceText,
    targetText: data.targetText,
    sectionId: data.sectionId ?? null,
    chapterId: data.chapterId ?? null,
    bookId: data.bookId,
    notes: data.notes,
    hints: data.hints,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await db.vocabularyItems.add(item)
  await safeQueueChange('vocabularyItems', 'create', item.id, item as unknown as Record<string, unknown>)
  return item
}

export async function updateVocabularyItem(id: string, data: Partial<CreateVocabularyItem>): Promise<void> {
  await db.vocabularyItems.update(id, data)
  const updated = await db.vocabularyItems.get(id)
  if (updated) {
    await safeQueueChange('vocabularyItems', 'update', id, updated as unknown as Record<string, unknown>)
  }
}

export async function swapVocabularyLanguages(vocabularyIds: string[]): Promise<number> {
  const uniqueIds = [...new Set(vocabularyIds)].filter(Boolean)
  if (uniqueIds.length === 0) return 0

  const now = new Date()

  const swappedItems = await db.transaction('rw', [db.vocabularyItems], async () => {
    const items = await db.vocabularyItems.where('id').anyOf(uniqueIds).toArray()

    for (const item of items) {
      await db.vocabularyItems.update(item.id, {
        sourceText: item.targetText,
        targetText: item.sourceText,
        updatedAt: now,
      })
    }

    return db.vocabularyItems.where('id').anyOf(uniqueIds).toArray()
  })

  for (const item of swappedItems) {
    await safeQueueChange(
      'vocabularyItems',
      'update',
      item.id,
      item as unknown as Record<string, unknown>
    )
  }

  return swappedItems.length
}

export async function deleteVocabularyItem(id: string): Promise<void> {
  await db.transaction('rw', [db.vocabularyItems, db.learningProgress], async () => {
    await db.learningProgress.where('vocabularyId').equals(id).delete()
    await db.vocabularyItems.delete(id)
  })
  await safeQueueChange('vocabularyItems', 'delete', id, null)
  await safeQueueChange('learningProgress', 'delete', id, null)
}

export async function createVocabularyItems(items: CreateVocabularyItem[]): Promise<VocabularyItem[]> {
  const vocabItems: VocabularyItem[] = items.map((data) => ({
    id: generateId(),
    sourceText: data.sourceText,
    targetText: data.targetText,
    sectionId: data.sectionId ?? null,
    chapterId: data.chapterId ?? null,
    bookId: data.bookId,
    notes: data.notes,
    hints: data.hints,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  await db.vocabularyItems.bulkAdd(vocabItems)
  // Queue sync for each item
  for (const item of vocabItems) {
    await safeQueueChange('vocabularyItems', 'create', item.id, item as unknown as Record<string, unknown>)
  }
  return vocabItems
}

// ============================================================================
// Learning Progress Operations
// ============================================================================

export async function getOrCreateProgress(vocabularyId: string): Promise<LearningProgress> {
  const existing = await db.learningProgress.where('vocabularyId').equals(vocabularyId).first()
  if (existing) return existing

  const progress: LearningProgress = {
    id: generateId(),
    vocabularyId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
    totalReviews: 0,
    correctReviews: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await db.learningProgress.add(progress)
  await safeQueueChange('learningProgress', 'create', vocabularyId, progress as unknown as Record<string, unknown>)
  return progress
}

export async function updateProgress(id: string, data: Partial<LearningProgress>): Promise<void> {
  await db.learningProgress.update(id, data)
  const updated = await db.learningProgress.get(id)
  if (updated) {
    await safeQueueChange('learningProgress', 'update', updated.vocabularyId, updated as unknown as Record<string, unknown>)
  }
}

// ============================================================================
// Review Session Operations
// ============================================================================

export async function createReviewSession(data: Omit<ReviewSession, 'id'>): Promise<ReviewSession> {
  const session: ReviewSession = {
    id: generateId(),
    ...data,
  }
  await db.reviewSessions.add(session)
  return session
}

export async function completeReviewSession(id: string, correctCount: number): Promise<void> {
  await db.reviewSessions.update(id, {
    completedAt: new Date(),
    correctCount,
  })
}

export async function createReviewAttempt(data: Omit<ReviewAttempt, 'id' | 'createdAt'>): Promise<ReviewAttempt> {
  const attempt: ReviewAttempt = {
    id: generateId(),
    ...data,
    createdAt: new Date(),
  }
  await db.reviewAttempts.add(attempt)
  return attempt
}

// ============================================================================
// User Settings Operations
// ============================================================================

const DEFAULT_SETTINGS: UserSettings = {
  id: 'settings',
  defaultDirection: 'sourceToTarget',
  defaultExerciseType: 'flashcard',
  typingStrictness: 'normal',
  ocrProvider: 'tesseract',
  soundEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export async function getSettings(): Promise<UserSettings> {
  const settings = await db.userSettings.get('settings')
  if (settings) return settings

  await db.userSettings.put(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export async function updateSettings(data: Partial<UserSettings>): Promise<void> {
  const existing = await db.userSettings.get('settings')
  if (existing) {
    await db.userSettings.update('settings', data)
  } else {
    await db.userSettings.put({ ...DEFAULT_SETTINGS, ...data })
  }
}

// ============================================================================
// Statistics Queries
// ============================================================================

export async function getVocabularyStats() {
  const allVocab = await db.vocabularyItems.count()
  const allProgress = await db.learningProgress.toArray()

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const progressMap = new Map(allProgress.map((p) => [p.vocabularyId, p]))
  const vocabIds = await db.vocabularyItems.toCollection().primaryKeys()

  let newCount = 0
  let learningCount = 0
  let masteredCount = 0
  let dueCount = 0

  for (const vocabId of vocabIds) {
    const progress = progressMap.get(vocabId)
    if (!progress || progress.totalReviews === 0) {
      newCount++
      dueCount++ // New words are always "due"
    } else if (progress.interval >= 21) {
      masteredCount++
      if (progress.nextReviewDate <= today) {
        dueCount++
      }
    } else {
      learningCount++
      if (progress.nextReviewDate <= today) {
        dueCount++
      }
    }
  }

  return {
    total: allVocab,
    new: newCount,
    learning: learningCount,
    mastered: masteredCount,
    dueToday: dueCount,
  }
}

// ============================================================================
// Book-Level Vocabulary Operations
// ============================================================================

export async function getBookLevelVocabulary(bookId: string): Promise<VocabularyItem[]> {
  // Get vocabulary items where sectionId and chapterId are null (book-level)
  const allBookVocab = await db.vocabularyItems.where('bookId').equals(bookId).toArray()
  return allBookVocab.filter(item => item.sectionId === null && item.chapterId === null)
}

export async function createBookLevelVocabularyItem(data: {
  bookId: string
  sourceText: string
  targetText: string
  notes?: string
  hints?: LanguageHint[]
}): Promise<VocabularyItem> {
  const item: VocabularyItem = {
    id: generateId(),
    sectionId: null,
    chapterId: null,
    bookId: data.bookId,
    sourceText: data.sourceText,
    targetText: data.targetText,
    notes: data.notes,
    hints: data.hints,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await db.vocabularyItems.add(item)
  await safeQueueChange('vocabularyItems', 'create', item.id, item as unknown as Record<string, unknown>)
  return item
}

export async function createBookLevelVocabularyItems(items: Array<{
  bookId: string
  sourceText: string
  targetText: string
  notes?: string
  hints?: LanguageHint[]
}>): Promise<VocabularyItem[]> {
  const vocabItems: VocabularyItem[] = items.map((data) => ({
    id: generateId(),
    sectionId: null,
    chapterId: null,
    bookId: data.bookId,
    sourceText: data.sourceText,
    targetText: data.targetText,
    notes: data.notes,
    hints: data.hints,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  await db.vocabularyItems.bulkAdd(vocabItems)
  // Queue sync for each item
  for (const item of vocabItems) {
    await safeQueueChange('vocabularyItems', 'create', item.id, item as unknown as Record<string, unknown>)
  }
  return vocabItems
}
