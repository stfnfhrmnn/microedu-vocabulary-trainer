'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, ChevronDown, MoreHorizontal, Plus, Trash2, Edit2, Camera, Image } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, useModal } from '@/components/ui/Modal'
import { EditNameModal } from '@/components/ui/EditNameModal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { CreateFromImageModal } from '@/components/library/CreateFromImageModal'
import { useBook, useChapters } from '@/lib/db/hooks/useBooks'
import { useVocabularyByChapter, useBookLevelVocabulary } from '@/lib/db/hooks/useVocabulary'
import { createChapter, deleteBook, updateBook, deleteVocabularyItem } from '@/lib/db/db'
import type { Chapter } from '@/lib/db/schema'

// Breadcrumb component
function Breadcrumb({ bookName }: { bookName: string }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 overflow-x-auto">
      <Link href="/library" className="hover:text-primary-600 whitespace-nowrap">
        Bibliothek
      </Link>
      <ChevronRight className="w-4 h-4 flex-shrink-0" />
      <span className="text-gray-900 font-medium whitespace-nowrap">{bookName}</span>
    </nav>
  )
}

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

function UnsortedVocabularyCard({ bookId }: { bookId: string }) {
  const { vocabulary, isLoading } = useBookLevelVocabulary(bookId)
  const [isExpanded, setIsExpanded] = useState(false)
  const [deletingVocabId, setDeletingVocabId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingVocabId) return
    await deleteVocabularyItem(deletingVocabId)
    setDeletingVocabId(null)
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-0">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">Unsortiert</h3>
            <p className="text-sm text-gray-500">
              {isLoading ? 'Lade…' : `${vocabulary.length} Vokabeln`}
            </p>
          </div>
          <Link
            href={`/add?bookId=${bookId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Schnell hinzufügen
          </Link>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100"
            >
              {vocabulary.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {vocabulary.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-gray-900">{item.sourceText}</p>
                        <p className="text-sm text-gray-500">{item.targetText}</p>
                        {item.notes && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingVocabId(item.id)
                        }}
                        className="p-2 text-gray-400 hover:text-error-500 hover:bg-error-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  Noch keine unsortierten Vokabeln.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <Modal
        isOpen={!!deletingVocabId}
        onClose={() => setDeletingVocabId(null)}
        title="Vokabel löschen?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Möchtest du diese Vokabel wirklich löschen?
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeletingVocabId(null)}>
              Abbrechen
            </Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Löschen
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

export default function BookPageContent({ bookId }: { bookId: string }) {
  const router = useRouter()

  const { book, isLoading: bookLoading } = useBook(bookId)
  const { chapters, isLoading: chaptersLoading } = useChapters(bookId)
  const addModal = useModal()
  const deleteModal = useModal()
  const editNameModal = useModal()
  const imageModal = useModal()
  const menuModal = useModal()

  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoading = bookLoading || chaptersLoading

  const handleEditBookName = async (newName: string) => {
    await updateBook(bookId, { name: newName })
  }

  const handleCreateChapterFromImage = async (chapterName: string) => {
    await createChapter({
      name: chapterName,
      bookId,
      order: chapters.length,
    })
  }

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
    await deleteBook(bookId)
    router.push('/library')
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
            <Button variant="ghost" size="icon" onClick={menuModal.open}>
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </Button>
            <Button variant="primary" size="sm" onClick={addModal.open}>
              <Plus className="w-4 h-4 mr-1" />
              Kapitel
            </Button>
          </div>
        }
      />

      {/* Breadcrumb */}
      {book && <Breadcrumb bookName={book.name} />}

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
        <>
          <UnsortedVocabularyCard bookId={bookId} />
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
        </>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <UnsortedVocabularyCard bookId={bookId} />
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
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Buch löschen?"
        message={`Möchtest du „${book?.name}" wirklich löschen? Alle Kapitel und Vokabeln werden unwiderruflich gelöscht.`}
        confirmText="Löschen"
        variant="danger"
      />

      {/* Edit Book Name Modal */}
      <EditNameModal
        isOpen={editNameModal.isOpen}
        onClose={editNameModal.close}
        currentName={book?.name || ''}
        onSave={handleEditBookName}
        title="Buch umbenennen"
        label="Name"
        placeholder="z.B. Découvertes 2"
      />

      {/* Create Chapter from Image Modal */}
      <CreateFromImageModal
        isOpen={imageModal.isOpen}
        onClose={imageModal.close}
        type="chapter"
        onCreateChapter={handleCreateChapterFromImage}
        bookId={bookId}
        bookLanguage={book?.language}
      />

      {/* Book Actions Menu Modal */}
      <Modal isOpen={menuModal.isOpen} onClose={menuModal.close} title="Buch-Optionen">
        <div className="space-y-2">
          <Link href={`/add/scan?bookId=${bookId}`}>
            <Button variant="secondary" fullWidth className="justify-start">
              <Camera className="w-4 h-4 mr-2" />
              Vokabeln scannen
            </Button>
          </Link>
          <Button
            variant="secondary"
            fullWidth
            className="justify-start"
            onClick={() => {
              menuModal.close()
              imageModal.open()
            }}
          >
            <Image className="w-4 h-4 mr-2" />
            Kapitel aus Bild erstellen
          </Button>
          <Button
            variant="secondary"
            fullWidth
            className="justify-start"
            onClick={() => {
              menuModal.close()
              editNameModal.open()
            }}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Buch umbenennen
          </Button>
          <Button
            variant="danger"
            fullWidth
            className="justify-start"
            onClick={() => {
              menuModal.close()
              deleteModal.open()
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Buch löschen
          </Button>
        </div>
      </Modal>
    </PageContainer>
  )
}
