'use client'

import { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TEXT_LIMITS, validateName } from '@/lib/utils/validation'

interface EditNameModalProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  onSave: (newName: string) => Promise<void>
  title: string
  label?: string
  placeholder?: string
  maxLength?: number
}

export function EditNameModal({
  isOpen,
  onClose,
  currentName,
  onSave,
  title,
  label = 'Name',
  placeholder = 'Name eingeben',
  maxLength = TEXT_LIMITS.name,
}: EditNameModalProps) {
  const [name, setName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)

  // Validation
  const validation = useMemo(() => validateName(name), [name])
  const showError = touched && !validation.valid

  // Reset name when modal opens with new currentName
  useEffect(() => {
    if (isOpen) {
      setName(currentName)
      setTouched(false)
    }
  }, [isOpen, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)

    if (!validation.valid) return
    if (validation.value === currentName) {
      onClose()
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(validation.value)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label={label}
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, maxLength))}
            onBlur={() => setTouched(true)}
            autoFocus
            maxLength={maxLength}
          />
          <div className="flex justify-between mt-1">
            {showError ? (
              <span className="text-xs text-error-500">{validation.error}</span>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">
              {name.length}/{maxLength}
            </span>
          </div>
        </div>

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
            disabled={!name.trim() || (touched && !validation.valid)}
          >
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  )
}
