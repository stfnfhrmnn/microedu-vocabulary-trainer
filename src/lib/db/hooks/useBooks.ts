'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db, createBook, updateBook, deleteBook } from '../db'
import type { CreateBook } from '../schema'

export function useBooks() {
  const books = useLiveQuery(() => db.books.orderBy('name').toArray(), [])

  return {
    books: books ?? [],
    isLoading: books === undefined,
    createBook,
    updateBook,
    deleteBook,
  }
}

export function useBook(bookId: string | undefined) {
  const book = useLiveQuery(
    () => (bookId ? db.books.get(bookId) : undefined),
    [bookId]
  )

  return {
    book,
    isLoading: bookId ? book === undefined : false,
    updateBook: (data: Partial<CreateBook>) =>
      bookId ? updateBook(bookId, data) : Promise.resolve(),
    deleteBook: () => (bookId ? deleteBook(bookId) : Promise.resolve()),
  }
}

export function useChapters(bookId: string | undefined) {
  const chapters = useLiveQuery(
    () =>
      bookId
        ? db.chapters.where('bookId').equals(bookId).sortBy('order')
        : [],
    [bookId]
  )

  return {
    chapters: chapters ?? [],
    isLoading: bookId ? chapters === undefined : false,
  }
}

export function useChapter(chapterId: string | undefined) {
  const chapter = useLiveQuery(
    () => (chapterId ? db.chapters.get(chapterId) : undefined),
    [chapterId]
  )

  return {
    chapter,
    isLoading: chapterId ? chapter === undefined : false,
  }
}

export function useSections(chapterId: string | undefined) {
  const sections = useLiveQuery(
    () =>
      chapterId
        ? db.sections.where('chapterId').equals(chapterId).sortBy('order')
        : [],
    [chapterId]
  )

  return {
    sections: sections ?? [],
    isLoading: chapterId ? sections === undefined : false,
  }
}

export function useSection(sectionId: string | undefined) {
  const section = useLiveQuery(
    () => (sectionId ? db.sections.get(sectionId) : undefined),
    [sectionId]
  )

  return {
    section,
    isLoading: sectionId ? section === undefined : false,
  }
}

export function useAllSections() {
  const sections = useLiveQuery(async () => {
    const allSections = await db.sections.toArray()
    const books = await db.books.toArray()
    const chapters = await db.chapters.toArray()

    const bookMap = new Map(books.map((b) => [b.id, b]))
    const chapterMap = new Map(chapters.map((c) => [c.id, c]))

    return allSections.map((section) => ({
      ...section,
      chapter: chapterMap.get(section.chapterId),
      book: bookMap.get(section.bookId),
    }))
  }, [])

  return {
    sections: sections ?? [],
    isLoading: sections === undefined,
  }
}
