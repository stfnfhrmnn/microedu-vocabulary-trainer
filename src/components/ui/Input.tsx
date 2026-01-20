'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const inputVariants = cva(
  [
    'w-full',
    'text-base text-gray-900',
    'bg-white',
    'border-2 border-gray-200',
    'rounded-xl',
    'px-4 py-3',
    'transition-colors duration-200',
    'placeholder:text-gray-400',
    'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
      },
      error: {
        true: 'border-error-500 focus:border-error-500 focus:ring-error-100',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  helperText?: string
  errorMessage?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, error, label, helperText, errorMessage, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const hasError = error || !!errorMessage

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(inputVariants({ size, error: hasError, className }))}
          {...props}
        />
        {(helperText || errorMessage) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              hasError ? 'text-error-600' : 'text-gray-500'
            )}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { inputVariants }
