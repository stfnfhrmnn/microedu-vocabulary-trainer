'use client'

import { useState, useCallback, useEffect } from 'react'
import { useNetworkStore } from '@/stores/network'
import { useCompetitionStore } from '@/stores/competition'
import type { Network, NetworkMember, PeriodType, LeaderboardEntry } from '@/lib/db/schema'

// Helper to get auth token
function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

/**
 * Hook for managing networks
 */
export function useNetworks() {
  const { networks, setNetworks, addNetwork, removeNetwork, setLoading, setError, isLoading, error } = useNetworkStore()

  const fetchNetworks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/networks', {
        headers: getAuthHeader(),
      })
      if (!response.ok) throw new Error('Failed to fetch networks')
      const data = await response.json()
      setNetworks(data.networks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching networks')
    } finally {
      setLoading(false)
    }
  }, [setNetworks, setLoading, setError])

  const createNetwork = useCallback(async (name: string, type: string, role: string) => {
    try {
      const response = await fetch('/api/networks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ name, type, role }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create network')
      }
      const data = await response.json()
      addNetwork(data.network)
      return data.network
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating network')
      throw err
    }
  }, [addNetwork, setError])

  const joinNetwork = useCallback(async (inviteCode: string, role: string, nickname?: string) => {
    try {
      const response = await fetch('/api/networks/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ inviteCode, role, nickname }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join network')
      }
      const data = await response.json()
      addNetwork(data.network)
      return data.network
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error joining network')
      throw err
    }
  }, [addNetwork, setError])

  const leaveNetwork = useCallback(async (networkId: string, userId: string) => {
    try {
      const response = await fetch(`/api/networks/${networkId}/members/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      })
      if (!response.ok) throw new Error('Failed to leave network')
      removeNetwork(networkId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error leaving network')
      throw err
    }
  }, [removeNetwork, setError])

  return {
    networks,
    isLoading,
    error,
    fetchNetworks,
    createNetwork,
    joinNetwork,
    leaveNetwork,
  }
}

/**
 * Hook for network members
 */
export function useNetworkMembers(networkId: string | null) {
  const [members, setMembers] = useState<NetworkMember[]>([])
  const [competitors, setCompetitors] = useState<NetworkMember[]>([])
  const [supporters, setSupporters] = useState<NetworkMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!networkId) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/networks/${networkId}/members`, {
        headers: getAuthHeader(),
      })
      if (!response.ok) throw new Error('Failed to fetch members')
      const data = await response.json()
      setMembers(data.members || [])
      setCompetitors(data.competitors || [])
      setSupporters(data.supporters || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching members')
    } finally {
      setIsLoading(false)
    }
  }, [networkId])

  useEffect(() => {
    if (networkId) {
      fetchMembers()
    }
  }, [networkId, fetchMembers])

  return { members, competitors, supporters, isLoading, error, refetch: fetchMembers }
}

/**
 * Hook for leaderboard
 */
export function useLeaderboard(networkId: string | null) {
  const { currentPeriod, setCurrentPeriod, setLeaderboard, getLeaderboard } = useCompetitionStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [supporters, setSupporters] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async (period?: PeriodType) => {
    if (!networkId) return
    const periodToUse = period || currentPeriod
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/networks/${networkId}/leaderboard?period=${periodToUse}`,
        { headers: getAuthHeader() }
      )
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      const data = await response.json()
      setEntries(data.competitors || [])
      setSupporters(data.supporters || [])
      setMyRank(data.myRank)
      setLeaderboard(networkId, data.leaderboard, periodToUse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching leaderboard')
    } finally {
      setIsLoading(false)
    }
  }, [networkId, currentPeriod, setLeaderboard])

  useEffect(() => {
    if (networkId) {
      fetchLeaderboard()
    }
  }, [networkId, currentPeriod, fetchLeaderboard])

  return {
    entries,
    supporters,
    myRank,
    currentPeriod,
    setCurrentPeriod,
    isLoading,
    error,
    refetch: fetchLeaderboard,
  }
}

/**
 * Hook for submitting practice stats
 */
export function useStatsSubmission() {
  const { addSessionStats, clearPendingStats, pendingSessionStats, setSyncing } = useCompetitionStore()
  const [error, setError] = useState<string | null>(null)

  const submitStats = useCallback(async (streakDays: number) => {
    if (pendingSessionStats.wordsReviewed === 0) return

    setSyncing(true)
    setError(null)
    try {
      const response = await fetch('/api/stats/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          ...pendingSessionStats,
          streakDays,
        }),
      })
      if (!response.ok) throw new Error('Failed to submit stats')
      clearPendingStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting stats')
    } finally {
      setSyncing(false)
    }
  }, [pendingSessionStats, clearPendingStats, setSyncing])

  const recordSession = useCallback((stats: {
    wordsReviewed: number
    wordsMastered: number
    correctCount: number
    totalCount: number
    xpEarned: number
  }) => {
    addSessionStats(stats)
  }, [addSessionStats])

  return { submitStats, recordSession, error }
}

/**
 * Hook for shared books
 */
export function useSharedBooks(networkId: string | null) {
  const [sharedBooks, setSharedBooks] = useState<unknown[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSharedBooks = useCallback(async () => {
    if (!networkId) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/networks/${networkId}/shared-books`, {
        headers: getAuthHeader(),
      })
      if (!response.ok) throw new Error('Failed to fetch shared books')
      const data = await response.json()
      setSharedBooks(data.sharedBooks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching shared books')
    } finally {
      setIsLoading(false)
    }
  }, [networkId])

  const shareBook = useCallback(async (bookId: string) => {
    if (!networkId) return
    try {
      const response = await fetch('/api/shared-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ bookId, networkId }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to share book')
      }
      await fetchSharedBooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sharing book')
      throw err
    }
  }, [networkId, fetchSharedBooks])

  const copyBook = useCallback(async (sharedBookId: string) => {
    try {
      const response = await fetch(`/api/shared-books/${sharedBookId}/copy`, {
        method: 'POST',
        headers: getAuthHeader(),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to copy book')
      }
      const data = await response.json()
      await fetchSharedBooks()
      return data.copiedBook
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error copying book')
      throw err
    }
  }, [fetchSharedBooks])

  useEffect(() => {
    if (networkId) {
      fetchSharedBooks()
    }
  }, [networkId, fetchSharedBooks])

  return { sharedBooks, isLoading, error, shareBook, copyBook, refetch: fetchSharedBooks }
}
