'use client'

import { motion } from 'framer-motion'
import { useCurrentProfile } from '@/stores/user-session'
import { formatUserIdShort } from '@/lib/utils/user-id'
import { cn } from '@/lib/utils/cn'

interface UserMenuButtonProps {
  onClick: () => void
  className?: string
}

export function UserMenuButton({ onClick, className }: UserMenuButtonProps) {
  const profile = useCurrentProfile()

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-full',
        'bg-gray-100 hover:bg-gray-200 transition-colors',
        className
      )}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-xl">{profile.avatar}</span>
      <span className="text-sm font-medium text-gray-700">
        {formatUserIdShort(profile.id)}
      </span>
    </motion.button>
  )
}
