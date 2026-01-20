'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, useModal } from '@/components/ui/Modal'
import { useBook, useChapters } from '@/lib/db/hooks/useBooks'
import { useVocabularyByChapter } from '@/lib/db/hooks/useVocabulary'
import { createChapter, deleteBook } from '@/lib/db/db'
import type { Chapter } from '@/lib/db/schema'

function ChapterCard({ chapter, bookId }: { chapter: Chapter; bookId: string }) {
  const { vocabulary } = useVocabularyByChapter(chapter.id)

  return (
    <Link href={`/library/${bookId}/${chapter.id}`}>
      <Card interactive className="h-full">
        <CardContent className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{chapter.name}</h3>
            <p className="text-sm text-gray-500">{vocabulary.length} Vokabeln</p>
          </div>
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3"
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

export default function BookPageContent({ bookId }: { bookId: string }) {
  const router = useRouter()

  const { book, isLoading: bookLoading } = useBook(bookId)
  const { chapters, isLoading: chaptersLoading } = useChapters(bookId)
  const addModal = useModal()
  const deleteModal = useModal()

  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoading = bookLoading || chaptersLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await createChapter({
        name: name.trim(),
        bookId,
        order: chapters.length,
      })
      addModal.close()
      setName('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      await deleteBook(bookId)
      router.push('/library')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!book && !isLoading) {
    return (
      <PageContainer>
        <Header title="Buch nicht gefunden" showBack />
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Dieses Buch existiert nicht.</p>
            <Link href="/library">
              <Button variant="primary" className="mt-4">
                Zur Bibliothek
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Header
        title={book?.name || 'Laden...'}
        showBack
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={deleteModal.open}>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
            <Button variant="primary" size="sm" onClick={addModal.open}>
              + Kapitel
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : chapters.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Kapitel</h3>
            <p className="text-gray-500 text-sm mb-4">
              Füge Kapitel hinzu um deine Vokabeln zu organisieren.
            </p>
            <Button variant="primary" onClick={addModal.open}>
              Erstes Kapitel erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {chapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ChapterCard chapter={chapter} bookId={bookId} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Chapter Modal */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.close} title="Neues Kapitel">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            placeholder="z.B. Unité 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={addModal.close}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.close} title="Buch löschen?">
        <div className="space-y-4">
          <p className="text-gray-600">
            Möchtest du <strong>{book?.name}</strong> wirklich löschen? Alle Kapitel
            und Vokabeln werden unwiderruflich gelöscht.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={deleteModal.close}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              loading={isSubmitting}
              onClick={handleDelete}
            >
              Löschen
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
