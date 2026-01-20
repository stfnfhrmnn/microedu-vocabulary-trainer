/**
 * Haptic feedback patterns using Vibration API
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Vibration not supported or blocked
    }
  }
}

export const haptics = {
  // Light tap - for subtle interactions
  light: () => vibrate(10),

  // Medium tap - for button presses
  medium: () => vibrate(20),

  // Heavy tap - for important actions
  heavy: () => vibrate([30, 10, 30]),

  // Success pattern - celebratory double pulse
  success: () => vibrate([10, 50, 10, 50, 10]),

  // Error pattern - short buzz
  error: () => vibrate([50, 30, 50]),

  // Warning pattern - single longer pulse
  warning: () => vibrate(40),

  // Custom pattern
  custom: (pattern: number | number[]) => vibrate(pattern),
}

export function triggerHaptic(pattern: HapticPattern): void {
  const hapticFn = haptics[pattern]
  if (hapticFn) {
    hapticFn()
  }
}
