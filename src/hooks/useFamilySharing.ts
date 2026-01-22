'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/db'
import {
  createFamilyGroup,
  getUserFamilyGroups,
  joinFamilyByCode,
  getFamilyMembers,
  shareBookWithFamily,
  getSharedBooksForFamily,
  copySharedBook,
  setProgressSharing,
  getSharedProgressChildren,
} from '@/lib/services/family-sharing'
import type { FamilyGroup, FamilyMember, SharedBook, UserRole } from '@/lib/db/schema'

// ============================================================================
// Family Groups Hook
// ============================================================================

export function useFamilyGroups(userId: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const groups = useLiveQuery(
    async () => {
      if (!userId) return []
      return getUserFamilyGroups(userId)
    },
    [userId],
    []
  )

  useEffect(() => {
    setIsLoading(groups === undefined)
  }, [groups])

  const createGroup = useCallback(
    async (name: string, role: UserRole = 'parent') => {
      try {
        setError(null)
        return await createFamilyGroup(name, userId, role)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create group')
        throw err
      }
    },
    [userId]
  )

  const joinGroup = useCallback(
    async (inviteCode: string, role: UserRole, nickname?: string) => {
      try {
        setError(null)
        return await joinFamilyByCode(inviteCode, userId, role, nickname)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join group')
        throw err
      }
    },
    [userId]
  )

  return {
    groups: groups || [],
    isLoading,
    error,
    createGroup,
    joinGroup,
  }
}

// ============================================================================
// Family Members Hook
// ============================================================================

export function useFamilyMembers(familyId: string) {
  const members = useLiveQuery(
    async () => {
      if (!familyId) return []
      return getFamilyMembers(familyId)
    },
    [familyId],
    []
  )

  const isLoading = members === undefined

  return {
    members: members || [],
    isLoading,
  }
}

// ============================================================================
// Shared Books Hook
// ============================================================================

export function useSharedBooks(familyId: string, userId: string) {
  const [error, setError] = useState<string | null>(null)

  const sharedBooks = useLiveQuery(
    async () => {
      if (!familyId) return []
      return getSharedBooksForFamily(familyId)
    },
    [familyId],
    []
  )

  const isLoading = sharedBooks === undefined

  const shareBook = useCallback(
    async (bookId: string, permissions: 'view' | 'copy' | 'edit' = 'view') => {
      try {
        setError(null)
        return await shareBookWithFamily(bookId, familyId, userId, permissions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to share book')
        throw err
      }
    },
    [familyId, userId]
  )

  const copyBook = useCallback(
    async (sharedBookId: string) => {
      try {
        setError(null)
        return await copySharedBook(sharedBookId, userId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to copy book')
        throw err
      }
    },
    [userId]
  )

  return {
    sharedBooks: sharedBooks || [],
    isLoading,
    error,
    shareBook,
    copyBook,
  }
}

// ============================================================================
// Progress Sharing Hook (for parents)
// ============================================================================

export function useChildrenProgress(parentUserId: string) {
  const [isLoading, setIsLoading] = useState(true)

  const sharedProgress = useLiveQuery(
    async () => {
      if (!parentUserId) return []
      return getSharedProgressChildren(parentUserId)
    },
    [parentUserId],
    []
  )

  useEffect(() => {
    setIsLoading(sharedProgress === undefined)
  }, [sharedProgress])

  // Get progress data for each child
  const childrenData = useLiveQuery(
    async () => {
      if (!sharedProgress || sharedProgress.length === 0) return []

      const results = await Promise.all(
        sharedProgress.map(async (settings) => {
          // Get vocabulary stats for child
          const progress = await db.learningProgress.toArray()
          const vocabulary = await db.vocabularyItems.toArray()
          const sessions = await db.reviewSessions
            .where('startedAt')
            .above(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
            .toArray()

          const totalWords = vocabulary.length
          const masteredWords = progress.filter((p) => p.interval >= 21).length

          return {
            userId: settings.userId,
            settings,
            stats: {
              totalWords,
              masteredWords,
              masteryPercentage: totalWords > 0 ? (masteredWords / totalWords) * 100 : 0,
              sessionsThisWeek: sessions.length,
              wordsReviewedThisWeek: sessions.reduce((sum, s) => sum + s.totalItems, 0),
            },
          }
        })
      )

      return results
    },
    [sharedProgress],
    []
  )

  return {
    children: childrenData || [],
    isLoading,
  }
}

// ============================================================================
// Progress Sharing Setup Hook (for children)
// ============================================================================

export function useProgressSharingSetup(childUserId: string, parentUserId: string) {
  const [error, setError] = useState<string | null>(null)

  const settings = useLiveQuery(
    async () => {
      if (!childUserId || !parentUserId) return null
      const allSettings = await db.progressShareSettings
        .where('userId')
        .equals(childUserId)
        .toArray()
      return allSettings.find((s) => s.sharedWithId === parentUserId) || null
    },
    [childUserId, parentUserId],
    null
  )

  const updateSettings = useCallback(
    async (newSettings: {
      shareProgress?: boolean
      shareStreak?: boolean
      shareWeakWords?: boolean
    }) => {
      try {
        setError(null)
        return await setProgressSharing(childUserId, parentUserId, newSettings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update settings')
        throw err
      }
    },
    [childUserId, parentUserId]
  )

  return {
    settings,
    error,
    updateSettings,
  }
}
