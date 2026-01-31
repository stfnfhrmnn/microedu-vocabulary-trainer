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
import { toast } from '@/stores/toast'

const SYNC_INTERVAL = 30000 // 30 seconds

export function useSync() {
  // Use individual selectors for stable references
  const state = useSyncStore((s) => s.state)
  const isRegistered = useSyncStore((s) => s.isRegistered)
  const setSyncState = useSyncStore((s) => s.setSyncState)
  const setLastSyncTime = useSyncStore((s) => s.setLastSyncTime)
  const setPendingChanges = useSyncStore((s) => s.setPendingChanges)
  const setError = useSyncStore((s) => s.setError)

  const syncInProgressRef = useRef(false)
  const initRef = useRef(false)

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
        // Show toast only for first sync error to avoid spamming
        const currentError = useSyncStore.getState().error
        if (!currentError) {
          toast.error('Synchronisierung fehlgeschlagen. Daten werden lokal gespeichert.')
        }
      }
    } catch (error) {
      const message = (error as Error).message
      setError(message)
      setSyncState('error')
      // Show toast only for first sync error
      const currentError = useSyncStore.getState().error
      if (!currentError) {
        toast.error('Synchronisierung fehlgeschlagen. Daten werden lokal gespeichert.')
      }
    } finally {
      syncInProgressRef.current = false
    }
  }, [setSyncState, setLastSyncTime, setError])

  // Update pending changes count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingChangeCount()
    setPendingChanges(count)
  }, [setPendingChanges])

  // Initialize sync on mount (only once)
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

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
  }, []) // Empty deps - run only once

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
      useSyncStore.getState().setSyncState('idle')
      // Trigger sync without using callback reference
      if (!syncInProgressRef.current) {
        syncInProgressRef.current = true
        sync().finally(() => {
          syncInProgressRef.current = false
        })
      }
    }

    function handleOffline() {
      useSyncStore.getState().setSyncState('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      useSyncStore.getState().setSyncState('offline')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, []) // No deps needed - uses getState()

  // Handle visibility change (sync when tab becomes visible)
  useEffect(() => {
    function handleVisibilityChange() {
      const { isRegistered } = useSyncStore.getState()
      if (document.visibilityState === 'visible' && isRegistered) {
        if (!syncInProgressRef.current) {
          syncInProgressRef.current = true
          sync().finally(() => {
            syncInProgressRef.current = false
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, []) // No deps needed - uses getState()

  return {
    state,
    performSync,
    isRegistered,
  }
}
