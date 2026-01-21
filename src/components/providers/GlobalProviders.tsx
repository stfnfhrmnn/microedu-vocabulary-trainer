'use client'

import { AchievementPopup } from '@/components/gamification'
// Temporarily disabled to debug infinite loop
// import { SyncProvider } from '@/components/providers/SyncProvider'
// import { MigrationPrompt } from '@/components/migration/MigrationPrompt'

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AchievementPopup />
    </>
  )
}
