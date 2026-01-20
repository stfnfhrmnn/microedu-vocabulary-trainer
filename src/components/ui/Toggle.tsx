'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, label, description, disabled, className }, ref) => {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        {(label || description) && (
          <div className="flex-1 mr-4">
            {label && <div className="text-base font-medium text-gray-900">{label}</div>}
            {description && <div className="text-sm text-gray-500 mt-0.5">{description}</div>}
          </div>
        )}
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={cn(
            'relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full',
            'border-2 border-transparent',
            'transition-colors duration-200 ease-in-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            checked ? 'bg-primary-500' : 'bg-gray-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <motion.span
            className="pointer-events-none inline-block h-7 w-7 rounded-full bg-white shadow-lg ring-0"
            initial={false}
            animate={{
              x: checked ? 24 : 0,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    )
  }
)

Toggle.displayName = 'Toggle'
