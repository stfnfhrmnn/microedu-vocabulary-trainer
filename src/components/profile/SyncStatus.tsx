'use client'

import { useSyncStatus } from '@/stores/sync'
import { cn } from '@/lib/utils/cn'

interface SyncStatusProps {
  className?: string
  showLabel?: boolean
}

export function SyncStatus({ className, showLabel = false }: SyncStatusProps) {
  const { state, pendingChanges, isRegistered } = useSyncStatus()

  if (!isRegistered) {
    return null
  }

  const statusConfig = {
    idle: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      color: 'text-success-500',
      label: 'Synchronisiert',
    },
    syncing: {
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
      color: 'text-primary-500',
      label: 'Synchronisiere...',
    },
    error: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-error-500',
      label: 'Sync-Fehler',
    },
    offline: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
          />
        </svg>
      ),
      color: 'text-gray-400',
      label: 'Offline',
    },
  }

  const config = statusConfig[state]

  return (
    <div className={cn('flex items-center gap-1', config.color, className)}>
      {config.icon}
      {showLabel && <span className="text-sm">{config.label}</span>}
      {pendingChanges > 0 && state !== 'syncing' && (
        <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
          {pendingChanges}
        </span>
      )}
    </div>
  )
}
