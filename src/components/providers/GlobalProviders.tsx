'use client'

import { AchievementPopup } from '@/components/gamification'

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AchievementPopup />
    </>
  )
}
