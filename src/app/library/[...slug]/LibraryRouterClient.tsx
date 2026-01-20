'use client'

import { useParams } from 'next/navigation'
import BookPageContent from './BookPageContent'
import ChapterPageContent from './ChapterPageContent'

export default function LibraryRouterClient() {
  const params = useParams()
  const slug = params.slug as string[] | undefined

  // No slug params - shouldn't happen
  if (!slug || slug.length === 0) {
    return null
  }

  // Single param - book page
  if (slug.length === 1) {
    return <BookPageContent bookId={slug[0]} />
  }

  // Two params - chapter page
  if (slug.length === 2) {
    return <ChapterPageContent bookId={slug[0]} chapterId={slug[1]} />
  }

  // More params - not found
  return null
}
