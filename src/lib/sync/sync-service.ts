import {
  getPendingChanges,
  markChangesSynced,
  clearSyncedChanges,
  getSyncMeta,
  updateSyncMeta,
  isUserRegistered,
} from './sync-queue'
import { applyServerChanges, applyFullData, type ServerData } from './apply-changes'

// ============================================================================
// Types
// ============================================================================

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  pendingChanges: number
  error: string | null
}

export type { ServerData }

// ============================================================================
// Sync Service
// ============================================================================

let authToken: string | null = null

/**
 * Set the auth token for API calls
 */
export function setAuthToken(token: string | null): void {
  authToken = token
  if (token) {
    localStorage.setItem('sync-auth-token', token)
  } else {
    localStorage.removeItem('sync-auth-token')
  }
}

/**
 * Get the auth token (from memory or localStorage)
 */
export function getAuthToken(): string | null {
  if (authToken) return authToken
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('sync-auth-token')
  }
  return authToken
}

/**
 * Check if we can sync (online + registered + has token)
 */
export async function canSync(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.onLine) return false
  const registered = await isUserRegistered()
  const hasToken = !!getAuthToken()
  return registered && hasToken
}

/**
 * Push local changes to server
 */
export async function pushChanges(): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken()
  if (!token) {
    return { success: false, error: 'Not authenticated' }
  }

  const pending = await getPendingChanges()
  if (pending.length === 0) {
    return { success: true }
  }

  try {
    const response = await fetch('/api/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ changes: pending }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Push failed' }
    }

    const result = await response.json()

    // Mark changes as synced
    const syncedIds = pending.map((c) => c.id)
    await markChangesSynced(syncedIds)

    // Update last push timestamp
    await updateSyncMeta({ lastPushTimestamp: Date.now() })

    // Cleanup old synced changes
    await clearSyncedChanges()

    return { success: true, ...result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Pull changes from server since last sync
 */
export async function pullChanges(): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken()
  if (!token) {
    return { success: false, error: 'Not authenticated' }
  }

  const meta = await getSyncMeta()

  try {
    const response = await fetch(
      `/api/sync/pull?since=${meta.lastPullTimestamp}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Pull failed' }
    }

    const data = await response.json()

    // Apply changes to IndexedDB
    if (data.changes) {
      await applyServerChanges(data.changes)
    }

    // Update last pull timestamp
    await updateSyncMeta({ lastPullTimestamp: Date.now() })

    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Full sync for new device - pulls all data
 */
export async function fullSync(): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken()
  if (!token) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const response = await fetch('/api/sync/full', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Full sync failed' }
    }

    const data: ServerData = await response.json()

    // Apply full data to IndexedDB
    await applyFullData(data)

    // Update sync timestamps
    await updateSyncMeta({
      lastPullTimestamp: Date.now(),
      lastPushTimestamp: Date.now(),
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Perform a full sync cycle (push then pull)
 */
export async function sync(): Promise<{ success: boolean; error?: string }> {
  if (!(await canSync())) {
    return { success: false, error: 'Cannot sync - offline or not registered' }
  }

  // Push first
  const pushResult = await pushChanges()
  if (!pushResult.success) {
    return pushResult
  }

  // Then pull
  const pullResult = await pullChanges()
  return pullResult
}

// ============================================================================
// Background Sync Registration
// ============================================================================

/**
 * Register for background sync (if supported)
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    // SyncManager may not be available in all browsers
    const reg = registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }
    if (reg.sync) {
      await reg.sync.register('vocab-sync')
      return true
    }
    return false
  } catch {
    return false
  }
}
