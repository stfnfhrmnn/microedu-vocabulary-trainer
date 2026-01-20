'use client'

import { useCallback } from 'react'
import { useSettings } from '@/stores/settings'
import { playSound, type SoundType } from '@/lib/audio/sounds'

/**
 * Hook for playing sound effects
 * Respects user's sound preference from settings
 */
export function useSound() {
  const { soundEnabled } = useSettings()

  const play = useCallback(
    (sound: SoundType) => {
      if (!soundEnabled) return
      playSound(sound)
    },
    [soundEnabled]
  )

  return { play, soundEnabled }
}
