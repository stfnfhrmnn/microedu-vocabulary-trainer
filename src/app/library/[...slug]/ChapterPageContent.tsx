'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Trash2, Edit2, Camera, Languages } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Modal, useModal } from '@/components/ui/Modal'
import { EditNameModal } from '@/components/ui/EditNameModal'
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
  swapVocabularyLanguages,
} from '@/lib/db/db'
import { useSettings } from '@/stores/settings'
import type { Section, VocabularyItem } from '@/lib/db/schema'

// Expandable section with inline vocabulary
function ExpandableSection({
  section,
  bookId,
  isExpanded,
  onToggleExpand,
  onToggleCovered,
  onDelete,
  onEdit,
}: {
  section: Section
  bookId: string
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleCovered: (covered: boolean) => void
  onDelete: () => void
  onEdit: () => void
}) {
  const vocabCount = useSectionVocabularyCount(section.id)
  const { vocabulary, deleteVocabularyItem } = useVocabulary(isExpanded ? section.id : undefined)
  const [showMenu, setShowMenu] = useState(false)
  const [deletingVocabId, setDeletingVocabId] = useState<string | null>(null)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedVocabularyIds, setSelectedVocabularyIds] = useState<Set<string>>(new Set())
  const [swapScope, setSwapScope] = useState<'all' | 'selected' | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)

  // Inline add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!isExpanded) {
      setIsSelectMode(false)
      setSelectedVocabularyIds(new Set())
      return
    }

    setSelectedVocabularyIds((prev) => {
      const validIds = new Set(vocabulary.map((item) => item.id))
      return new Set([...prev].filter((id) => validIds.has(id)))
    })
  }, [isExpanded, vocabulary])

  const handleAddVocabulary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceText.trim() || !targetText.trim()) return

    setIsAdding(true)
    try {
      await createVocabularyItem({
        sourceText: sourceText.trim(),
        targetText: targetText.trim(),
        sectionId: section.id,
        chapterId: section.chapterId,
        bookId: bookId,
      })
      setSourceText('')
      setTargetText('')
      // Keep form open for adding more
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteVocabulary = async (vocabId: string) => {
    setDeletingVocabId(vocabId)
  }

  const confirmDeleteVocabulary = async () => {
    if (!deletingVocabId) return
    await deleteVocabularyItem(deletingVocabId)
    setDeletingVocabId(null)
  }

  const toggleSelectVocabulary = (id: string) => {
    setSelectedVocabularyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectedCount = selectedVocabularyIds.size
  const allSelected = vocabulary.length > 0 && selectedCount === vocabulary.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedVocabularyIds(new Set())
      return
    }
    setSelectedVocabularyIds(new Set(vocabulary.map((item) => item.id)))
  }

  const handleSwap = async () => {
    if (!swapScope) return

    const idsToSwap =
      swapScope === 'all' ? vocabulary.map((item) => item.id) : [...selectedVocabularyIds]

    if (idsToSwap.length === 0) {
      setSwapScope(null)
      return
    }

    setIsSwapping(true)
    try {
      await swapVocabularyLanguages(idsToSwap)
      setSelectedVocabularyIds(new Set())
      setIsSelectMode(false)
      setSwapScope(null)
    } finally {
      setIsSwapping(false)
    }
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
                {vocabulary.length > 0 && (
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-600">
                      {isSelectMode
                        ? `${selectedCount} ausgewählt`
                        : 'Bulk-Bearbeitung'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isSelectMode ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={toggleSelectAll}
                          >
                            {allSelected ? 'Keine' : 'Alle'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={selectedCount === 0 || isSwapping}
                            onClick={() => setSwapScope('selected')}
                          >
                            <Languages className="w-3.5 h-3.5 mr-1" />
                            Tauschen
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsSelectMode(false)
                              setSelectedVocabularyIds(new Set())
                            }}
                          >
                            Fertig
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSelectMode(true)}
                          >
                            Auswählen
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isSwapping}
                            onClick={() => setSwapScope('all')}
                          >
                            <Languages className="w-3.5 h-3.5 mr-1" />
                            Alle tauschen
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Vocabulary Items */}
                {vocabulary.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {vocabulary.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          isSelectMode ? 'cursor-pointer' : ''
                        } ${
                          selectedVocabularyIds.has(item.id) ? 'bg-primary-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (isSelectMode) {
                            toggleSelectVocabulary(item.id)
                          }
                        }}
                      >
                        {isSelectMode && (
                          <div className="pr-3">
                            <input
                              type="checkbox"
                              checked={selectedVocabularyIds.has(item.id)}
                              onChange={() => toggleSelectVocabulary(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-medium text-gray-900">{item.sourceText}</p>
                          <p className="text-sm text-gray-500">{item.targetText}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>
                          )}
                        </div>
                        {!isSelectMode && (
                          <button
                            onClick={() => handleDeleteVocabulary(item.id)}
                            className="p-2 text-gray-400 hover:text-error-500 hover:bg-error-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    Noch keine Vokabeln in diesem Abschnitt.
                  </div>
                )}

                {/* Inline Add Form */}
                <div className="border-t border-gray-100 p-4">
                  {showAddForm ? (
                    <form onSubmit={handleAddVocabulary} className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Deutsch"
                          value={sourceText}
                          onChange={(e) => setSourceText(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Input
                          placeholder="Fremdsprache"
                          value={targetText}
                          onChange={(e) => setTargetText(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddForm(false)
                            setSourceText('')
                            setTargetText('')
                          }}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          loading={isAdding}
                          disabled={!sourceText.trim() || !targetText.trim()}
                        >
                          Hinzufügen
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={() => setShowAddForm(true)}
                      className="text-primary-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Vokabel hinzufügen
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {/* Delete Vocabulary Confirmation */}
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
            <Button variant="danger" fullWidth onClick={confirmDeleteVocabulary}>
              Löschen
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!swapScope}
        onClose={() => setSwapScope(null)}
        title="Sprache tauschen?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {swapScope === 'all'
              ? `Deutsch/Fremdsprache für alle ${vocabulary.length} Vokabeln in diesem Abschnitt tauschen?`
              : `Deutsch/Fremdsprache für ${selectedCount} ausgewählte Vokabeln tauschen?`}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setSwapScope(null)}>
              Abbrechen
            </Button>
            <Button variant="primary" fullWidth loading={isSwapping} onClick={handleSwap}>
              Tauschen
            </Button>
          </div>
        </div>
      </Modal>
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
            <Button variant="ghost" size="icon" onClick={menuModal.open}>
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </Button>
            <Button variant="primary" size="sm" onClick={addModal.open}>
              <Plus className="w-4 h-4 mr-1" />
              Abschnitt
            </Button>
          </div>
        }
      />

      {/* Breadcrumb */}
      {book && chapter && (
        <Breadcrumb bookId={bookId} bookName={book.name} chapterName={chapter.name} />
      )}

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
              <ExpandableSection
                section={section}
                bookId={bookId}
                isExpanded={expandedSectionId === section.id}
                onToggleExpand={() => handleToggleSection(section.id)}
                onToggleCovered={(covered) => handleToggleCovered(section.id, covered)}
                onDelete={() => handleOpenDeleteSection(section.id)}
                onEdit={() => handleOpenEditSection(section.id)}
              />
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
