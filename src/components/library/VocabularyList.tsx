'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Languages, FolderInput } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PronunciationButton } from '@/components/vocabulary/PronunciationButton'
import { EditVocabularyModal } from './EditVocabularyModal'
import { MoveVocabularyModal } from './MoveVocabularyModal'
import {
  updateVocabularyItem,
  deleteVocabularyItem,
  deleteVocabularyItems,
  swapVocabularyLanguages,
  moveVocabularyItems,
} from '@/lib/db/db'
import type { VocabularyItem, Language } from '@/lib/db/schema'

interface VocabularyListProps {
  vocabulary: VocabularyItem[]
  bookId: string
  bookLanguage?: Language
  currentSectionId: string | null
  currentChapterId: string | null
  showInlineAdd?: boolean
  onAddVocabulary?: (source: string, target: string) => Promise<void>
}

export function VocabularyList({
  vocabulary,
  bookId,
  bookLanguage,
  currentSectionId,
  currentChapterId,
  showInlineAdd = false,
  onAddVocabulary,
}: VocabularyListProps) {
  // Selection mode state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal state
  const [deletingVocabId, setDeletingVocabId] = useState<string | null>(null)
  const [editingVocab, setEditingVocab] = useState<VocabularyItem | null>(null)
  const [swapScope, setSwapScope] = useState<'all' | 'selected' | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [movingVocabId, setMovingVocabId] = useState<string | null>(null)

  // Inline add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Clean up selected IDs when vocabulary changes
  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(vocabulary.map((item) => item.id))
      return new Set([...prev].filter((id) => validIds.has(id)))
    })
  }, [vocabulary])

  const selectedCount = selectedIds.size
  const allSelected = vocabulary.length > 0 && selectedCount === vocabulary.length

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(vocabulary.map((item) => item.id)))
    }
  }

  const exitSelectMode = () => {
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }

  // Single delete
  const handleDeleteSingle = async () => {
    if (!deletingVocabId) return
    await deleteVocabularyItem(deletingVocabId)
    setDeletingVocabId(null)
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return

    setIsDeletingBulk(true)
    try {
      await deleteVocabularyItems(ids)
      exitSelectMode()
      setShowBulkDelete(false)
    } finally {
      setIsDeletingBulk(false)
    }
  }

  // Swap
  const handleSwap = async () => {
    if (!swapScope) return

    const idsToSwap =
      swapScope === 'all' ? vocabulary.map((item) => item.id) : [...selectedIds]

    if (idsToSwap.length === 0) {
      setSwapScope(null)
      return
    }

    setIsSwapping(true)
    try {
      await swapVocabularyLanguages(idsToSwap)
      exitSelectMode()
      setSwapScope(null)
    } finally {
      setIsSwapping(false)
    }
  }

  // Edit
  const handleEditSave = async (
    id: string,
    data: { sourceText: string; targetText: string; notes?: string }
  ) => {
    await updateVocabularyItem(id, data)
  }

  // Move
  const handleMove = async (target: { sectionId: string | null; chapterId: string | null }) => {
    const ids = movingVocabId ? [movingVocabId] : [...selectedIds]
    if (ids.length === 0) return

    await moveVocabularyItems(ids, target)
    setMovingVocabId(null)
    exitSelectMode()
  }

  const moveItemCount = movingVocabId ? 1 : selectedCount

  // Inline add
  const handleAddVocabulary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceText.trim() || !targetText.trim() || !onAddVocabulary) return

    setIsAdding(true)
    try {
      await onAddVocabulary(sourceText.trim(), targetText.trim())
      setSourceText('')
      setTargetText('')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      {/* Bulk action toolbar */}
      {vocabulary.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
          <div className="text-xs text-gray-600">
            {isSelectMode ? `${selectedCount} ausgewählt` : 'Bulk-Bearbeitung'}
          </div>
          <div className="flex items-center gap-1.5">
            {isSelectMode ? (
              <>
                <Button type="button" variant="ghost" size="sm" onClick={toggleSelectAll}>
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
                  variant="secondary"
                  size="sm"
                  disabled={selectedCount === 0}
                  onClick={() => setShowMoveModal(true)}
                >
                  <FolderInput className="w-3.5 h-3.5 mr-1" />
                  Verschieben
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={selectedCount === 0}
                  onClick={() => setShowBulkDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Löschen
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={exitSelectMode}>
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

      {/* Vocabulary rows */}
      {vocabulary.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {vocabulary.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-4 py-3 ${
                isSelectMode ? 'cursor-pointer' : ''
              } ${selectedIds.has(item.id) ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
              onClick={() => {
                if (isSelectMode) {
                  toggleSelect(item.id)
                } else {
                  setEditingVocab(item)
                }
              }}
            >
              {isSelectMode && (
                <div className="pr-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
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
                <>
                  {bookLanguage && (
                    <PronunciationButton
                      text={item.targetText}
                      language={bookLanguage}
                      size="sm"
                      variant="ghost"
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMovingVocabId(item.id)
                      setShowMoveModal(true)
                    }}
                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
                  >
                    <FolderInput className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingVocabId(item.id)
                    }}
                    className="p-2 text-gray-400 hover:text-error-500 hover:bg-error-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-gray-500 text-sm">
          Noch keine Vokabeln.
        </div>
      )}

      {/* Inline add form (for sections only) */}
      {showInlineAdd && (
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
      )}

      {/* Delete single confirmation */}
      <Modal
        isOpen={!!deletingVocabId}
        onClose={() => setDeletingVocabId(null)}
        title="Vokabel löschen?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Möchtest du diese Vokabel wirklich löschen?</p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeletingVocabId(null)}>
              Abbrechen
            </Button>
            <Button variant="danger" fullWidth onClick={handleDeleteSingle}>
              Löschen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk delete confirmation */}
      <Modal
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        title="Vokabeln löschen?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Möchtest du {selectedCount} Vokabeln wirklich löschen? Dies kann nicht rückgängig
            gemacht werden.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowBulkDelete(false)}>
              Abbrechen
            </Button>
            <Button variant="danger" fullWidth loading={isDeletingBulk} onClick={handleBulkDelete}>
              {selectedCount} löschen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Swap confirmation */}
      <Modal
        isOpen={!!swapScope}
        onClose={() => setSwapScope(null)}
        title="Sprache tauschen?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {swapScope === 'all'
              ? `Deutsch/Fremdsprache für alle ${vocabulary.length} Vokabeln tauschen?`
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

      {/* Edit vocabulary modal */}
      <EditVocabularyModal
        isOpen={!!editingVocab}
        onClose={() => setEditingVocab(null)}
        vocabulary={editingVocab}
        onSave={handleEditSave}
      />

      {/* Move vocabulary modal */}
      <MoveVocabularyModal
        isOpen={showMoveModal}
        onClose={() => {
          setShowMoveModal(false)
          setMovingVocabId(null)
        }}
        bookId={bookId}
        currentSectionId={currentSectionId}
        onMove={handleMove}
        itemCount={moveItemCount}
      />
    </>
  )
}
