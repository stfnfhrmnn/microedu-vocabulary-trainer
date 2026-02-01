import Dexie, { type Table } from 'dexie'

// ============================================================================
// Change Types
// ============================================================================

export type ChangeOperation = 'create' | 'update' | 'delete'

export type ChangeTable =
  | 'books'
  | 'chapters'
  | 'sections'
  | 'vocabularyItems'
  | 'learningProgress'

export interface SyncChange {
  id: string
  table: ChangeTable
  operation: ChangeOperation
  localId: string // The local ID of the affected record
  data: Record<string, unknown> | null // Full record for create/update, null for delete
  timestamp: number // Unix timestamp when change was made
  synced: boolean // Whether this change has been pushed to server
}

export interface SyncMeta {
  id: string
  lastPullTimestamp: number // Last successful pull from server
  lastPushTimestamp: number // Last successful push to server
  serverUserId: string | null // Server UUID for this user
  isRegistered: boolean // Whether user has a server account
}

// ============================================================================
// Sync Database
// ============================================================================

class SyncDatabase extends Dexie {
  changes!: Table<SyncChange, string>
  meta!: Table<SyncMeta, string>

  constructor() {
    super('VocabularySyncQueue')

    this.version(1).stores({
      changes: 'id, table, localId, timestamp, synced',
      meta: 'id',
    })
  }
}

const syncDb = new SyncDatabase()

// ============================================================================
// Change Queue Operations
// ============================================================================

/**
 * Queue a change for sync
 */
export async function queueChange(
  table: ChangeTable,
  operation: ChangeOperation,
  localId: string,
  data: Record<string, unknown> | null
): Promise<void> {
  const change: SyncChange = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    table,
    operation,
    localId,
    data,
    timestamp: Date.now(),
    synced: false,
  }
  await syncDb.changes.add(change)
}

/**
 * Get all pending (unsynced) changes
 */
export async function getPendingChanges(): Promise<SyncChange[]> {
  return syncDb.changes.where('synced').equals(0).sortBy('timestamp')
}

/**
 * Mark changes as synced
 */
export async function markChangesSynced(changeIds: string[]): Promise<void> {
  await syncDb.changes.where('id').anyOf(changeIds).modify({ synced: true })
}

/**
 * Clear synced changes (cleanup)
 */
export async function clearSyncedChanges(): Promise<void> {
  await syncDb.changes.where('synced').equals(1).delete()
}

/**
 * Clear all changes (for full reset)
 */
export async function clearAllChanges(): Promise<void> {
  await syncDb.changes.clear()
}

// ============================================================================
// Sync Meta Operations
// ============================================================================

const META_ID = 'sync-meta'

const DEFAULT_META: SyncMeta = {
  id: META_ID,
  lastPullTimestamp: 0,
  lastPushTimestamp: 0,
  serverUserId: null,
  isRegistered: false,
}

/**
 * Get sync metadata
 */
export async function getSyncMeta(): Promise<SyncMeta> {
  const meta = await syncDb.meta.get(META_ID)
  if (meta) return meta

  await syncDb.meta.put(DEFAULT_META)
  return DEFAULT_META
}

/**
 * Update sync metadata
 */
export async function updateSyncMeta(updates: Partial<SyncMeta>): Promise<void> {
  const existing = await syncDb.meta.get(META_ID)
  if (existing) {
    await syncDb.meta.update(META_ID, updates)
  } else {
    await syncDb.meta.put({ ...DEFAULT_META, ...updates })
  }
}

/**
 * Check if user is registered with server
 */
export async function isUserRegistered(): Promise<boolean> {
  const meta = await getSyncMeta()
  return meta.isRegistered
}

/**
 * Set registration status
 */
export async function setRegistered(
  serverUserId: string,
  registered: boolean = true
): Promise<void> {
  await updateSyncMeta({
    serverUserId,
    isRegistered: registered,
  })
}

/**
 * Get pending change count
 */
export async function getPendingChangeCount(): Promise<number> {
  return syncDb.changes.where('synced').equals(0).count()
}

// Export the database for direct access if needed
export { syncDb }
