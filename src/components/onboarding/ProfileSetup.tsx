'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AVATAR_OPTIONS, type AvatarEmoji } from '@/stores/user-session'

interface ProfileSetupProps {
  initialName?: string
  initialAvatar?: AvatarEmoji
  onComplete: (name: string, avatar: AvatarEmoji) => void
  onBack: () => void
}

export function ProfileSetup({
  initialName = '',
  initialAvatar,
  onComplete,
  onBack,
}: ProfileSetupProps) {
  const [name, setName] = useState(initialName)
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarEmoji>(
    initialAvatar || AVATAR_OPTIONS[0]
  )

  const isValid = name.trim().length >= 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onComplete(name.trim(), selectedAvatar)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center px-6 w-full max-w-md"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-gray-900 mb-2 text-center"
      >
        Wer bist du?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-gray-600 mb-8 text-center"
      >
        Erstelle dein persönliches Profil
      </motion.p>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Input
            label="Dein Name"
            placeholder="z.B. Max"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {name.length > 0 && name.trim().length < 2 && (
            <p className="text-sm text-error-500 mt-1">
              Mindestens 2 Zeichen
            </p>
          )}
        </motion.div>

        {/* Avatar Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Wähle deinen Avatar
          </label>
          <div className="grid grid-cols-8 gap-2">
            {AVATAR_OPTIONS.map((avatar, index) => (
              <motion.button
                key={avatar}
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.02 }}
                onClick={() => setSelectedAvatar(avatar)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-xl
                  transition-all duration-200
                  ${
                    selectedAvatar === avatar
                      ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }
                `}
              >
                {avatar}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3 py-4 px-4 bg-gray-50 rounded-xl"
        >
          <span className="text-4xl">{selectedAvatar}</span>
          <span className="text-lg font-semibold text-gray-900">
            {name.trim() || 'Dein Name'}
          </span>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3 pt-4"
        >
          <Button type="button" variant="ghost" onClick={onBack}>
            Zurück
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!isValid}
          >
            Weiter
          </Button>
        </motion.div>
      </form>
    </motion.div>
  )
}
