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
      .references(() => sections.id, { onDelete: 'cascade' })
      .notNull(),
    chapterId: uuid('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    bookId: uuid('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    localId: varchar('local_id', { length: 36 }).notNull(),
    localSectionId: varchar('local_section_id', { length: 36 }).notNull(),
    localChapterId: varchar('local_chapter_id', { length: 36 }).notNull(),
    localBookId: varchar('local_book_id', { length: 36 }).notNull(),
    sourceText: varchar('source_text', { length: 200 }).notNull(),
    targetText: varchar('target_text', { length: 200 }).notNull(),
    notes: text('notes'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('vocab_user_local_idx').on(table.userId, table.localId)]
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
  (table) => [uniqueIndex('progress_user_vocab_idx').on(table.userId, table.localVocabularyId)]
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
