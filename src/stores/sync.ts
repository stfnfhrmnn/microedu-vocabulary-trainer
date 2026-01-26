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
  hasSeenCodePrompt: boolean  // Track if user has seen the code awareness prompt

  // Actions
  setSyncState: (state: SyncState) => void
  setLastSyncTime: (time: number) => void
  setPendingChanges: (count: number) => void
  setError: (error: string | null) => void
  setRegistered: (registered: boolean, serverUserId?: string) => void
  setHasSeenCodePrompt: (seen: boolean) => void
  reset: () => void
}

const initialState = {
  state: 'idle' as SyncState,
  lastSyncTime: null,
  pendingChanges: 0,
  error: null,
  isRegistered: false,
  serverUserId: null,
  hasSeenCodePrompt: false,
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

      setHasSeenCodePrompt: (seen) => set({ hasSeenCodePrompt: seen }),

      reset: () => set(initialState),
    }),
    {
      name: 'vocabulary-trainer-sync',
      partialize: (state) => ({
        lastSyncTime: state.lastSyncTime,
        isRegistered: state.isRegistered,
        serverUserId: state.serverUserId,
        hasSeenCodePrompt: state.hasSeenCodePrompt,
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
  const hasSeenCodePrompt = useSyncStore((s) => s.hasSeenCodePrompt)
  const setHasSeenCodePrompt = useSyncStore((s) => s.setHasSeenCodePrompt)

  return {
    state,
    lastSyncTime,
    pendingChanges,
    error,
    isRegistered,
    hasSeenCodePrompt,
    setHasSeenCodePrompt,
    isSyncing: state === 'syncing',
    isOffline: state === 'offline',
    hasError: state === 'error',
    // Show code prompt if registered but haven't seen it yet
    shouldShowCodePrompt: isRegistered && !hasSeenCodePrompt,
  }
}
