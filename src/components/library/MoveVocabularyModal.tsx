'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronRight, FolderInput } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { db } from '@/lib/db/db'
import type { Chapter, Section } from '@/lib/db/schema'

interface MoveVocabularyModalProps {
  isOpen: boolean
  onClose: () => void
  bookId: string
  currentSectionId: string | null
  onMove: (target: { sectionId: string | null; chapterId: string | null }) => Promise<void>
  itemCount: number
}

export function MoveVocabularyModal({
  isOpen,
  onClose,
  bookId,
  currentSectionId,
  onMove,
  itemCount,
}: MoveVocabularyModalProps) {
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  const chapters = useLiveQuery(
    () => (isOpen ? db.chapters.where('bookId').equals(bookId).sortBy('order') : []),
    [bookId, isOpen]
  )

  const sections = useLiveQuery(
    () => (isOpen ? db.sections.where('bookId').equals(bookId).toArray() : []),
    [bookId, isOpen]
  )

  const sectionsByChapter = (sections ?? []).reduce<Record<string, Section[]>>((acc, section) => {
    const list = acc[section.chapterId] ?? []
    list.push(section)
    acc[section.chapterId] = list
    return acc
  }, {})

  // Sort sections within each chapter by order
  for (const chapterId of Object.keys(sectionsByChapter)) {
    sectionsByChapter[chapterId].sort((a, b) => a.order - b.order)
  }

  const handleSelect = async (target: { sectionId: string | null; chapterId: string | null }) => {
    setIsMoving(true)
    try {
      await onMove(target)
      onClose()
    } finally {
      setIsMoving(false)
    }
  }

  const isUnsorted = currentSectionId === null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verschieben nach...">
      <div className="space-y-1 -mx-2">
        {/* Unsorted (book-level) option */}
        <button
          onClick={() => handleSelect({ sectionId: null, chapterId: null })}
          disabled={isUnsorted || isMoving}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
            isUnsorted
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'hover:bg-gray-50 text-gray-900'
          }`}
        >
          <FolderInput className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="font-medium">Unsortiert</span>
          {isUnsorted && (
            <span className="text-xs text-gray-400 ml-auto">Aktuell</span>
          )}
        </button>

        {/* Chapters with sections */}
        {(chapters ?? []).map((chapter: Chapter) => {
          const chapterSections = sectionsByChapter[chapter.id] ?? []
          const isExpanded = expandedChapterId === chapter.id

          return (
            <div key={chapter.id}>
              <button
                onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)}
                disabled={isMoving}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{chapter.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {chapterSections.length} Abschnitte
                  </span>
                </div>
              </button>

              {isExpanded && chapterSections.length > 0 && (
                <div className="ml-6 space-y-0.5">
                  {chapterSections.map((section: Section) => {
                    const isCurrent = section.id === currentSectionId

                    return (
                      <button
                        key={section.id}
                        onClick={() =>
                          handleSelect({ sectionId: section.id, chapterId: chapter.id })
                        }
                        disabled={isCurrent || isMoving}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                          isCurrent
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'hover:bg-primary-50 text-gray-700 hover:text-primary-700'
                        }`}
                      >
                        <span className="flex-1">{section.name}</span>
                        {isCurrent && (
                          <span className="text-xs text-gray-400">Aktuell</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {isExpanded && chapterSections.length === 0 && (
                <div className="ml-6 px-3 py-2 text-sm text-gray-400">
                  Keine Abschnitte
                </div>
              )}
            </div>
          )
        })}

        {(chapters ?? []).length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            Keine Kapitel vorhanden. Erstelle zuerst ein Kapitel.
          </div>
        )}
      </div>

      <div className="pt-4 mt-2 border-t border-gray-100">
        <Button variant="secondary" fullWidth onClick={onClose} disabled={isMoving}>
          Abbrechen
        </Button>
      </div>
    </Modal>
  )
}
