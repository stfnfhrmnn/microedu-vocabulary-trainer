'use client'

import { AchievementPopup, LevelUpPopup } from '@/components/gamification'
import { SyncProvider } from '@/components/providers/SyncProvider'
import { MigrationPrompt } from '@/components/migration/MigrationPrompt'

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <SyncProvider>
      {children}
      <AchievementPopup />
      <LevelUpPopup />
      <MigrationPrompt />
    </SyncProvider>
  )
}
