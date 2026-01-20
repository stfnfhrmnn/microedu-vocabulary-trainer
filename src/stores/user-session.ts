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
  switchProfile: (id: string) => void
  updateProfile: (id: string, updates: Partial<Pick<UserProfile, 'name' | 'avatar'>>) => void
  deleteProfile: (id: string) => void
  getCurrentProfile: () => UserProfile | null
}

function getRandomAvatar(): AvatarEmoji {
  const index = Math.floor(Math.random() * AVATAR_OPTIONS.length)
  return AVATAR_OPTIONS[index]
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

// Hook to get current profile with auto-creation (client-side only)
export function useCurrentProfile(): UserProfile {
  const { currentUserId, profiles, createProfile, getCurrentProfile } = useUserSession()
  const [isClient, setIsClient] = useState(false)

  // Detect client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Return default profile during SSR
  if (!isClient) {
    return DEFAULT_PROFILE
  }

  // Auto-create profile if none exists (client-side only)
  if (!currentUserId || profiles.length === 0) {
    return createProfile()
  }

  const profile = getCurrentProfile()
  if (!profile) {
    // Current user not found, create new one
    return createProfile()
  }

  return profile
}
