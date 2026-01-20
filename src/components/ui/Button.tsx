'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-semibold text-base',
    'rounded-2xl',
    'min-h-touch min-w-touch',
    'px-6 py-3',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:pointer-events-none',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-500 text-white',
          'hover:bg-primary-600',
          'focus-visible:ring-primary-500',
        ],
        secondary: [
          'bg-gray-100 text-gray-900',
          'hover:bg-gray-200',
          'focus-visible:ring-gray-500',
        ],
        success: [
          'bg-success-500 text-white',
          'hover:bg-success-600',
          'focus-visible:ring-success-500',
        ],
        warning: [
          'bg-warning-500 text-white',
          'hover:bg-warning-600',
          'focus-visible:ring-warning-500',
        ],
        danger: [
          'bg-error-500 text-white',
          'hover:bg-error-600',
          'focus-visible:ring-error-500',
        ],
        ghost: [
          'bg-transparent text-gray-700',
          'hover:bg-gray-100',
          'focus-visible:ring-gray-500',
        ],
        outline: [
          'bg-transparent text-primary-600',
          'border-2 border-primary-500',
          'hover:bg-primary-50',
          'focus-visible:ring-primary-500',
        ],
      },
      size: {
        sm: 'min-h-10 px-4 py-2 text-sm',
        md: 'min-h-touch px-6 py-3 text-base',
        lg: 'min-h-14 px-8 py-4 text-lg',
        icon: 'min-h-touch min-w-touch p-3',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, children, loading, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || loading}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }
