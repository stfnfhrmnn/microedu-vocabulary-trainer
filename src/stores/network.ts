/**
 * Network Store
 *
 * Manages network membership and caching state.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Network, NetworkMember, UserRole, PeriodType } from '@/lib/db/schema'

interface NetworkState {
  // Current user's networks
  networks: Network[]
  memberships: Map<string, NetworkMember> // networkId -> membership

  // Active network for viewing
  activeNetworkId: string | null

  // Loading states
  isLoading: boolean
  error: string | null

  // Actions
  setNetworks: (networks: Network[]) => void
  addNetwork: (network: Network) => void
  updateNetwork: (id: string, updates: Partial<Network>) => void
  removeNetwork: (id: string) => void

  setMembership: (networkId: string, membership: NetworkMember) => void
  removeMembership: (networkId: string) => void

  setActiveNetwork: (networkId: string | null) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  reset: () => void
}

const initialState = {
  networks: [],
  memberships: new Map(),
  activeNetworkId: null,
  isLoading: false,
  error: null,
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setNetworks: (networks) => set({ networks }),

      addNetwork: (network) => set((state) => ({
        networks: [...state.networks, network],
      })),

      updateNetwork: (id, updates) => set((state) => ({
        networks: state.networks.map((n) =>
          n.id === id ? { ...n, ...updates } : n
        ),
      })),

      removeNetwork: (id) => set((state) => ({
        networks: state.networks.filter((n) => n.id !== id),
        activeNetworkId: state.activeNetworkId === id ? null : state.activeNetworkId,
      })),

      setMembership: (networkId, membership) => set((state) => {
        const newMemberships = new Map(state.memberships)
        newMemberships.set(networkId, membership)
        return { memberships: newMemberships }
      }),

      removeMembership: (networkId) => set((state) => {
        const newMemberships = new Map(state.memberships)
        newMemberships.delete(networkId)
        return { memberships: newMemberships }
      }),

      setActiveNetwork: (networkId) => set({ activeNetworkId: networkId }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'network-storage',
      partialize: (state) => ({
        activeNetworkId: state.activeNetworkId,
        // Don't persist networks - fetch from server
      }),
    }
  )
)

// Selectors
export const selectActiveNetwork = (state: NetworkState) =>
  state.networks.find((n) => n.id === state.activeNetworkId)

export const selectUserRole = (state: NetworkState, networkId: string): UserRole | null => {
  const membership = state.memberships.get(networkId)
  return membership?.role || null
}

export const selectIsAdmin = (state: NetworkState, networkId: string): boolean => {
  const role = selectUserRole(state, networkId)
  return role === 'admin' || role === 'teacher'
}
