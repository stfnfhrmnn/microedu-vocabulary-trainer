import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  jsonb,
  uniqueIndex,
  index,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// Users
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  userCode: varchar('user_code', { length: 9 }).unique().notNull(), // XXXX-XXXX
  name: varchar('name', { length: 100 }).default('User'),
  avatar: varchar('avatar', { length: 10 }).default('🦊'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
})

export const usersRelations = relations(users, ({ many, one }) => ({
  books: many(books),
  learningProgress: many(learningProgress),
  userData: one(userData),
}))

// ============================================================================
// Books
// ============================================================================

export const books = pgTable(
  'books',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    localId: varchar('local_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    language: varchar('language', { length: 20 }).notNull(),
    description: text('description'),
    coverColor: varchar('cover_color', { length: 7 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('books_user_local_idx').on(table.userId, table.localId)]
)

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, { fields: [books.userId], references: [users.id] }),
  chapters: many(chapters),
}))

// ============================================================================
// Chapters
// ============================================================================

export const chapters = pgTable(
  'chapters',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    bookId: uuid('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    localId: varchar('local_id', { length: 36 }).notNull(),
    localBookId: varchar('local_book_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    order: integer('order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('chapters_user_local_idx').on(table.userId, table.localId)]
)

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  user: one(users, { fields: [chapters.userId], references: [users.id] }),
  book: one(books, { fields: [chapters.bookId], references: [books.id] }),
  sections: many(sections),
}))

// ============================================================================
// Sections
// ============================================================================

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    chapterId: uuid('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    bookId: uuid('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    localId: varchar('local_id', { length: 36 }).notNull(),
    localChapterId: varchar('local_chapter_id', { length: 36 }).notNull(),
    localBookId: varchar('local_book_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    order: integer('order').notNull(),
    coveredInClass: integer('covered_in_class').default(0), // 0 = false, 1 = true
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('sections_user_local_idx').on(table.userId, table.localId)]
)

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  user: one(users, { fields: [sections.userId], references: [users.id] }),
  chapter: one(chapters, { fields: [sections.chapterId], references: [chapters.id] }),
  book: one(books, { fields: [sections.bookId], references: [books.id] }),
  vocabularyItems: many(vocabularyItems),
}))

// ============================================================================
// Vocabulary Items
// ============================================================================

export const vocabularyItems = pgTable(
  'vocabulary_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    sectionId: uuid('section_id')
      .references(() => sections.id, { onDelete: 'cascade' }),
    chapterId: uuid('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' }),
    bookId: uuid('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    localId: varchar('local_id', { length: 36 }).notNull(),
    localSectionId: varchar('local_section_id', { length: 36 }),
    localChapterId: varchar('local_chapter_id', { length: 36 }),
    localBookId: varchar('local_book_id', { length: 36 }).notNull(),
    sourceText: varchar('source_text', { length: 200 }).notNull(),
    targetText: varchar('target_text', { length: 200 }).notNull(),
    notes: text('notes'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('vocab_user_local_idx').on(table.userId, table.localId),
    index('vocab_book_idx').on(table.bookId),
    index('vocab_section_idx').on(table.sectionId),
  ]
)

export const vocabularyItemsRelations = relations(vocabularyItems, ({ one }) => ({
  user: one(users, { fields: [vocabularyItems.userId], references: [users.id] }),
  section: one(sections, { fields: [vocabularyItems.sectionId], references: [sections.id] }),
  chapter: one(chapters, { fields: [vocabularyItems.chapterId], references: [chapters.id] }),
  book: one(books, { fields: [vocabularyItems.bookId], references: [books.id] }),
}))

// ============================================================================
// Learning Progress
// ============================================================================

export const learningProgress = pgTable(
  'learning_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    localVocabularyId: varchar('local_vocabulary_id', { length: 36 }).notNull(),
    easeFactor: decimal('ease_factor', { precision: 3, scale: 2 }).default('2.5'),
    interval: integer('interval').default(0),
    repetitions: integer('repetitions').default(0),
    nextReviewDate: timestamp('next_review_date', { withTimezone: true }).defaultNow(),
    totalReviews: integer('total_reviews').default(0),
    correctReviews: integer('correct_reviews').default(0),
    lastReviewDate: timestamp('last_review_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('progress_user_vocab_idx').on(table.userId, table.localVocabularyId),
    index('progress_next_review_idx').on(table.userId, table.nextReviewDate),
  ]
)

export const learningProgressRelations = relations(learningProgress, ({ one }) => ({
  user: one(users, { fields: [learningProgress.userId], references: [users.id] }),
}))

