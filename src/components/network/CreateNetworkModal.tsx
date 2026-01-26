'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, Copy, Check } from 'lucide-react'
import type { Network, NetworkType, UserRole } from '@/lib/db/schema'
import { useSyncStatus } from '@/stores/sync'
import { CloudSyncRequired } from './CloudSyncRequired'

interface CreateNetworkModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (network: Network) => void
}

export function CreateNetworkModal({ isOpen, onClose, onCreated }: CreateNetworkModalProps) {
  const { isRegistered } = useSyncStatus()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [name, setName] = useState('')
  const [type, setType] = useState<NetworkType>('class')
  const [role, setRole] = useState<UserRole>('teacher')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdNetwork, setCreatedNetwork] = useState<Network | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Bitte gib einen Namen ein')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/networks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen')
      }

      setCreatedNetwork(data.network)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (createdNetwork?.inviteCode) {
      await navigator.clipboard.writeText(createdNetwork.inviteCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const handleDone = () => {
    if (createdNetwork) {
      onCreated(createdNetwork)
    }
    // Reset state
    setStep('form')
    setName('')
    setType('class')
    setRole('teacher')
    setCreatedNetwork(null)
  }

  const networkTypes: Array<{ value: NetworkType; label: string; emoji: string; desc: string }> = [
    { value: 'class', label: 'Klasse', emoji: '🏫', desc: 'Für Schulklassen' },
    { value: 'study_group', label: 'Lerngruppe', emoji: '📚', desc: 'Für Lerngruppen' },
    { value: 'family', label: 'Familie', emoji: '👨‍👩‍👧‍👦', desc: 'Für Familien' },
  ]

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
                <Plus className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">
                  {step === 'form' ? 'Netzwerk erstellen' : 'Netzwerk erstellt!'}
                </h2>
              </div>
              <button
                onClick={step === 'success' ? handleDone : onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!isRegistered ? (
              <CloudSyncRequired onClose={onClose} />
            ) : step === 'form' ? (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Name des Netzwerks
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError(null)
                    }}
                    placeholder="z.B. Klasse 5b Französisch"
                    maxLength={100}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Art des Netzwerks
                  </label>
                  <div className="space-y-2">
                    {networkTypes.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setType(option.value)}
                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                          type === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div>
                          <span className="font-medium block">{option.label}</span>
                          <span className="text-sm text-muted-foreground">{option.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Meine Rolle
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value: 'teacher',
                        label: 'Lehrer/Admin',
                        emoji: '👨‍🏫',
                        description: 'Du verwaltest das Netzwerk und siehst alle Teilnehmer',
                      },
                      {
                        value: 'parent',
                        label: 'Elternteil',
                        emoji: '👨‍👩‍👧',
                        description: 'Du siehst den Fortschritt deiner Kinder',
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value as UserRole)}
                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-start gap-3 text-left ${
                          role === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div>
                          <span className="font-medium block">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
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
                  disabled={isLoading || !name.trim()}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Wird erstellt...
                    </>
                  ) : (
                    'Netzwerk erstellen'
                  )}
                </button>
              </form>
            ) : (
              <div className="p-4 space-y-4">
                {/* Success Message */}
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="font-semibold text-lg mb-1">{createdNetwork?.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    Teile den Einladungscode mit anderen
                  </p>
                </div>

                {/* Invite Code */}
                <div className="bg-secondary rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Einladungscode</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-mono tracking-widest font-bold">
                        {createdNetwork?.inviteCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-2 hover:bg-background rounded-lg transition-colors"
                      >
                        {codeCopied ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Andere können mit diesem Code beitreten
                </p>

                {/* Done Button */}
                <button
                  onClick={handleDone}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Fertig
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
