'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AvatarEmoji } from './user-session'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  currentStep: number
  selectedLanguage: string | null
  dailyGoal: number

  // Profile setup (collected during onboarding)
  profileName: string
  profileAvatar: AvatarEmoji | null

  // Actions
  setCurrentStep: (step: number) => void
  setSelectedLanguage: (language: string) => void
  setDailyGoal: (goal: number) => void
  setProfileSetup: (name: string, avatar: AvatarEmoji) => void
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
      profileName: '',
      profileAvatar: null,

      setCurrentStep: (step) => set({ currentStep: step }),
      setSelectedLanguage: (language) => set({ selectedLanguage: language }),
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      setProfileSetup: (name, avatar) => set({ profileName: name, profileAvatar: avatar }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        currentStep: 0,
        selectedLanguage: null,
        dailyGoal: 15,
        profileName: '',
        profileAvatar: null,
      }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
)
