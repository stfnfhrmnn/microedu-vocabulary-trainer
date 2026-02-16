'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import type { VocabularyItem } from '@/lib/db/schema'

interface EditVocabularyModalProps {
  isOpen: boolean
  onClose: () => void
  vocabulary: VocabularyItem | null
  onSave: (id: string, data: { sourceText: string; targetText: string; notes?: string }) => Promise<void>
}

export function EditVocabularyModal({
  isOpen,
  onClose,
  vocabulary,
  onSave,
}: EditVocabularyModalProps) {
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && vocabulary) {
      setSourceText(vocabulary.sourceText)
      setTargetText(vocabulary.targetText)
      setNotes(vocabulary.notes || '')
    }
  }, [isOpen, vocabulary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vocabulary || !sourceText.trim() || !targetText.trim()) return

    setIsSubmitting(true)
    try {
      await onSave(vocabulary.id, {
        sourceText: sourceText.trim(),
        targetText: targetText.trim(),
        notes: notes.trim() || undefined,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vokabel bearbeiten">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Deutsch"
          placeholder="Deutsches Wort"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          autoFocus
        />
        <Input
          label="Fremdsprache"
          placeholder="Fremdsprachiges Wort"
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
        />
        <Textarea
          label="Notizen (optional)"
          placeholder="z.B. Beispielsatz, Eselsbrücke..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={!sourceText.trim() || !targetText.trim()}
          >
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  )
}