// ============================================================================
// User Data (Gamification, Achievements, Settings as JSONB)
// ============================================================================

export const userData = pgTable('user_data', {
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  gamification: jsonb('gamification').default({}),
  achievements: jsonb('achievements').default({}),
  settings: jsonb('settings').default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const userDataRelations = relations(userData, ({ one }) => ({
  user: one(users, { fields: [userData.userId], references: [users.id] }),
}))

// ============================================================================
// Device Transfer Tokens (secure account transfer between devices)
// ============================================================================

export const deviceTransferTokens = pgTable('device_transfer_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 64 }).unique().notNull(),
  pin: varchar('pin', { length: 4 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const deviceTransferTokensRelations = relations(deviceTransferTokens, ({ one }) => ({
  user: one(users, { fields: [deviceTransferTokens.userId], references: [users.id] }),
}))

// ============================================================================
// Networks (Classes/Study Groups)
// ============================================================================

export const networks = pgTable('networks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'class' | 'study_group' | 'family'
  inviteCode: varchar('invite_code', { length: 7 }).unique().notNull(), // XXX-XXX
  ownerId: uuid('owner_id')
    .references(() => users.id, { onDelete: 'set null' }),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
})

export const networksRelations = relations(networks, ({ one, many }) => ({
  owner: one(users, { fields: [networks.ownerId], references: [users.id] }),
  members: many(networkMembers),
  sharedBooks: many(networkSharedBooks),
}))

// ============================================================================
// Network Members
// ============================================================================

export const networkMembers = pgTable(
  'network_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    networkId: uuid('network_id')
      .references(() => networks.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: varchar('role', { length: 20 }).notNull(), // 'child' | 'parent' | 'teacher' | 'admin'
    nickname: varchar('nickname', { length: 50 }),
    visibility: varchar('visibility', { length: 20 }).default('visible'),
    joinStatus: varchar('join_status', { length: 20 }).default('active'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex('network_member_idx').on(table.networkId, table.userId)]
)

export const networkMembersRelations = relations(networkMembers, ({ one }) => ({
  network: one(networks, { fields: [networkMembers.networkId], references: [networks.id] }),
  user: one(users, { fields: [networkMembers.userId], references: [users.id] }),
}))

// ============================================================================
// Competition Stats (Aggregated, Privacy-Preserving)
// ============================================================================

export const competitionStats = pgTable(
  'competition_stats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    periodType: varchar('period_type', { length: 20 }).notNull(), // 'daily' | 'weekly' | 'monthly' | 'all_time'
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    wordsReviewed: integer('words_reviewed').default(0),
    wordsMastered: integer('words_mastered').default(0),
    accuracyPercentage: decimal('accuracy_percentage', { precision: 5, scale: 2 }).default('0'),
    xpEarned: integer('xp_earned').default(0),
    streakDays: integer('streak_days').default(0),
    sessionsCompleted: integer('sessions_completed').default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('stats_user_period_idx').on(table.userId, table.periodType, table.periodStart),
    index('stats_period_type_idx').on(table.periodType),
  ]
)

export const competitionStatsRelations = relations(competitionStats, ({ one }) => ({
  user: one(users, { fields: [competitionStats.userId], references: [users.id] }),
}))

// ============================================================================
// Network Shared Books
// ============================================================================

export const networkSharedBooks = pgTable('network_shared_books', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookId: uuid('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  ownerId: uuid('owner_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  networkId: uuid('network_id')
    .references(() => networks.id, { onDelete: 'cascade' })
    .notNull(),
  permissions: varchar('permissions', { length: 20 }).default('copy'),
  copyCount: integer('copy_count').default(0),
  sharedAt: timestamp('shared_at', { withTimezone: true }).defaultNow(),
})

export const networkSharedBooksRelations = relations(networkSharedBooks, ({ one }) => ({
  book: one(books, { fields: [networkSharedBooks.bookId], references: [books.id] }),
  owner: one(users, { fields: [networkSharedBooks.ownerId], references: [users.id] }),
  network: one(networks, { fields: [networkSharedBooks.networkId], references: [networks.id] }),
}))

// ============================================================================
// Book Copies (Tracking)
// ============================================================================

export const bookCopies = pgTable('book_copies', {
  id: uuid('id').defaultRandom().primaryKey(),
  originalBookId: uuid('original_book_id')
    .references(() => books.id, { onDelete: 'set null' }),
  copiedBookId: uuid('copied_book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  copiedBy: uuid('copied_by')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  copiedFromUserId: uuid('copied_from_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  copiedAt: timestamp('copied_at', { withTimezone: true }).defaultNow(),
})

export const bookCopiesRelations = relations(bookCopies, ({ one }) => ({
  originalBook: one(books, { fields: [bookCopies.originalBookId], references: [books.id] }),
  copiedBook: one(books, { fields: [bookCopies.copiedBookId], references: [books.id] }),
  copier: one(users, { fields: [bookCopies.copiedBy], references: [users.id] }),
  originalOwner: one(users, { fields: [bookCopies.copiedFromUserId], references: [users.id] }),
}))

// ============================================================================
// User Blocks
// ============================================================================

export const userBlocks = pgTable(
  'user_blocks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    blockerId: uuid('blocker_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    blockedId: uuid('blocked_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    blockType: varchar('block_type', { length: 20 }).default('full'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex('user_block_idx').on(table.blockerId, table.blockedId)]
)

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(users, { fields: [userBlocks.blockerId], references: [users.id] }),
  blocked: one(users, { fields: [userBlocks.blockedId], references: [users.id] }),
}))

// ============================================================================
// Content Reports
// ============================================================================

export const contentReports = pgTable('content_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id')
    .references(() => users.id, { onDelete: 'set null' }),
  reportedUserId: uuid('reported_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  reportedBookId: uuid('reported_book_id')
    .references(() => books.id, { onDelete: 'set null' }),
  networkId: uuid('network_id')
    .references(() => networks.id, { onDelete: 'set null' }),
  reportType: varchar('report_type', { length: 30 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  reporter: one(users, { fields: [contentReports.reporterId], references: [users.id] }),
  reportedUser: one(users, { fields: [contentReports.reportedUserId], references: [users.id] }),
  reportedBook: one(books, { fields: [contentReports.reportedBookId], references: [books.id] }),
  network: one(networks, { fields: [contentReports.networkId], references: [networks.id] }),
}))

// ============================================================================
// Deletion Requests (Protected Content)
// ============================================================================

export const deletionRequests = pgTable('deletion_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  itemType: varchar('item_type', { length: 30 }).notNull(),
  itemId: uuid('item_id').notNull(),
  totalReviews: integer('total_reviews').default(0),
  requiresConfirmation: boolean('requires_confirmation').default(false),
  status: varchar('status', { length: 20 }).default('pending'),
  confirmedBy: uuid('confirmed_by')
    .references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const deletionRequestsRelations = relations(deletionRequests, ({ one }) => ({
  user: one(users, { fields: [deletionRequests.userId], references: [users.id] }),
  confirmer: one(users, { fields: [deletionRequests.confirmedBy], references: [users.id] }),
}))

// ============================================================================
// Type Exports
// ============================================================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Book = typeof books.$inferSelect
export type NewBook = typeof books.$inferInsert
export type Chapter = typeof chapters.$inferSelect
export type NewChapter = typeof chapters.$inferInsert
export type Section = typeof sections.$inferSelect
export type NewSection = typeof sections.$inferInsert
export type VocabularyItem = typeof vocabularyItems.$inferSelect
export type NewVocabularyItem = typeof vocabularyItems.$inferInsert
export type LearningProgress = typeof learningProgress.$inferSelect
export type NewLearningProgress = typeof learningProgress.$inferInsert
export type UserData = typeof userData.$inferSelect
export type NewUserData = typeof userData.$inferInsert

// Network Types
export type Network = typeof networks.$inferSelect
export type NewNetwork = typeof networks.$inferInsert
export type NetworkMember = typeof networkMembers.$inferSelect
export type NewNetworkMember = typeof networkMembers.$inferInsert
export type CompetitionStats = typeof competitionStats.$inferSelect
export type NewCompetitionStats = typeof competitionStats.$inferInsert
export type NetworkSharedBook = typeof networkSharedBooks.$inferSelect
export type NewNetworkSharedBook = typeof networkSharedBooks.$inferInsert
export type BookCopy = typeof bookCopies.$inferSelect
export type NewBookCopy = typeof bookCopies.$inferInsert
export type UserBlock = typeof userBlocks.$inferSelect
export type NewUserBlock = typeof userBlocks.$inferInsert
export type ContentReport = typeof contentReports.$inferSelect
export type NewContentReport = typeof contentReports.$inferInsert
export type DeletionRequest = typeof deletionRequests.$inferSelect
export type NewDeletionRequest = typeof deletionRequests.$inferInsert
export type DeviceTransferToken = typeof deviceTransferTokens.$inferSelect
export type NewDeviceTransferToken = typeof deviceTransferTokens.$inferInsert
