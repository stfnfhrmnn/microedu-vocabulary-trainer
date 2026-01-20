'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface HeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  action?: React.ReactNode
  className?: string
}

export function Header({ title, showBack = false, onBack, action, className }: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between h-14 mb-4',
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBack && (
          <motion.button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors min-h-touch min-w-touch flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
            aria-label="Zurück"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </motion.button>
        )}
        <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
      </div>

      {action && <div className="flex-shrink-0 ml-3">{action}</div>}
    </header>
  )
}
