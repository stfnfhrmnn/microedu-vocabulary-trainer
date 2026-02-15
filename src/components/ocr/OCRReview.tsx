'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { getLangCode, SOURCE_LANG_CODE } from '@/lib/utils/language-codes'
import type { VocabularyCandidateWithMeta, ParsedChapter } from '@/lib/ocr/types'
import type { Language, Chapter } from '@/lib/db/schema'

interface OCRReviewProps {
  candidates: VocabularyCandidateWithMeta[]
  sections: SelectOption[]
  chapters: SelectOption[]
  books: SelectOption[]
  selectedBookId: string
  selectedSectionId: string
  targetLanguage?: Language
  detectedChapters?: ParsedChapter[]
  onBookChange: (bookId: string) => void
  onSectionChange: (sectionId: string) => void
  onUpdateCandidate: (index: number, updates: Partial<VocabularyCandidateWithMeta>) => void
  onRemoveCandidate: (index: number) => void
  onAddCandidate: () => void
  onSave: () => void
  onCancel: () => void
  onCreateChapter?: (name: string) => Promise<Chapter>
  onSkipDuplicates?: () => void
  isSaving: boolean
}

export function OCRReview({
  candidates,
  sections,
  chapters,
  books,
  selectedBookId,
  selectedSectionId,
  targetLanguage,
  detectedChapters = [],
  onBookChange,
  onSectionChange,
  onUpdateCandidate,
  onRemoveCandidate,
  onAddCandidate,
  onSave,
  onCancel,
  onCreateChapter,
  onSkipDuplicates,
  isSaving,
}: OCRReviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set())
  const [creatingChapter, setCreatingChapter] = useState<string | null>(null)
  const targetLangCode = getLangCode(targetLanguage)

  // Build chapter options including detected new chapters
  const chapterOptions = useMemo(() => {
    const options: SelectOption[] = [
      { value: '', label: 'Kein Kapitel (Buch-Ebene)' },
      ...chapters,
    ]

    // Add detected new chapters
    detectedChapters
      .filter(dc => dc.isNewChapter)
      .forEach(dc => {
        options.push({
          value: `new:${dc.detectedName}`,
          label: `+ ${dc.detectedName} (neu)`,
        })
      })

    return options
  }, [chapters, detectedChapters])

  const handleSourceChange = (index: number, value: string) => {
    onUpdateCandidate(index, { sourceText: value })
  }

  const handleTargetChange = (index: number, value: string) => {
    onUpdateCandidate(index, { targetText: value })
  }

  const handleNotesChange = (index: number, value: string) => {
    onUpdateCandidate(index, { notes: value })
  }

  const handleChapterChange = (index: number, value: string) => {
    onUpdateCandidate(index, { chapterAssignment: value || 'book-level' })
  }

  const toggleHints = (index: number) => {
    const newExpanded = new Set(expandedHints)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedHints(newExpanded)
  }

  const handleCreateChapter = async (name: string) => {
    if (!onCreateChapter) return
    setCreatingChapter(name)
    try {
      const newChapter = await onCreateChapter(name)
      // Update all candidates assigned to this new chapter
      candidates.forEach((candidate, index) => {
        if (candidate.chapterAssignment === `new:${name}`) {
          onUpdateCandidate(index, { chapterAssignment: newChapter.id })
        }
      })
    } finally {
      setCreatingChapter(null)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600 bg-success-50'
    if (confidence >= 0.6) return 'text-warning-600 bg-warning-50'
    return 'text-error-600 bg-error-50'
  }

  const validCandidates = candidates.filter(
    (c) => c.sourceText.trim() && c.targetText.trim()
  )

  const duplicateCount = candidates.filter(c => c.isDuplicate).length

  return (
    <div className="flex flex-col h-full">
      {/* Book selector */}
      {books.length > 1 && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <Select
            label="Buch"
            options={books}
            value={selectedBookId}
            onChange={(e) => onBookChange(e.target.value)}
            placeholder="Buch auswählen"
          />
        </div>
      )}

      {/* Detected chapters summary */}
      {detectedChapters.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Erkannte Kapitel</h3>
          <div className="space-y-1">
            {detectedChapters.map((dc, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {dc.isNewChapter ? (
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                      NEU
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                      EXISTIERT
                    </span>
                  )}
                  <span className="text-gray-900">{dc.detectedName}</span>
                </span>
                <span className="text-gray-500">{dc.candidates.length} Vokabeln</span>
              </div>
            ))}
          </div>
          {detectedChapters.some(dc => dc.isNewChapter) && onCreateChapter && (
            <div className="mt-3 flex flex-wrap gap-2">
              {detectedChapters.filter(dc => dc.isNewChapter).map((dc, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="sm"
                  loading={creatingChapter === dc.detectedName}
                  onClick={() => handleCreateChapter(dc.detectedName)}
                >
                  + {dc.detectedName} erstellen
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Duplicate action bar */}
      {duplicateCount > 0 && onSkipDuplicates && (
        <div className="px-4 py-2 border-b border-gray-200 bg-warning-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-warning-700">
              {duplicateCount} Duplikat{duplicateCount > 1 ? 'e' : ''} erkannt
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkipDuplicates}
              className="text-warning-700 hover:text-warning-800"
            >
              Alle überspringen
            </Button>
          </div>
        </div>
      )}

      {/* Section selector (legacy mode) */}
      {sections.length > 0 && detectedChapters.length === 0 && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <Select
            label="Speichern in Abschnitt"
            options={sections}
            value={selectedSectionId}
            onChange={(e) => onSectionChange(e.target.value)}
            placeholder="Abschnitt auswählen"
          />
        </div>
      )}

      {/* Candidate list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {candidates.map((candidate, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
              className={`bg-white rounded-xl border p-4 relative ${
                candidate.isDuplicate
                  ? 'border-warning-300 bg-warning-50/50'
                  : 'border-gray-200'
              }`}
            >
              {/* Badges row */}
              <div className="flex items-center gap-2 absolute top-2 right-2">
                {candidate.isDuplicate && (
                  <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning-100 text-warning-700">
                    DUPLIKAT {candidate.duplicateSimilarity
                      ? `${Math.round(candidate.duplicateSimilarity * 100)}%`
                      : ''}
                  </div>
                )}
                <div
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${getConfidenceColor(
                    candidate.confidence
                  )}`}
                >
                  {Math.round(candidate.confidence * 100)}%
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => onRemoveCandidate(index)}
                className="absolute top-2 right-28 text-gray-400 hover:text-error-500 p-1"
                aria-label="Entfernen"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Source text */}
              <div className="mb-3 pr-32">
                <Input
                  label="Deutsch"
                  value={candidate.sourceText}
                  onChange={(e) => handleSourceChange(index, e.target.value)}
                  size="sm"
                  onFocus={() => setEditingIndex(index)}
                  onBlur={() => setEditingIndex(null)}
                  spellCheck
                  lang={SOURCE_LANG_CODE}
                />
              </div>

              {/* Target text */}
              <div className="mb-3">
                <Input
                  label="Übersetzung"
                  value={candidate.targetText}
                  onChange={(e) => handleTargetChange(index, e.target.value)}
                  size="sm"
                  onFocus={() => setEditingIndex(index)}
                  onBlur={() => setEditingIndex(null)}
                  spellCheck
                  lang={targetLangCode}
                />
              </div>

              {/* Chapter assignment (when multi-chapter mode) */}
              {(detectedChapters.length > 0 || chapterOptions.length > 1) && (
                <div className="mb-2">
                  <Select
                    label="Kapitel"
                    options={chapterOptions}
                    value={candidate.chapterAssignment || ''}
                    onChange={(e) => handleChapterChange(index, e.target.value)}
                    size="sm"
                  />
                </div>
              )}

              {/* Notes (expanded when editing this item) */}
              {(editingIndex === index || candidate.notes) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <Input
                    label="Notizen (optional)"
                    value={candidate.notes || ''}
                    onChange={(e) => handleNotesChange(index, e.target.value)}
                    size="sm"
                    placeholder="z.B. maskulin, feminin..."
                  />
                </motion.div>
              )}

              {/* Expandable hints section */}
              <button
                onClick={() => toggleHints(index)}
                className="mt-2 text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${
                    expandedHints.has(index) ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                + Hinweis
              </button>

              {expandedHints.has(index) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-2 p-3 bg-gray-50 rounded-lg"
                >
                  <p className="text-xs text-gray-500 mb-2">
                    Hinweise in anderen Sprachen (z.B. English: &quot;similar to house&quot;)
                  </p>
                  <Input
                    placeholder="z.B. English: sounds like..."
                    size="sm"
                    // Note: hints array handling would need additional state management
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add manual entry button */}
        <button
          onClick={onAddCandidate}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Vokabel hinzufügen
        </button>

        {candidates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Keine Vokabeln erkannt.</p>
            <p className="text-sm mt-1">
              Du kannst Vokabeln manuell hinzufügen oder ein neues Bild aufnehmen.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white space-y-3 pb-safe">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {validCandidates.length} von {candidates.length} Vokabeln gültig
            {duplicateCount > 0 && (
              <span className="text-warning-600 ml-2">
                ({duplicateCount} Duplikat{duplicateCount > 1 ? 'e' : ''})
              </span>
            )}
          </span>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} fullWidth>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            fullWidth
            loading={isSaving}
            disabled={validCandidates.length === 0 || (!selectedSectionId && detectedChapters.length === 0 && !selectedBookId)}
          >
            {validCandidates.length} Speichern
          </Button>
        </div>
      </div>
    </div>
  )
}

// Legacy wrapper for backward compatibility
interface LegacyOCRReviewProps {
  candidates: Array<{
    sourceText: string
    targetText: string
    confidence: number
    notes?: string
  }>
  sections: SelectOption[]
  selectedSectionId: string
  targetLanguage?: Language
  onSectionChange: (sectionId: string) => void
  onUpdateCandidate: (index: number, updates: Partial<{ sourceText: string; targetText: string; confidence: number; notes?: string }>) => void
  onRemoveCandidate: (index: number) => void
  onAddCandidate: () => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function LegacyOCRReview(props: LegacyOCRReviewProps) {
  return (
    <OCRReview
      candidates={props.candidates as VocabularyCandidateWithMeta[]}
      sections={props.sections}
      chapters={[]}
      books={[]}
      selectedBookId=""
      selectedSectionId={props.selectedSectionId}
      targetLanguage={props.targetLanguage}
      onBookChange={() => {}}
      onSectionChange={props.onSectionChange}
      onUpdateCandidate={props.onUpdateCandidate as (index: number, updates: Partial<VocabularyCandidateWithMeta>) => void}
      onRemoveCandidate={props.onRemoveCandidate}
      onAddCandidate={props.onAddCandidate}
      onSave={props.onSave}
      onCancel={props.onCancel}
      isSaving={props.isSaving}
    />
  )
}
