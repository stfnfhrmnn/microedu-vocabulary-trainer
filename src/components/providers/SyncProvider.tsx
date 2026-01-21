'use client'

import { useSync } from '@/lib/sync/useSync'

interface SyncProviderProps {
  children: React.ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  // Initialize sync functionality
  useSync()

  return <>{children}</>
}
