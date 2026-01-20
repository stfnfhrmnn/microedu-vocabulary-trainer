'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import type { VocabularyCandidate } from '@/lib/ocr/types'

interface OCRReviewProps {
  candidates: VocabularyCandidate[]
  sections: SelectOption[]
  selectedSectionId: string
  onSectionChange: (sectionId: string) => void
  onUpdateCandidate: (index: number, updates: Partial<VocabularyCandidate>) => void
  onRemoveCandidate: (index: number) => void
  onAddCandidate: () => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function OCRReview({
  candidates,
  sections,
  selectedSectionId,
  onSectionChange,
  onUpdateCandidate,
  onRemoveCandidate,
  onAddCandidate,
  onSave,
  onCancel,
  isSaving,
}: OCRReviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleSourceChange = (index: number, value: string) => {
    onUpdateCandidate(index, { sourceText: value })
  }

  const handleTargetChange = (index: number, value: string) => {
    onUpdateCandidate(index, { targetText: value })
  }

  const handleNotesChange = (index: number, value: string) => {
    onUpdateCandidate(index, { notes: value })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600 bg-success-50'
    if (confidence >= 0.6) return 'text-warning-600 bg-warning-50'
    return 'text-error-600 bg-error-50'
  }

  const validCandidates = candidates.filter(
    (c) => c.sourceText.trim() && c.targetText.trim()
  )

  return (
    <div className="flex flex-col h-full">
      {/* Section selector */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <Select
          label="Speichern in Abschnitt"
          options={sections}
          value={selectedSectionId}
          onChange={(e) => onSectionChange(e.target.value)}
          placeholder="Abschnitt auswählen"
        />
      </div>

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
              className="bg-white rounded-xl border border-gray-200 p-4 relative"
            >
              {/* Confidence badge */}
              <div
                className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${getConfidenceColor(
                  candidate.confidence
                )}`}
              >
                {Math.round(candidate.confidence * 100)}%
              </div>

              {/* Delete button */}
              <button
                onClick={() => onRemoveCandidate(index)}
                className="absolute top-2 right-16 text-gray-400 hover:text-error-500 p-1"
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
              <div className="mb-3 pr-20">
                <Input
                  label="Deutsch"
                  value={candidate.sourceText}
                  onChange={(e) => handleSourceChange(index, e.target.value)}
                  size="sm"
                  onFocus={() => setEditingIndex(index)}
                  onBlur={() => setEditingIndex(null)}
                />
              </div>

              {/* Target text */}
              <div className="mb-2">
                <Input
                  label="Übersetzung"
                  value={candidate.targetText}
                  onChange={(e) => handleTargetChange(index, e.target.value)}
                  size="sm"
                  onFocus={() => setEditingIndex(index)}
                  onBlur={() => setEditingIndex(null)}
                />
              </div>

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
            disabled={validCandidates.length === 0 || !selectedSectionId}
          >
            {validCandidates.length} Speichern
          </Button>
        </div>
      </div>
    </div>
  )
}
