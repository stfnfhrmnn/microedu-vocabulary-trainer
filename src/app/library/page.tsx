'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, useModal } from '@/components/ui/Modal'
import { CreateFromImageModal } from '@/components/library/CreateFromImageModal'
import { useBooks } from '@/lib/db/hooks/useBooks'
import { useVocabularyByBook } from '@/lib/db/hooks/useVocabulary'
import type { Language, Book, CreateBook } from '@/lib/db/schema'

const languageOptions = [
  { value: 'french', label: 'Französisch' },
  { value: 'spanish', label: 'Spanisch' },
  { value: 'latin', label: 'Latein' },
]

const colorOptions = [
  { value: '#3b82f6', label: 'Blau' },
  { value: '#22c55e', label: 'Grün' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Rot' },
  { value: '#8b5cf6', label: 'Lila' },
  { value: '#ec4899', label: 'Pink' },
]

function BookCard({ book }: { book: Book }) {
  const { vocabulary } = useVocabularyByBook(book.id)

  return (
    <Link href={`/library/${book.id}`}>
      <Card interactive className="h-full">
        <CardContent className="flex items-start gap-4">
          <div
            className="w-12 h-16 rounded-lg flex-shrink-0"
            style={{ backgroundColor: book.coverColor }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{book.name}</h3>
            <p className="text-sm text-gray-500">
              {languageOptions.find((l) => l.value === book.language)?.label}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {vocabulary.length} Vokabeln
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function LibraryPage() {
  const { books, isLoading, createBook } = useBooks()
  const modal = useModal()
  const imageModal = useModal()

  const [searchQuery, setSearchQuery] = useState('')
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<Language>('french')
  const [coverColor, setCoverColor] = useState('#3b82f6')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter books based on search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books
    const query = searchQuery.toLowerCase()
    return books.filter(
      (book) =>
        book.name.toLowerCase().includes(query) ||
        languageOptions.find((l) => l.value === book.language)?.label.toLowerCase().includes(query)
    )
  }, [books, searchQuery])

  const handleCreateBookFromImage = async (bookName: string, bookLanguage: Language, bookCoverColor: string) => {
    await createBook({
      name: bookName,
      language: bookLanguage,
      coverColor: bookCoverColor,
    })
  }

  const resetForm = () => {
    setName('')
    setLanguage('french')
    setCoverColor('#3b82f6')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await createBook({
        name: name.trim(),
        language,
        coverColor,
      })
      modal.close()
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <Header
        title="Bibliothek"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={imageModal.open} title="Buch aus Bild erstellen">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Button>
            <Button variant="primary" size="sm" onClick={modal.open}>
              + Buch
            </Button>
          </div>
        }
      />

      {/* Search Bar - only show when there are books */}
      {!isLoading && books.length > 0 && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Bücher suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-16 rounded-lg bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : books.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Bücher</h3>
            <p className="text-gray-500 text-sm mb-4">
              Erstelle dein erstes Buch um Vokabeln zu organisieren.
            </p>
            <Button variant="primary" onClick={modal.open}>
              Erstes Buch erstellen
            </Button>
          </CardContent>
        </Card>
      ) : filteredBooks.length === 0 && searchQuery ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-2">Keine Bücher gefunden für &ldquo;{searchQuery}&rdquo;</p>
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
              Suche zurücksetzen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <BookCard book={book} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Book Modal */}
      <Modal isOpen={modal.isOpen} onClose={modal.close} title="Neues Buch">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            placeholder="z.B. Découvertes 2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <Select
            label="Sprache"
            options={languageOptions}
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Farbe
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setCoverColor(color.value)}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    coverColor === color.value
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={modal.close}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
              disabled={!name.trim()}
            >
              Erstellen
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Book from Image Modal */}
      <CreateFromImageModal
        isOpen={imageModal.isOpen}
        onClose={imageModal.close}
        type="book"
        onCreateBook={handleCreateBookFromImage}
      />
    </PageContainer>
  )
}
