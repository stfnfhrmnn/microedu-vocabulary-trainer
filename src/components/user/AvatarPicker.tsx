'use client'

import { motion } from 'framer-motion'
import { AVATAR_OPTIONS, type AvatarEmoji } from '@/stores/user-session'
import { cn } from '@/lib/utils/cn'

interface AvatarPickerProps {
  selected: AvatarEmoji
  onSelect: (avatar: AvatarEmoji) => void
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {AVATAR_OPTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
            'transition-colors',
            selected === emoji
              ? 'bg-primary-100 ring-2 ring-primary-500'
              : 'bg-gray-100 hover:bg-gray-200'
          )}
          whileTap={{ scale: 0.9 }}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  )
}
