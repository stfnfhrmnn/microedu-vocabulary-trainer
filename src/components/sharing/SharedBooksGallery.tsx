'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Copy, User, Check, Loader2 } from 'lucide-react'

interface SharedBook {
  id: string
  book: {
    id: string
    name: string
    language: string
    coverColor: string
    description?: string
  }
  owner: {
    id: string
    name: string
    avatar: string
  }
  copyCount: number
  sharedAt: string
  alreadyCopied: boolean
  isOwner: boolean
}

interface SharedBooksGalleryProps {
  networkId: string
  onCopy?: (bookId: string) => void
}

export function SharedBooksGallery({ networkId, onCopy }: SharedBooksGalleryProps) {
  const [sharedBooks, setSharedBooks] = useState<SharedBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSharedBooks() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/networks/${networkId}/shared-books`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch shared books')
        }

        const data = await response.json()
        setSharedBooks(data.sharedBooks || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSharedBooks()
  }, [networkId])

  const handleCopy = async (sharedBookId: string) => {
    setCopyingId(sharedBookId)
    try {
      const response = await fetch(`/api/shared-books/${sharedBookId}/copy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Kopieren')
      }

      // Update local state
      setSharedBooks((prev) =>
        prev.map((book) =>
          book.id === sharedBookId
            ? { ...book, alreadyCopied: true, copyCount: book.copyCount + 1 }
            : book
        )
      )

      onCopy?.(data.copiedBook.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Kopieren')
    } finally {
      setCopyingId(null)
    }
  }

  const getLanguageEmoji = (language: string) => {
    switch (language) {
      case 'french':
        return '🇫🇷'
      case 'spanish':
        return '🇪🇸'
      case 'latin':
        return '🏛️'
      default:
        return '📚'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (sharedBooks.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl border-dashed">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          Noch keine Bücher geteilt
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Teile deine Bücher, damit andere sie kopieren können
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        Geteilte Bücher
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence>
          {sharedBooks.map((sharedBook, index) => (
            <motion.div
              key={sharedBook.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-card border rounded-xl"
            >
              <div className="flex gap-3">
                {/* Book Cover */}
                <div
                  className="w-16 h-20 rounded-lg flex items-center justify-center text-2xl shadow-inner"
                  style={{ backgroundColor: sharedBook.book.coverColor }}
                >
                  {getLanguageEmoji(sharedBook.book.language)}
                </div>

                {/* Book Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{sharedBook.book.name}</h3>
                  {sharedBook.book.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {sharedBook.book.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {sharedBook.owner.name}
                    </span>
                    <span>•</span>
                    <span>{sharedBook.copyCount} Kopien</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex justify-end">
                {sharedBook.isOwner ? (
                  <span className="text-sm text-muted-foreground">Dein Buch</span>
                ) : sharedBook.alreadyCopied ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Kopiert
                  </span>
                ) : (
                  <button
                    onClick={() => handleCopy(sharedBook.id)}
                    disabled={copyingId === sharedBook.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {copyingId === sharedBook.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Kopiere...
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Kopieren
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
