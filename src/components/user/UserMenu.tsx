'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AvatarPicker } from './AvatarPicker'
import {
  useUserSession,
  useCurrentProfile,
  type AvatarEmoji,
  type UserProfile,
} from '@/stores/user-session'
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

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(profile.name)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

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

  const handleNewProfile = useCallback(() => {
    createProfile()
    onClose()
  }, [createProfile, onClose])

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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code
            </label>
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
          </div>
        )}

        {/* Profile Switcher */}
        {!showAvatarPicker && otherProfiles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gespeicherte Profile
            </label>
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
              onClick={handleNewProfile}
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
  return (
    <button
      onClick={onClick}
      disabled={isCurrent}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        isCurrent
          ? 'bg-primary-50 border border-primary-200'
          : 'bg-gray-50 hover:bg-gray-100'
      )}
    >
      <span className="text-xl">{profile.avatar}</span>
      <span className="flex-1 text-left font-medium text-gray-900">
        {profile.name}
      </span>
      <span className="text-sm text-gray-500 font-mono">
        {formatUserIdShort(profile.id)}
      </span>
      {isCurrent && (
        <svg
          className="w-5 h-5 text-primary-500"
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
    </button>
  )
}
