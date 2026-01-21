import {
  getPendingChanges,
  markChangesSynced,
  clearSyncedChanges,
  getSyncMeta,
  updateSyncMeta,
  isUserRegistered,
  type SyncChange,
} from './sync-queue'
import { db } from '@/lib/db/db'
import type {
  Book,
  Chapter,
  Section,
  VocabularyItem,
  LearningProgress,
} from '@/lib/db/schema'

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

export interface ServerData {
  books: Array<Book & { localId: string }>
  chapters: Array<Chapter & { localId: string; localBookId: string }>
  sections: Array<Section & { localId: string; localChapterId: string; localBookId: string }>
  vocabularyItems: Array<
    VocabularyItem & {
      localId: string
      localSectionId: string
      localChapterId: string
      localBookId: string
    }
  >
  learningProgress: Array<LearningProgress & { localVocabularyId: string }>
  gamification: Record<string, unknown>
  achievements: Record<string, unknown>
  settings: Record<string, unknown>
}

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
// Data Application Helpers
// ============================================================================

/**
 * Apply incremental changes from server to IndexedDB
 */
async function applyServerChanges(changes: SyncChange[]): Promise<void> {
  for (const change of changes) {
    try {
      await applyChange(change)
    } catch (error) {
      console.error(`Failed to apply change:`, change, error)
    }
  }
}

/**
 * Apply a single change to IndexedDB
 */
async function applyChange(change: SyncChange): Promise<void> {
  const { table, operation, localId, data } = change

  switch (table) {
    case 'books':
      if (operation === 'delete') {
        await db.books.delete(localId)
      } else if (data) {
        const existing = await db.books.get(localId)
        if (existing) {
          await db.books.update(localId, data as Partial<Book>)
        } else {
          await db.books.add({ ...data, id: localId } as Book)
        }
      }
      break

    case 'chapters':
      if (operation === 'delete') {
        await db.chapters.delete(localId)
      } else if (data) {
        const existing = await db.chapters.get(localId)
        if (existing) {
          await db.chapters.update(localId, data as Partial<Chapter>)
        } else {
          await db.chapters.add({ ...data, id: localId } as Chapter)
        }
      }
      break

    case 'sections':
      if (operation === 'delete') {
        await db.sections.delete(localId)
      } else if (data) {
        const existing = await db.sections.get(localId)
        if (existing) {
          await db.sections.update(localId, data as Partial<Section>)
        } else {
          await db.sections.add({ ...data, id: localId } as Section)
        }
      }
      break

    case 'vocabularyItems':
      if (operation === 'delete') {
        await db.vocabularyItems.delete(localId)
      } else if (data) {
        const existing = await db.vocabularyItems.get(localId)
        if (existing) {
          await db.vocabularyItems.update(localId, data as Partial<VocabularyItem>)
        } else {
          await db.vocabularyItems.add({ ...data, id: localId } as VocabularyItem)
        }
      }
      break

    case 'learningProgress':
      if (operation === 'delete') {
        await db.learningProgress.delete(localId)
      } else if (data) {
        const existing = await db.learningProgress.get(localId)
        if (existing) {
          await db.learningProgress.update(localId, data as Partial<LearningProgress>)
        } else {
          await db.learningProgress.add({ ...data, id: localId } as LearningProgress)
        }
      }
      break
  }
}

/**
 * Apply full data dump to IndexedDB (for new device)
 */
async function applyFullData(data: ServerData): Promise<void> {
  // Use transaction to ensure atomicity
  await db.transaction(
    'rw',
    [db.books, db.chapters, db.sections, db.vocabularyItems, db.learningProgress],
    async () => {
      // Books
      for (const book of data.books) {
        const existing = await db.books.get(book.localId)
        if (!existing) {
          await db.books.add({
            id: book.localId,
            name: book.name,
            language: book.language as 'french' | 'spanish' | 'latin',
            description: book.description,
            coverColor: book.coverColor,
            createdAt: new Date(book.createdAt),
            updatedAt: new Date(book.updatedAt),
          })
        }
      }

      // Chapters
      for (const chapter of data.chapters) {
        const existing = await db.chapters.get(chapter.localId)
        if (!existing) {
          await db.chapters.add({
            id: chapter.localId,
            bookId: chapter.localBookId,
            name: chapter.name,
            order: chapter.order,
            createdAt: new Date(chapter.createdAt),
            updatedAt: new Date(chapter.updatedAt),
          })
        }
      }

      // Sections
      for (const section of data.sections) {
        const existing = await db.sections.get(section.localId)
        if (!existing) {
          await db.sections.add({
            id: section.localId,
            chapterId: section.localChapterId,
            bookId: section.localBookId,
            name: section.name,
            order: section.order,
            coveredInClass: section.coveredInClass,
            createdAt: new Date(section.createdAt),
            updatedAt: new Date(section.updatedAt),
          })
        }
      }

      // Vocabulary Items
      for (const item of data.vocabularyItems) {
        const existing = await db.vocabularyItems.get(item.localId)
        if (!existing) {
          await db.vocabularyItems.add({
            id: item.localId,
            sectionId: item.localSectionId,
            chapterId: item.localChapterId,
            bookId: item.localBookId,
            sourceText: item.sourceText,
            targetText: item.targetText,
            notes: item.notes,
            imageUrl: item.imageUrl,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })
        }
      }

      // Learning Progress
      for (const progress of data.learningProgress) {
        const existing = await db.learningProgress
          .where('vocabularyId')
          .equals(progress.localVocabularyId)
          .first()
        if (!existing) {
          await db.learningProgress.add({
            id: progress.id,
            vocabularyId: progress.localVocabularyId,
            easeFactor: Number(progress.easeFactor),
            interval: progress.interval,
            repetitions: progress.repetitions,
            nextReviewDate: new Date(progress.nextReviewDate),
            totalReviews: progress.totalReviews,
            correctReviews: progress.correctReviews,
            lastReviewDate: progress.lastReviewDate
              ? new Date(progress.lastReviewDate)
              : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      }
    }
  )

  // TODO: Apply gamification, achievements, settings to Zustand stores
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
