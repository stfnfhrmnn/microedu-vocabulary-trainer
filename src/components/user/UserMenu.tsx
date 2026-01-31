'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AvatarPicker } from './AvatarPicker'
import { ShareButton } from '@/components/profile/ShareButton'
import { SyncStatus } from '@/components/profile/SyncStatus'
import {
  useUserSession,
  useCurrentProfile,
  AVATAR_OPTIONS,
  type AvatarEmoji,
  type UserProfile,
} from '@/stores/user-session'
import { useSyncStatus } from '@/stores/sync'
import { formatUserIdShort } from '@/lib/utils/user-id'
import { cn } from '@/lib/utils/cn'

interface UserMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const profile = useCurrentProfile()
  const { profiles, updateProfile, switchProfile, createProfile, deleteProfile } =
    useUserSession()
  const { isRegistered } = useSyncStatus()

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(profile.name)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  // New profile creation state
  const [showNewProfileModal, setShowNewProfileModal] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileAvatar, setNewProfileAvatar] = useState<AvatarEmoji>(AVATAR_OPTIONS[0])

  const handleNameSubmit = useCallback(() => {
    if (editedName.trim()) {
      updateProfile(profile.id, { name: editedName.trim() })
    }
    setIsEditingName(false)
  }, [editedName, profile.id, updateProfile])

  const handleAvatarSelect = useCallback(
    (avatar: AvatarEmoji) => {
      updateProfile(profile.id, { avatar })
      setShowAvatarPicker(false)
    },
    [profile.id, updateProfile]
  )

  const handleCopyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = profile.id
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }, [profile.id])

  const handleSwitchProfile = useCallback(
    (id: string) => {
      switchProfile(id)
      onClose()
    },
    [switchProfile, onClose]
  )

  const handleNewProfileClick = useCallback(() => {
    // Reset form and show modal
    setNewProfileName('')
    setNewProfileAvatar(AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)])
    setShowNewProfileModal(true)
  }, [])

  const handleCreateNewProfile = useCallback(() => {
    if (newProfileName.trim().length < 2) return
    createProfile(newProfileName.trim(), newProfileAvatar)
    setShowNewProfileModal(false)
    onClose()
  }, [createProfile, newProfileName, newProfileAvatar, onClose])

  const handleDelete = useCallback(() => {
    if (profiles.length > 1) {
      deleteProfile(profile.id)
      setShowDeleteConfirm(false)
    }
  }, [profiles.length, deleteProfile, profile.id])

  const otherProfiles = profiles.filter((p) => p.id !== profile.id)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil">
      <div className="space-y-6">
        {/* Current Profile Avatar */}
        <div className="flex flex-col items-center">
          {showAvatarPicker ? (
            <div className="w-full">
              <p className="text-sm text-gray-500 mb-3 text-center">
                Wähle einen Avatar
              </p>
              <AvatarPicker
                selected={profile.avatar}
                onSelect={handleAvatarSelect}
              />
              <Button
                variant="ghost"
                className="w-full mt-3"
                onClick={() => setShowAvatarPicker(false)}
              >
                Abbrechen
              </Button>
            </div>
          ) : (
            <motion.button
              onClick={() => setShowAvatarPicker(true)}
              className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl hover:bg-gray-200 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {profile.avatar}
            </motion.button>
          )}
        </div>

        {/* Name Field */}
        {!showAvatarPicker && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            {isEditingName ? (
              <div className="flex gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSubmit()
                    if (e.key === 'Escape') {
                      setEditedName(profile.name)
                      setIsEditingName(false)
                    }
                  }}
                  autoFocus
                  className="flex-1"
                />
                <Button onClick={handleNameSubmit} variant="primary" size="sm">
                  OK
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditedName(profile.name)
                  setIsEditingName(true)
                }}
                className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {profile.name}
              </button>
            )}
          </div>
        )}

        {/* User Code */}
        {!showAvatarPicker && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Code
              </label>
              <SyncStatus showLabel />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg font-mono text-gray-700">
                {profile.id}
              </div>
              <Button
                onClick={handleCopyId}
                variant="ghost"
                size="sm"
                className="px-3"
              >
                {copiedId ? (
                  <svg
                    className="w-5 h-5 text-success-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </Button>
            </div>
            {isRegistered && (
              <div className="mt-2">
                <ShareButton className="w-full" />
              </div>
            )}
          </div>
        )}

        {/* Profile Switcher */}
        {!showAvatarPicker && otherProfiles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile auf diesem Gerät
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Jedes Profil hat einen eigenen Code für Cloud-Sync und Login.
            </p>
            <div className="space-y-2">
              {/* Current profile */}
              <ProfileListItem profile={profile} isCurrent />
              {/* Other profiles */}
              {otherProfiles.map((p) => (
                <ProfileListItem
                  key={p.id}
                  profile={p}
                  onClick={() => handleSwitchProfile(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!showAvatarPicker && (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleNewProfileClick}
              variant="outline"
              className="flex-1"
            >
              + Neues Profil
            </Button>
          </div>
        )}

        {/* Bottom Actions */}
        {!showAvatarPicker && (
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Link href="/settings" className="flex-1" onClick={onClose}>
              <Button variant="ghost" className="w-full">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Einstellungen
              </Button>
            </Link>

            {profiles.length > 1 && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="ghost"
                      size="sm"
                    >
                      Nein
                    </Button>
                    <Button onClick={handleDelete} variant="danger" size="sm">
                      Ja, löschen
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="ghost"
                    className="text-error-600"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* New Profile Creation Modal */}
      {showNewProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Neues Profil erstellen
            </h3>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Was passiert mit deinen Daten?</p>
                  <p>
                    Dein aktuelles Profil und alle Vokabeln bleiben erhalten.
                    Das neue Profil startet komplett leer.
                  </p>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <Input
                label="Name für das neue Profil"
                placeholder="z.B. Lisa, Arbeit, Test..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                autoFocus
              />
              {newProfileName.length > 0 && newProfileName.trim().length < 2 && (
                <p className="text-sm text-error-500 mt-1">Mindestens 2 Zeichen</p>
              )}
            </div>

            {/* Avatar Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar
              </label>
              <div className="grid grid-cols-8 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setNewProfileAvatar(avatar)}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all',
                      newProfileAvatar === avatar
                        ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                        : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-lg mb-4">
              <span className="text-2xl">{newProfileAvatar}</span>
              <span className="font-medium text-gray-900">
                {newProfileName.trim() || 'Neues Profil'}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowNewProfileModal(false)}
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleCreateNewProfile}
                disabled={newProfileName.trim().length < 2}
              >
                Profil erstellen
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </Modal>
  )
}

// Profile list item component
interface ProfileListItemProps {
  profile: UserProfile
  isCurrent?: boolean
  onClick?: () => void
}

function ProfileListItem({ profile, isCurrent, onClick }: ProfileListItemProps) {
  // Format creation date
  const createdDate = new Date(profile.createdAt)
  const dateStr = createdDate.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: createdDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })

  return (
    <button
      onClick={onClick}
      disabled={isCurrent}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left',
        isCurrent
          ? 'bg-primary-50 border border-primary-200'
          : 'bg-gray-50 hover:bg-gray-100'
      )}
    >
      <span className="text-2xl">{profile.avatar}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{profile.name}</span>
          {isCurrent && (
            <svg
              className="w-4 h-4 text-primary-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono">{profile.id}</span>
          <span>·</span>
          <span>seit {dateStr}</span>
        </div>
      </div>
    </button>
  )
}
