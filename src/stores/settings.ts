import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PracticeDirection, ExerciseType } from '@/lib/db/schema'
import type { StrictnessLevel } from '@/lib/learning/fuzzy-match'
import type { OCRProviderType } from '@/lib/ocr/types'
import type { Locale } from '@/i18n/config'

export type TTSProvider = 'web-speech' | 'google-cloud'
export type GoogleVoiceType = 'wavenet' | 'standard'
export type TTSLanguageOverride = 'auto' | 'german' | 'french' | 'spanish' | 'latin'

// Practice preset configuration
export interface PracticePreset {
  id: string
  name: string
  exerciseType: ExerciseType
  direction: PracticeDirection
  dueOnly: boolean
  sectionIds: string[] | 'all'  // 'all' means all available sections
}

// Last used practice configuration for quick start
export interface LastPracticeConfig {
  exerciseType: ExerciseType
  direction: PracticeDirection
  dueOnly: boolean
  sectionIds: string[]
}

interface SettingsState {
  // Practice defaults
  defaultDirection: PracticeDirection
  defaultExerciseType: ExerciseType
  typingStrictness: StrictnessLevel

  // OCR settings
  ocrProvider: OCRProviderType

  // Voice practice settings
  ttsProvider: TTSProvider
  useAIAnalysis: boolean  // Use Gemini for answer analysis

  // Voice control settings
  ttsRate: number         // 0.5 to 2.0 (1.0 = normal)
  ttsPitch: number        // 0.5 to 2.0 (1.0 = normal) - Web Speech only
  googleVoiceType: GoogleVoiceType  // WaveNet (better) or Standard
  ttsLanguageOverride: TTSLanguageOverride

  // App settings
  locale: Locale
  soundEnabled: boolean
  hapticEnabled: boolean

  // Add vocabulary settings
  lastUsedSectionId: string | null
  recentSectionIds: string[]  // Last 5 used sections for quick-picker

  // Practice settings
  practicePresets: PracticePreset[]
  lastPracticeConfig: LastPracticeConfig | null

  // Library navigation settings
  lastViewedSections: Record<string, string>  // chapterId -> sectionId

  // Actions
  setDefaultDirection: (direction: PracticeDirection) => void
  setDefaultExerciseType: (type: ExerciseType) => void
  setTypingStrictness: (strictness: StrictnessLevel) => void
  setOcrProvider: (provider: OCRProviderType) => void
  setTTSProvider: (provider: TTSProvider) => void
  setUseAIAnalysis: (enabled: boolean) => void
  setTTSRate: (rate: number) => void
  setTTSPitch: (pitch: number) => void
  setGoogleVoiceType: (type: GoogleVoiceType) => void
  setTTSLanguageOverride: (override: TTSLanguageOverride) => void
  setLocale: (locale: Locale) => void
  setSoundEnabled: (enabled: boolean) => void
  setHapticEnabled: (enabled: boolean) => void
  setLastUsedSectionId: (id: string | null) => void
  addRecentSection: (id: string) => void
  setLastPracticeConfig: (config: LastPracticeConfig) => void
  addPracticePreset: (preset: PracticePreset) => void
  removePracticePreset: (id: string) => void
  setLastViewedSection: (chapterId: string, sectionId: string) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      defaultDirection: 'sourceToTarget',
      defaultExerciseType: 'flashcard',
      typingStrictness: 'normal',
      ocrProvider: 'tesseract',
      ttsProvider: 'web-speech',
      useAIAnalysis: false,
      ttsRate: 1.0,
      ttsPitch: 1.0,
      googleVoiceType: 'wavenet',
      ttsLanguageOverride: 'auto',
      locale: 'de',
      soundEnabled: true,
      hapticEnabled: true,
      lastUsedSectionId: null,
      recentSectionIds: [],
      practicePresets: [],
      lastPracticeConfig: null,
      lastViewedSections: {},

      // Actions
      setDefaultDirection: (direction) => set({ defaultDirection: direction }),
      setDefaultExerciseType: (type) => set({ defaultExerciseType: type }),
      setTypingStrictness: (strictness) => set({ typingStrictness: strictness }),
      setOcrProvider: (provider) => set({ ocrProvider: provider }),
      setTTSProvider: (provider) => set({ ttsProvider: provider }),
      setUseAIAnalysis: (enabled) => set({ useAIAnalysis: enabled }),
      setTTSRate: (rate) => set({ ttsRate: rate }),
      setTTSPitch: (pitch) => set({ ttsPitch: pitch }),
      setGoogleVoiceType: (type) => set({ googleVoiceType: type }),
      setTTSLanguageOverride: (override) => set({ ttsLanguageOverride: override }),
      setLocale: (locale) => set({ locale }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
      setLastUsedSectionId: (id) => set({ lastUsedSectionId: id }),
      addRecentSection: (id) => set((state) => {
        // Remove if already exists, add to front, keep max 5
        const filtered = state.recentSectionIds.filter((s) => s !== id)
        return { recentSectionIds: [id, ...filtered].slice(0, 5) }
      }),
      setLastPracticeConfig: (config) => set({ lastPracticeConfig: config }),
      addPracticePreset: (preset) => set((state) => ({
        practicePresets: [...state.practicePresets, preset]
      })),
      removePracticePreset: (id) => set((state) => ({
        practicePresets: state.practicePresets.filter((p) => p.id !== id)
      })),
      setLastViewedSection: (chapterId, sectionId) => set((state) => ({
        lastViewedSections: { ...state.lastViewedSections, [chapterId]: sectionId }
      })),
    }),
    {
      name: 'vocabulary-trainer-settings',
      // Migration to clean up old settings
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>
        // Remove old API key fields (now deployment-level via env var)
        delete state.geminiApiKey
        delete state.googleApiKey
        // Migrate old 'gemini' provider to 'google-vision'
        if (state.ocrProvider === 'gemini') {
          state.ocrProvider = 'google-vision'
        }
        if (!state.ttsLanguageOverride) {
          state.ttsLanguageOverride = 'auto'
        }
        return state as unknown as SettingsState
      },
      version: 3,
    }
  )
)
