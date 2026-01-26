'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnboarding } from '@/stores/onboarding'
import { useUserSession } from '@/stores/user-session'
import type { AvatarEmoji } from '@/stores/user-session'
import { WelcomeSlide } from '@/components/onboarding/WelcomeSlide'
import { ProfileSetup } from '@/components/onboarding/ProfileSetup'
import { GoalSelection } from '@/components/onboarding/GoalSelection'
import { SetupComplete } from '@/components/onboarding/SetupComplete'

export default function OnboardingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const {
    hasCompletedOnboarding,
    currentStep,
    dailyGoal,
    profileName,
    profileAvatar,
    setCurrentStep,
    setDailyGoal,
    setProfileSetup,
    completeOnboarding,
  } = useOnboarding()

  const { profiles, createProfile } = useUserSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && hasCompletedOnboarding) {
      router.replace('/')
    }
  }, [hasCompletedOnboarding, router, mounted])

  if (!mounted || hasCompletedOnboarding) {
    return null
  }

  const handleProfileSetup = (name: string, avatar: AvatarEmoji) => {
    setProfileSetup(name, avatar)
    setCurrentStep(2)
  }

  const handleComplete = () => {
    // Create the profile with the name and avatar chosen during onboarding
    // Only create if no profile exists yet
    if (profiles.length === 0 && profileName && profileAvatar) {
      createProfile(profileName, profileAvatar)
    }
    completeOnboarding()
    router.push('/')
  }

  const totalSteps = 4 // Welcome, Profile Setup, Goals, Complete

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress indicator */}
      {currentStep > 0 && (
        <div className="px-6 pt-6">
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < currentStep ? 1 : 0.3 }}
                className={`h-1 flex-1 rounded-full origin-left ${
                  i < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <WelcomeSlide
              key="welcome"
              onNext={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 1 && (
            <ProfileSetup
              key="profile"
              initialName={profileName}
              initialAvatar={profileAvatar || undefined}
              onComplete={handleProfileSetup}
              onBack={() => setCurrentStep(0)}
            />
          )}

          {currentStep === 2 && (
            <GoalSelection
              key="goals"
              selectedGoal={dailyGoal}
              onSelectGoal={setDailyGoal}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <SetupComplete
              key="complete"
              userName={profileName || 'Benutzer'}
              dailyGoal={dailyGoal}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
