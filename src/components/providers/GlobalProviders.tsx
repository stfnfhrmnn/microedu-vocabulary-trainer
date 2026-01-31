'use client'

import { AchievementPopup, LevelUpPopup } from '@/components/gamification'
import { SyncProvider } from '@/components/providers/SyncProvider'
import { MigrationPrompt } from '@/components/migration/MigrationPrompt'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SyncProvider>
        {children}
        <AchievementPopup />
        <LevelUpPopup />
        <MigrationPrompt />
        <ToastContainer />
      </SyncProvider>
    </ErrorBoundary>
  )
}
