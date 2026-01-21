import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SyncState = 'idle' | 'syncing' | 'error' | 'offline'

interface SyncStore {
  // State
  state: SyncState
  lastSyncTime: number | null
  pendingChanges: number
  error: string | null
  isRegistered: boolean
  serverUserId: string | null

  // Actions
  setSyncState: (state: SyncState) => void
  setLastSyncTime: (time: number) => void
  setPendingChanges: (count: number) => void
  setError: (error: string | null) => void
  setRegistered: (registered: boolean, serverUserId?: string) => void
  reset: () => void
}

const initialState = {
  state: 'idle' as SyncState,
  lastSyncTime: null,
  pendingChanges: 0,
  error: null,
  isRegistered: false,
  serverUserId: null,
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSyncState: (state) => set({ state, error: state === 'error' ? undefined : null }),

      setLastSyncTime: (time) => set({ lastSyncTime: time }),

      setPendingChanges: (count) => set({ pendingChanges: count }),

      setError: (error) => set({ error, state: error ? 'error' : 'idle' }),

      setRegistered: (registered, serverUserId) =>
        set({
          isRegistered: registered,
          serverUserId: serverUserId ?? null,
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'vocabulary-trainer-sync',
      partialize: (state) => ({
        lastSyncTime: state.lastSyncTime,
        isRegistered: state.isRegistered,
        serverUserId: state.serverUserId,
      }),
    }
  )
)

// Selector hooks for common patterns
export function useSyncStatus() {
  const state = useSyncStore((s) => s.state)
  const lastSyncTime = useSyncStore((s) => s.lastSyncTime)
  const pendingChanges = useSyncStore((s) => s.pendingChanges)
  const error = useSyncStore((s) => s.error)
  const isRegistered = useSyncStore((s) => s.isRegistered)

  return {
    state,
    lastSyncTime,
    pendingChanges,
    error,
    isRegistered,
    isSyncing: state === 'syncing',
    isOffline: state === 'offline',
    hasError: state === 'error',
  }
}
