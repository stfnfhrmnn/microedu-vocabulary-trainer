'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export type ConfirmationVariant = 'danger' | 'warning' | 'info'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmationVariant
  /** If provided, user must type this text to confirm */
  requiresTypedConfirmation?: string
}

const variantStyles: Record<ConfirmationVariant, {
  icon: string
  iconBg: string
  iconColor: string
  buttonVariant: 'danger' | 'warning' | 'primary'
}> = {
  danger: {
    icon: '⚠️',
    iconBg: 'bg-error-100',
    iconColor: 'text-error-500',
    buttonVariant: 'danger',
  },
  warning: {
    icon: '⚠️',
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-500',
    buttonVariant: 'warning',
  },
  info: {
    icon: 'ℹ️',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-500',
    buttonVariant: 'primary',
  },
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  variant = 'danger',
  requiresTypedConfirmation,
}: ConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [typedText, setTypedText] = useState('')

  const styles = variantStyles[variant]
  const canConfirm = !requiresTypedConfirmation || typedText === requiresTypedConfirmation

  const handleConfirm = async () => {
    if (!canConfirm) return

    setIsConfirming(true)
    try {
      await onConfirm()
      setTypedText('')
      onClose()
    } finally {
      setIsConfirming(false)
    }
  }

  const handleClose = () => {
    setTypedText('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
            <span className="text-2xl">{styles.icon}</span>
          </div>
          <p className="text-gray-600 flex-1">{message}</p>
        </div>

        {requiresTypedConfirmation && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitte gib <span className="font-mono bg-gray-100 px-1 rounded">{requiresTypedConfirmation}</span> ein, um zu bestätigen:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder={requiresTypedConfirmation}
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleClose}
            disabled={isConfirming}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={styles.buttonVariant}
            fullWidth
            onClick={handleConfirm}
            loading={isConfirming}
            disabled={!canConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Hook for easier confirmation modal usage
 */
export function useConfirmation() {
  const [state, setState] = useState<{
    isOpen: boolean
    props: Omit<ConfirmationModalProps, 'isOpen' | 'onClose'> | null
    resolve: ((confirmed: boolean) => void) | null
  }>({
    isOpen: false,
    props: null,
    resolve: null,
  })

  const confirm = (props: Omit<ConfirmationModalProps, 'isOpen' | 'onClose' | 'onConfirm'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        props: {
          ...props,
          onConfirm: () => {
            resolve(true)
          },
        },
        resolve,
      })
    })
  }

  const handleClose = () => {
    state.resolve?.(false)
    setState({ isOpen: false, props: null, resolve: null })
  }

  const ConfirmationModalComponent = state.props ? (
    <ConfirmationModal
      isOpen={state.isOpen}
      onClose={handleClose}
      {...state.props}
    />
  ) : null

  return { confirm, ConfirmationModal: ConfirmationModalComponent }
}
