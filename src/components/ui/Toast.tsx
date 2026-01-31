'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToastStore, type ToastType } from '@/stores/toast'
import { cn } from '@/lib/utils/cn'

const toastStyles: Record<ToastType, string> = {
  success: 'bg-success-500 text-white',
  error: 'bg-error-500 text-white',
  warning: 'bg-warning-500 text-white',
  info: 'bg-primary-500 text-white',
}

const toastIcons: Record<ToastType, string> = {
  success: '\u2713', // checkmark
  error: '\u2717',   // x mark
  warning: '\u26A0', // warning
  info: '\u2139',    // info
}

interface ToastItemProps {
  id: string
  type: ToastType
  message: string
  duration?: number
}

function ToastItem({ id, type, message, duration = 4000 }: ToastItemProps) {
  const removeToast = useToastStore((state) => state.removeToast)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, removeToast])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
        'min-w-[280px] max-w-[90vw]',
        toastStyles[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg font-bold">{toastIcons[type]}</span>
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={() => removeToast(id)}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Schließen"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
      aria-label="Benachrichtigungen"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem {...toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
