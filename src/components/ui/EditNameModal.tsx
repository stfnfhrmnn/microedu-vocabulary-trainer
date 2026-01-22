'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface EditNameModalProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  onSave: (newName: string) => Promise<void>
  title: string
  label?: string
  placeholder?: string
}

export function EditNameModal({
  isOpen,
  onClose,
  currentName,
  onSave,
  title,
  label = 'Name',
  placeholder = 'Name eingeben',
}: EditNameModalProps) {
  const [name, setName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset name when modal opens with new currentName
  useEffect(() => {
    if (isOpen) {
      setName(currentName)
    }
  }, [isOpen, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name.trim() === currentName) {
      onClose()
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(name.trim())
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={label}
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
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
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  )
}
