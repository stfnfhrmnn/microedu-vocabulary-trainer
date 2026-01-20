'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  currentStep: number
  selectedLanguage: string | null
  dailyGoal: number

  // Actions
  setCurrentStep: (step: number) => void
  setSelectedLanguage: (language: string) => void
  setDailyGoal: (goal: number) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      selectedLanguage: null,
      dailyGoal: 15,

      setCurrentStep: (step) => set({ currentStep: step }),
      setSelectedLanguage: (language) => set({ selectedLanguage: language }),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        currentStep: 0,
        selectedLanguage: null,
        dailyGoal: 15,
      }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
)
