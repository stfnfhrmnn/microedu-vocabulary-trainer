import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateUserId } from '@/lib/utils/user-id'

// Available emoji avatars
export const AVATAR_OPTIONS = [
  '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🦉',
  '🐙', '🦋', '🌟', '🚀', '🎨', '🎵', '📚', '🔮'
] as const

export type AvatarEmoji = typeof AVATAR_OPTIONS[number]

export interface UserProfile {
  id: string           // XXXX-XXXX format
  name: string         // Display name
  avatar: AvatarEmoji  // Emoji avatar
  createdAt: number    // Unix timestamp
}

interface UserSessionState {
  // State
  currentUserId: string | null
  profiles: UserProfile[]

  // Actions
  createProfile: (name?: string, avatar?: AvatarEmoji) => UserProfile
  upsertProfile: (profile: { id: string; name?: string; avatar?: string }) => UserProfile
  switchProfile: (id: string) => void
  updateProfile: (id: string, updates: Partial<Pick<UserProfile, 'name' | 'avatar'>>) => void
  deleteProfile: (id: string) => void
  getCurrentProfile: () => UserProfile | null
}

function getRandomAvatar(): AvatarEmoji {
  const index = Math.floor(Math.random() * AVATAR_OPTIONS.length)
  return AVATAR_OPTIONS[index]
}

function resolveAvatar(avatar?: string): AvatarEmoji {
  if (avatar && (AVATAR_OPTIONS as readonly string[]).includes(avatar)) {
    return avatar as AvatarEmoji
  }
  return getRandomAvatar()
}

export const useUserSession = create<UserSessionState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      profiles: [],

      createProfile: (name = 'Benutzer', avatar) => {
        const newProfile: UserProfile = {
          id: generateUserId(),
          name,
          avatar: avatar ?? getRandomAvatar(),
          createdAt: Date.now(),
        }

        set((state) => ({
          profiles: [...state.profiles, newProfile],
          currentUserId: newProfile.id,
        }))

        return newProfile
      },

      upsertProfile: (profile) => {
        const normalizedName = profile.name?.trim() || 'Benutzer'
        const normalizedAvatar = resolveAvatar(profile.avatar)
        const existingIndex = get().profiles.findIndex((p) => p.id === profile.id)

        if (existingIndex >= 0) {
          set((state) => ({
            profiles: state.profiles.map((p) =>
              p.id === profile.id
                ? { ...p, name: normalizedName, avatar: normalizedAvatar }
                : p
            ),
            currentUserId: profile.id,
          }))

          return {
            ...get().profiles[existingIndex],
            name: normalizedName,
            avatar: normalizedAvatar,
          }
        }

        const newProfile: UserProfile = {
          id: profile.id,
          name: normalizedName,
          avatar: normalizedAvatar,
          createdAt: Date.now(),
        }

        set((state) => ({
          profiles: [...state.profiles, newProfile],
          currentUserId: profile.id,
        }))

        return newProfile
      },

      switchProfile: (id) => {
        const { profiles } = get()
        const profile = profiles.find((p) => p.id === id)
        if (profile) {
          set({ currentUserId: id })
        }
      },

      updateProfile: (id, updates) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }))
      },

      deleteProfile: (id) => {
        const { profiles, currentUserId } = get()

        // Don't allow deleting the last profile
        if (profiles.length <= 1) return

        const newProfiles = profiles.filter((p) => p.id !== id)

        // If deleting current profile, switch to another
        const newCurrentId =
          currentUserId === id
            ? newProfiles[0]?.id ?? null
            : currentUserId

        set({
          profiles: newProfiles,
          currentUserId: newCurrentId,
        })
      },

      getCurrentProfile: () => {
        const { currentUserId, profiles } = get()
        if (!currentUserId) return null
        return profiles.find((p) => p.id === currentUserId) ?? null
      },
    }),
    {
      name: 'vocabulary-trainer-user-session',
    }
  )
)

// Default profile for SSR/initial render
const DEFAULT_PROFILE: UserProfile = {
  id: 'XXXX-XXXX',
  name: 'Benutzer',
  avatar: '🦊',
  createdAt: 0,
}

// Hook to get current profile (client-side only)
// Note: Does NOT auto-create profiles - that's handled by onboarding
export function useCurrentProfile(): UserProfile {
  const currentUserId = useUserSession((s) => s.currentUserId)
  const profiles = useUserSession((s) => s.profiles)
  const [isClient, setIsClient] = useState(false)

  // Detect client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Return default profile during SSR or if no profile exists
  if (!isClient || !currentUserId || profiles.length === 0) {
    return DEFAULT_PROFILE
  }

  const profile = profiles.find((p) => p.id === currentUserId)
  return profile ?? DEFAULT_PROFILE
}

// Check if a profile exists (useful for redirecting to onboarding)
export function useHasProfile(): boolean {
  const profiles = useUserSession((s) => s.profiles)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return true // Assume true during SSR to avoid flicker
  return profiles.length > 0
}
