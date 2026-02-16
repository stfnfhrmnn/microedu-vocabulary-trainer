'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit2,
  Camera,
  ArrowUpDown,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Modal, useModal } from '@/components/ui/Modal'
import { EditNameModal } from '@/components/ui/EditNameModal'
import { VocabularyList } from '@/components/library/VocabularyList'
import { useBook, useChapter, useSections } from '@/lib/db/hooks/useBooks'
import { useVocabulary, useSectionVocabularyCount } from '@/lib/db/hooks/useVocabulary'
import {
  createSection,
  deleteChapter,
  toggleSectionCovered,
  deleteSection,
  updateChapter,
  updateSection,
  createVocabularyItem,
  reorderItems,
} from '@/lib/db/db'
import { useSettings } from '@/stores/settings'
import { useCurrentProfile } from '@/stores/user-session'
import type { Language, Section } from '@/lib/db/schema'

// Expandable section with inline vocabulary
function ExpandableSection({
  section,
  bookId,
  bookLanguage,
  isExpanded,
  onToggleExpand,
  onToggleCovered,
  onDelete,
  onEdit,
}: {
  section: Section
  bookId: string
  bookLanguage?: Language
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleCovered: (covered: boolean) => void
  onDelete: () => void
  onEdit: () => void
}) {
  const vocabCount = useSectionVocabularyCount(section.id)
  const { vocabulary } = useVocabulary(isExpanded ? section.id : undefined)
  const [showMenu, setShowMenu] = useState(false)

  const handleAddVocabulary = async (source: string, target: string) => {
    await createVocabularyItem({
      sourceText: source,
      targetText: target,
      sectionId: section.id,
      chapterId: section.chapterId,
      bookId,
    })
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Section Header - Click to expand */}
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{section.name}</h3>
            <p className="text-sm text-gray-500">{vocabCount} Vokabeln</p>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {section.coveredInClass && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Im Unterricht
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="p-3 space-y-2">
                <Toggle
                  checked={section.coveredInClass}
                  onChange={onToggleCovered}
                  label="Im Unterricht behandelt"
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" fullWidth onClick={onEdit}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Umbenennen
                  </Button>
                  <Button variant="danger" size="sm" fullWidth onClick={onDelete}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Löschen
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Content - Vocabulary List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-100">
                <VocabularyList
                  vocabulary={vocabulary}
                  bookId={bookId}
                  bookLanguage={bookLanguage}
                  currentSectionId={section.id}
                  currentChapterId={section.chapterId}
                  showInlineAdd
                  onAddVocabulary={handleAddVocabulary}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function ReorderableSectionCard({
  section,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: {
  section: Section
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const vocabCount = useSectionVocabularyCount(section.id)

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{section.name}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">{vocabCount} Vokabeln</p>
            {section.coveredInClass && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Im Unterricht
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// Breadcrumb component
function Breadcrumb({
  bookId,
  bookName,
  chapterName,
}: {
  bookId: string
  bookName: string
  chapterName: string
}) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 overflow-x-auto">
      <Link href="/library" className="hover:text-primary-600 whitespace-nowrap">
        Bibliothek
      </Link>
      <ChevronRight className="w-4 h-4 flex-shrink-0" />
      <Link href={`/library/${bookId}`} className="hover:text-primary-600 whitespace-nowrap">
        {bookName}
      </Link>
      <ChevronRight className="w-4 h-4 flex-shrink-0" />
      <span className="text-gray-900 font-medium whitespace-nowrap">{chapterName}</span>
    </nav>
  )
}

export default function ChapterPageContent({
  bookId,
  chapterId,
}: {
  bookId: string
  chapterId: string
}) {
  const router = useRouter()
  const profile = useCurrentProfile()
  const { lastViewedSections, setLastViewedSection } = useSettings()

  const { book } = useBook(bookId)
  const { chapter, isLoading: chapterLoading } = useChapter(chapterId)
  const { sections, isLoading: sectionsLoading } = useSections(chapterId)

  const addModal = useModal()
  const deleteChapterModal = useModal()
  const deleteSectionModal = useModal()
  const editChapterModal = useModal()
  const editSectionModal = useModal()
  const menuModal = useModal()

  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)
  const [isReorderMode, setIsReorderMode] = useState(false)

  const isLoading = chapterLoading || sectionsLoading

  // Restore last viewed section
  useEffect(() => {
    if (sections.length > 0 && !expandedSectionId) {
      const lastViewed = lastViewedSections[chapterId]
      if (lastViewed && sections.some((s) => s.id === lastViewed)) {
        setExpandedSectionId(lastViewed)
      }
    }
  }, [sections, chapterId, lastViewedSections, expandedSectionId])

  const editingSection = sections.find((s) => s.id === editingSectionId)
  const deletingSection = sections.find((s) => s.id === deletingSectionId)

  const handleToggleSection = (sectionId: string) => {
    const newExpanded = expandedSectionId === sectionId ? null : sectionId
    setExpandedSectionId(newExpanded)
    if (newExpanded) {
      setLastViewedSection(chapterId, newExpanded)
    }
  }

  const handleEditChapterName = async (newName: string) => {
    await updateChapter(chapterId, { name: newName })
  }

  const handleEditSectionName = async (newName: string) => {
    if (!editingSectionId) return
    await updateSection(editingSectionId, { name: newName })
  }

  const handleOpenEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId)
    editSectionModal.open()
  }

  const handleOpenDeleteSection = (sectionId: string) => {
    setDeletingSectionId(sectionId)
    deleteSectionModal.open()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const newSection = await createSection({
        name: name.trim(),
        chapterId,
        bookId,
        order: sections.length,
        coveredInClass: false,
      })
      addModal.close()
      setName('')
      // Auto-expand the new section
      setExpandedSectionId(newSection.id)
      setLastViewedSection(chapterId, newSection.id)
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

  const handleDeleteSection = async () => {
    if (!deletingSectionId) return
    await deleteSection(deletingSectionId)
    if (expandedSectionId === deletingSectionId) {
      setExpandedSectionId(null)
    }
    setDeletingSectionId(null)
    deleteSectionModal.close()
  }

  const handleToggleCovered = async (sectionId: string, covered: boolean) => {
    await toggleSectionCovered(sectionId, covered)
  }

  const handleReorderSection = async (fromIndex: number, toIndex: number) => {
    const ids = sections.map((s) => s.id)
    const [moved] = ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, moved)
    await reorderItems('sections', ids)
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
          isReorderMode ? (
            <Button variant="primary" size="sm" onClick={() => setIsReorderMode(false)}>
              Fertig
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={menuModal.open}>
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </Button>
              <Button variant="primary" size="sm" onClick={addModal.open}>
                <Plus className="w-4 h-4 mr-1" />
                Abschnitt
              </Button>
            </div>
          )
        }
      />

      {/* Breadcrumb */}
      {book && chapter && (
        <Breadcrumb bookId={bookId} bookName={book.name} chapterName={chapter.name} />
      )}
      <p className="text-xs text-gray-500 mb-3">
        Besitzer: {profile.avatar} {profile.name}
      </p>

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
        <div className="space-y-3">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {isReorderMode ? (
                <ReorderableSectionCard
                  section={section}
                  index={index}
                  total={sections.length}
                  onMoveUp={() => handleReorderSection(index, index - 1)}
                  onMoveDown={() => handleReorderSection(index, index + 1)}
                />
              ) : (
                <ExpandableSection
                  section={section}
                  bookId={bookId}
                  bookLanguage={book?.language}
                  isExpanded={expandedSectionId === section.id}
                  onToggleExpand={() => handleToggleSection(section.id)}
                  onToggleCovered={(covered) => handleToggleCovered(section.id, covered)}
                  onDelete={() => handleOpenDeleteSection(section.id)}
                  onEdit={() => handleOpenEditSection(section.id)}
                />
              )}
            </motion.div>
          ))}
        </div>
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
            <Button type="button" variant="secondary" fullWidth onClick={addModal.close}>
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

      {/* Chapter Actions Menu Modal */}
      <Modal isOpen={menuModal.isOpen} onClose={menuModal.close} title="Kapitel-Optionen">
        <div className="space-y-2">
          <Link href={`/add/scan?bookId=${bookId}&chapterId=${chapterId}`}>
            <Button variant="secondary" fullWidth className="justify-start">
              <Camera className="w-4 h-4 mr-2" />
              Vokabeln scannen
            </Button>
          </Link>
          {sections.length > 1 && (
            <Button
              variant="secondary"
              fullWidth
              className="justify-start"
              onClick={() => {
                menuModal.close()
                setIsReorderMode(true)
              }}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Abschnitte sortieren
            </Button>
          )}
          <Button
            variant="secondary"
            fullWidth
            className="justify-start"
            onClick={() => {
              menuModal.close()
              editChapterModal.open()
            }}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Kapitel umbenennen
          </Button>
          <Button
            variant="danger"
            fullWidth
            className="justify-start"
            onClick={() => {
              menuModal.close()
              deleteChapterModal.open()
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Kapitel löschen
          </Button>
        </div>
      </Modal>

      {/* Delete Chapter Modal */}
      <Modal
        isOpen={deleteChapterModal.isOpen}
        onClose={deleteChapterModal.close}
        title="Kapitel löschen?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Möchtest du <strong>{chapter?.name}</strong> wirklich löschen? Alle Abschnitte
            und Vokabeln werden unwiderruflich gelöscht.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={deleteChapterModal.close}
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

      {/* Delete Section Modal */}
      <Modal
        isOpen={deleteSectionModal.isOpen}
        onClose={deleteSectionModal.close}
        title="Abschnitt löschen?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Möchtest du <strong>{deletingSection?.name}</strong> wirklich löschen? Alle
            Vokabeln in diesem Abschnitt werden unwiderruflich gelöscht.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={deleteSectionModal.close}
            >
              Abbrechen
            </Button>
            <Button type="button" variant="danger" fullWidth onClick={handleDeleteSection}>
              Löschen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Chapter Name Modal */}
      <EditNameModal
        isOpen={editChapterModal.isOpen}
        onClose={editChapterModal.close}
        currentName={chapter?.name || ''}
        onSave={handleEditChapterName}
        title="Kapitel umbenennen"
        label="Name"
        placeholder="z.B. Unité 1"
      />

      {/* Edit Section Name Modal */}
      <EditNameModal
        isOpen={editSectionModal.isOpen}
        onClose={() => {
          editSectionModal.close()
          setEditingSectionId(null)
        }}
        currentName={editingSection?.name || ''}
        onSave={handleEditSectionName}
        title="Abschnitt umbenennen"
        label="Name"
        placeholder="z.B. Vokabeln S. 42"
      />
    </PageContainer>
  )
}
