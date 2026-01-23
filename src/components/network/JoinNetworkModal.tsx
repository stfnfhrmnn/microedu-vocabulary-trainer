'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Loader2 } from 'lucide-react'
import type { Network, UserRole } from '@/lib/db/schema'

interface JoinNetworkModalProps {
  isOpen: boolean
  onClose: () => void
  onJoined: (network: Network) => void
}

export function JoinNetworkModal({ isOpen, onClose, onJoined }: JoinNetworkModalProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<UserRole>('child')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatInviteCode = (value: string) => {
    // Remove non-alphanumeric characters and uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    // Add dash after 4 characters
    if (cleaned.length > 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`
    }
    return cleaned
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInviteCode(e.target.value)
    setInviteCode(formatted)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (inviteCode.replace(/-/g, '').length !== 8) {
      setError('Bitte gib einen gültigen Code ein (XXXX-XXXX)')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/networks/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          inviteCode,
          role,
          nickname: nickname || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Beitreten')
      }

      onJoined(data.network)
      setInviteCode('')
      setNickname('')
      setRole('child')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Netzwerk beitreten</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Invite Code */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Einladungscode
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={handleCodeChange}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Ich bin...
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'child', label: 'Schüler', emoji: '🎒' },
                    { value: 'parent', label: 'Eltern', emoji: '👨‍👩‍👧' },
                    { value: 'teacher', label: 'Lehrer', emoji: '👨‍🏫' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value as UserRole)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        role === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{option.emoji}</span>
                      <span className="text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Spitzname (optional)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="So sehen dich andere"
                  maxLength={50}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Schützt deine Privatsphäre im Netzwerk
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || inviteCode.replace(/-/g, '').length !== 8}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Wird beigetreten...
                  </>
                ) : (
                  'Beitreten'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
