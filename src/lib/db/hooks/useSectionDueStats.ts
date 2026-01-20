'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Section, Book, Chapter } from '../schema'

export interface SectionDueStat {
  section: Section
  book: Book
  chapter: Chapter
  dueCount: number
  totalCount: number
}

export function useSectionDueStats(): {
  sections: SectionDueStat[]
  isLoading: boolean
} {
  const result = useLiveQuery(async () => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // Get all sections, books, and chapters
    const allSections = await db.sections.toArray()
    const allBooks = await db.books.toArray()
    const allChapters = await db.chapters.toArray()

    const bookMap = new Map(allBooks.map((b) => [b.id, b]))
    const chapterMap = new Map(allChapters.map((c) => [c.id, c]))

    // Get all vocabulary items
    const allVocab = await db.vocabularyItems.toArray()

    // Get all learning progress
    const vocabIds = allVocab.map((v) => v.id)
    const progressItems = await db.learningProgress
      .where('vocabularyId')
      .anyOf(vocabIds)
      .toArray()
    const progressMap = new Map(progressItems.map((p) => [p.vocabularyId, p]))

    // Calculate stats for each section
    const sectionStats: SectionDueStat[] = []

    for (const section of allSections) {
      const book = bookMap.get(section.bookId)
      const chapter = chapterMap.get(section.chapterId)

      if (!book || !chapter) continue

      // Get vocabulary for this section
      const sectionVocab = allVocab.filter((v) => v.sectionId === section.id)
      const totalCount = sectionVocab.length

      if (totalCount === 0) continue

      // Count due words
      let dueCount = 0
      for (const vocab of sectionVocab) {
        const progress = progressMap.get(vocab.id)
        if (!progress || progress.nextReviewDate <= today) {
          dueCount++
        }
      }

      sectionStats.push({
        section,
        book,
        chapter,
        dueCount,
        totalCount,
      })
    }

    // Sort by due count (highest first), then by section name
    sectionStats.sort((a, b) => {
      if (b.dueCount !== a.dueCount) {
        return b.dueCount - a.dueCount
      }
      return a.section.name.localeCompare(b.section.name)
    })

    return sectionStats
  }, [])

  return {
    sections: result ?? [],
    isLoading: result === undefined,
  }
}
