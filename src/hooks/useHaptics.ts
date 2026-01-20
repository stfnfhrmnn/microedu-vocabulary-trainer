'use client'

import { useCallback } from 'react'
import { useSettings } from '@/stores/settings'
import { triggerHaptic, type HapticPattern } from '@/lib/haptics/haptics'

/**
 * Hook for triggering haptic feedback
 * Respects user's haptic preference from settings
 */
export function useHaptics() {
  const { hapticEnabled } = useSettings()

  const trigger = useCallback(
    (pattern: HapticPattern) => {
      if (!hapticEnabled) return
      triggerHaptic(pattern)
    },
    [hapticEnabled]
  )

  return { trigger, hapticEnabled }
}
