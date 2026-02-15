'use client'

import { motion } from 'framer-motion'
import {
  AVATAR_OPTIONS,
  getAvatarUnlockLevel,
  isAvatarUnlocked,
  type AvatarEmoji,
} from '@/stores/user-session'
import { cn } from '@/lib/utils/cn'

interface AvatarPickerProps {
  selected: AvatarEmoji
  onSelect: (avatar: AvatarEmoji) => void
  currentLevel: number
}

export function AvatarPicker({ selected, onSelect, currentLevel }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {AVATAR_OPTIONS.map((emoji) => {
        const unlockLevel = getAvatarUnlockLevel(emoji)
        const isUnlocked = isAvatarUnlocked(emoji, currentLevel)
        const isSelected = selected === emoji
        const isLocked = !isUnlocked && !isSelected

        return (
          <motion.button
            key={emoji}
            type="button"
            onClick={() => {
              if (isLocked) return
              onSelect(emoji)
            }}
            disabled={isLocked}
            aria-disabled={isLocked}
            title={isLocked ? `Freischaltung ab Level ${unlockLevel}` : 'Avatar auswählen'}
            className={cn(
              'relative w-10 h-10 rounded-lg flex items-center justify-center text-xl',
              'transition-colors',
              isSelected
                ? 'bg-primary-100 ring-2 ring-primary-500'
                : 'bg-gray-100 hover:bg-gray-200',
              isLocked && 'opacity-40 cursor-not-allowed hover:bg-gray-100'
            )}
            whileTap={isLocked ? undefined : { scale: 0.9 }}
          >
            {emoji}
            {isLocked && (
              <span className="absolute -bottom-2.5 text-[10px] text-gray-500">
                Lvl {unlockLevel}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
