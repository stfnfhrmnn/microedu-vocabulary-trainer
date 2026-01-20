import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PracticeDirection, ExerciseType } from '@/lib/db/schema'
import type { StrictnessLevel } from '@/lib/learning/fuzzy-match'

interface SettingsState {
  // Practice defaults
  defaultDirection: PracticeDirection
  defaultExerciseType: ExerciseType
  typingStrictness: StrictnessLevel

  // OCR settings
  ocrProvider: 'tesseract' | 'gemini'
  geminiApiKey: string | null

  // App settings
  soundEnabled: boolean

  // Actions
  setDefaultDirection: (direction: PracticeDirection) => void
  setDefaultExerciseType: (type: ExerciseType) => void
  setTypingStrictness: (strictness: StrictnessLevel) => void
  setOcrProvider: (provider: 'tesseract' | 'gemini') => void
  setGeminiApiKey: (key: string | null) => void
  setSoundEnabled: (enabled: boolean) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      defaultDirection: 'sourceToTarget',
      defaultExerciseType: 'flashcard',
      typingStrictness: 'normal',
      ocrProvider: 'tesseract',
      geminiApiKey: null,
      soundEnabled: true,

      // Actions
      setDefaultDirection: (direction) => set({ defaultDirection: direction }),
      setDefaultExerciseType: (type) => set({ defaultExerciseType: type }),
      setTypingStrictness: (strictness) => set({ typingStrictness: strictness }),
      setOcrProvider: (provider) => set({ ocrProvider: provider }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    }),
    {
      name: 'vocabulary-trainer-settings',
    }
  )
)
