'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnboarding } from '@/stores/onboarding'
import { useUserSession, useCurrentProfile } from '@/stores/user-session'
import { WelcomeSlide } from '@/components/onboarding/WelcomeSlide'
import { GoalSelection } from '@/components/onboarding/GoalSelection'
import { SetupComplete } from '@/components/onboarding/SetupComplete'

export default function OnboardingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const {
    hasCompletedOnboarding,
    currentStep,
    dailyGoal,
    setCurrentStep,
    setDailyGoal,
    completeOnboarding,
  } = useOnboarding()

  const currentProfile = useCurrentProfile()

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

  const handleComplete = () => {
    completeOnboarding()
    router.push('/')
  }

  const totalSteps = 3

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
            <GoalSelection
              key="goals"
              selectedGoal={dailyGoal}
              onSelectGoal={setDailyGoal}
              onNext={() => setCurrentStep(2)}
              onBack={() => setCurrentStep(0)}
            />
          )}

          {currentStep === 2 && (
            <SetupComplete
              key="complete"
              userName={currentProfile?.name || ''}
              dailyGoal={dailyGoal}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
