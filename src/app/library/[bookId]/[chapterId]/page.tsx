'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Modal, useModal } from '@/components/ui/Modal'
import { useBook, useChapter, useSections } from '@/lib/db/hooks/useBooks'
import { useVocabulary, useSectionVocabularyCount } from '@/lib/db/hooks/useVocabulary'
import { createSection, deleteChapter, toggleSectionCovered, deleteSection } from '@/lib/db/db'
import type { Section, VocabularyItem } from '@/lib/db/schema'

function SectionCard({
  section,
  onToggleCovered,
  onDelete,
}: {
  section: Section
  onToggleCovered: (covered: boolean) => void
  onDelete: () => void
}) {
  const vocabCount = useSectionVocabularyCount(section.id)
  const [showDelete, setShowDelete] = useState(false)

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{section.name}</h3>
            <p className="text-sm text-gray-500">{vocabCount} Vokabeln</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDelete(!showDelete)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {showDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
            <Button variant="danger" size="sm" fullWidth onClick={onDelete}>
              Abschnitt löschen
            </Button>
          </motion.div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100">
          <Toggle
            checked={section.coveredInClass}
            onChange={onToggleCovered}
            label="Im Unterricht behandelt"
            description={section.coveredInClass ? 'Wird bei Übungen berücksichtigt' : ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function VocabularyListItem({
  item,
  onDelete,
}: {
  item: VocabularyItem
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 mr-3">
        <p className="font-medium text-gray-900">{item.sourceText}</p>
        <p className="text-sm text-gray-500">{item.targetText}</p>
        {item.notes && <p className="text-xs text-gray-400 mt-1">{item.notes}</p>}
      </div>
      <button onClick={onDelete} className="p-2 text-gray-400 hover:text-error-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  )
}

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.bookId as string
  const chapterId = params.chapterId as string

  const { book } = useBook(bookId)
  const { chapter, isLoading: chapterLoading } = useChapter(chapterId)
  const { sections, isLoading: sectionsLoading } = useSections(chapterId)

  const addModal = useModal()
  const deleteModal = useModal()

  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

  const { vocabulary, deleteVocabularyItem } = useVocabulary(selectedSectionId || undefined)

  const isLoading = chapterLoading || sectionsLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await createSection({
        name: name.trim(),
        chapterId,
        bookId,
        order: sections.length,
        coveredInClass: false,
      })
      addModal.close()
      setName('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteChapter = async () => {
    setIsSubmitting(true)
    try {
      await deleteChapter(chapterId)
      router.push(`/library/${bookId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleCovered = async (sectionId: string, covered: boolean) => {
    await toggleSectionCovered(sectionId, covered)
  }

  const handleDeleteSection = async (sectionId: string) => {
    await deleteSection(sectionId)
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null)
    }
  }

  if (!chapter && !isLoading) {
    return (
      <PageContainer>
        <Header title="Kapitel nicht gefunden" showBack />
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Dieses Kapitel existiert nicht.</p>
            <Link href={`/library/${bookId}`}>
              <Button variant="primary" className="mt-4">
                Zurück zum Buch
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
        title={chapter?.name || 'Laden...'}
        showBack
        onBack={() => router.push(`/library/${bookId}`)}
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
              + Abschnitt
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sections.length === 0 ? (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Abschnitte</h3>
            <p className="text-gray-500 text-sm mb-4">
              Füge Abschnitte hinzu um deine Vokabeln zu gruppieren.
            </p>
            <Button variant="primary" onClick={addModal.open}>
              Ersten Abschnitt erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sections */}
          <div className="space-y-3 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Abschnitte
            </h2>
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SectionCard
                  section={section}
                  onToggleCovered={(covered) => handleToggleCovered(section.id, covered)}
                  onDelete={() => handleDeleteSection(section.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Vocabulary by Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Vokabeln
            </h2>

            {/* Section Tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() =>
                    setSelectedSectionId(
                      selectedSectionId === section.id ? null : section.id
                    )
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedSectionId === section.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {section.name}
                </button>
              ))}
            </div>

            {selectedSectionId ? (
              vocabulary.length > 0 ? (
                <Card>
                  <CardContent padding="sm">
                    {vocabulary.map((item) => (
                      <VocabularyListItem
                        key={item.id}
                        item={item}
                        onDelete={() => deleteVocabularyItem(item.id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">
                      Noch keine Vokabeln in diesem Abschnitt.
                    </p>
                    <Link href={`/add?sectionId=${selectedSectionId}`}>
                      <Button variant="primary" size="sm" className="mt-4">
                        Vokabeln hinzufügen
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    Wähle einen Abschnitt um die Vokabeln zu sehen.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Add Section Modal */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.close} title="Neuer Abschnitt">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            placeholder="z.B. Vokabeln S. 42"
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

      {/* Delete Chapter Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Kapitel löschen?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Möchtest du <strong>{chapter?.name}</strong> wirklich löschen? Alle
            Abschnitte und Vokabeln werden unwiderruflich gelöscht.
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
              onClick={handleDeleteChapter}
            >
              Löschen
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
