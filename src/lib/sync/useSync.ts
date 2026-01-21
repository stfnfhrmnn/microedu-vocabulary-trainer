'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useSyncStore } from '@/stores/sync'
import {
  sync,
  canSync,
  getAuthToken,
  setAuthToken,
  registerBackgroundSync,
} from './sync-service'
import { getPendingChangeCount, getSyncMeta } from './sync-queue'

const SYNC_INTERVAL = 30000 // 30 seconds

export function useSync() {
  const {
    state,
    setSyncState,
    setLastSyncTime,
    setPendingChanges,
    setError,
    isRegistered,
  } = useSyncStore()

  const syncInProgressRef = useRef(false)

  // Perform sync
  const performSync = useCallback(async () => {
    if (syncInProgressRef.current) return
    if (!(await canSync())) {
      setSyncState('offline')
      return
    }

    syncInProgressRef.current = true
    setSyncState('syncing')

    try {
      const result = await sync()
      if (result.success) {
        setSyncState('idle')
        setLastSyncTime(Date.now())
        setError(null)
      } else {
        setError(result.error || 'Sync failed')
        setSyncState('error')
      }
    } catch (error) {
      setError((error as Error).message)
      setSyncState('error')
    } finally {
      syncInProgressRef.current = false
    }
  }, [setSyncState, setLastSyncTime, setError])

  // Update pending changes count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingChangeCount()
    setPendingChanges(count)
  }, [setPendingChanges])

  // Initialize sync on mount
  useEffect(() => {
    async function init() {
      // Restore token from storage
      const token = getAuthToken()
      if (token) {
        setAuthToken(token)
      }

      // Check registration status
      const meta = await getSyncMeta()
      if (meta.isRegistered) {
        // Perform initial sync
        await performSync()
      }

      // Update pending count
      await updatePendingCount()

      // Register background sync
      registerBackgroundSync()
    }

    init()
  }, [performSync, updatePendingCount])

  // Set up sync interval
  useEffect(() => {
    if (!isRegistered) return

    const interval = setInterval(async () => {
      await performSync()
      await updatePendingCount()
    }, SYNC_INTERVAL)

    return () => clearInterval(interval)
  }, [isRegistered, performSync, updatePendingCount])

  // Handle online/offline events
  useEffect(() => {
    function handleOnline() {
      setSyncState('idle')
      performSync()
    }

    function handleOffline() {
      setSyncState('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial state
    if (!navigator.onLine) {
      setSyncState('offline')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setSyncState, performSync])

  // Handle visibility change (sync when tab becomes visible)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && isRegistered) {
        performSync()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRegistered, performSync])

  return {
    state,
    performSync,
    isRegistered,
  }
}
