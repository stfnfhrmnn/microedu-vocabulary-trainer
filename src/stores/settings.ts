import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PracticeDirection, ExerciseType } from '@/lib/db/schema'
import type { StrictnessLevel } from '@/lib/learning/fuzzy-match'
import type { OCRProviderType } from '@/lib/ocr/types'

interface SettingsState {
  // Practice defaults
  defaultDirection: PracticeDirection
  defaultExerciseType: ExerciseType
  typingStrictness: StrictnessLevel

  // OCR settings
  ocrProvider: OCRProviderType
  googleApiKey: string | null

  // App settings
  soundEnabled: boolean
  hapticEnabled: boolean

  // Actions
  setDefaultDirection: (direction: PracticeDirection) => void
  setDefaultExerciseType: (type: ExerciseType) => void
  setTypingStrictness: (strictness: StrictnessLevel) => void
  setOcrProvider: (provider: OCRProviderType) => void
  setGoogleApiKey: (key: string | null) => void
  setSoundEnabled: (enabled: boolean) => void
  setHapticEnabled: (enabled: boolean) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      defaultDirection: 'sourceToTarget',
      defaultExerciseType: 'flashcard',
      typingStrictness: 'normal',
      ocrProvider: 'tesseract',
      googleApiKey: null,
      soundEnabled: true,
      hapticEnabled: true,

      // Actions
      setDefaultDirection: (direction) => set({ defaultDirection: direction }),
      setDefaultExerciseType: (type) => set({ defaultExerciseType: type }),
      setTypingStrictness: (strictness) => set({ typingStrictness: strictness }),
      setOcrProvider: (provider) => set({ ocrProvider: provider }),
      setGoogleApiKey: (key) => set({ googleApiKey: key }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
    }),
    {
      name: 'vocabulary-trainer-settings',
      // Migration to rename geminiApiKey to googleApiKey
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>
        // Migrate old geminiApiKey to googleApiKey
        if (state.geminiApiKey && !state.googleApiKey) {
          state.googleApiKey = state.geminiApiKey
          delete state.geminiApiKey
        }
        // Migrate old 'gemini' provider to 'google-vision'
        if (state.ocrProvider === 'gemini') {
          state.ocrProvider = 'google-vision'
        }
        return state as unknown as SettingsState
      },
      version: 1,
    }
  )
)
