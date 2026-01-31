'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Copy, Check, ArrowLeft, Users, UserPlus } from 'lucide-react'
import type { Network, UserRole } from '@/lib/db/schema'
import { useSyncStatus } from '@/stores/sync'
import { CloudSyncRequired } from './CloudSyncRequired'

interface FamilySetupWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (network: Network | null) => void
}

type Step = 'role' | 'create' | 'join' | 'success'

export function FamilySetupWizard({ isOpen, onClose, onComplete }: FamilySetupWizardProps) {
  const { isRegistered } = useSyncStatus()
  const [step, setStep] = useState<Step>('role')
  const [userRole, setUserRole] = useState<'parent' | 'child' | null>(null)

  // Create form state
  const [familyName, setFamilyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdNetwork, setCreatedNetwork] = useState<Network | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  // Join form state
  const [inviteCode, setInviteCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const formatInviteCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleaned.length > 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`
    }
    return cleaned
  }

  const handleRoleSelect = (role: 'parent' | 'child') => {
    setUserRole(role)
    setStep(role === 'parent' ? 'create' : 'join')
  }

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) {
      setCreateError('Bitte gib einen Namen ein')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await fetch('/api/networks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
        },
        body: JSON.stringify({
          name: familyName.trim(),
          type: 'family',
          role: 'parent',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen')
      }

      setCreatedNetwork(data.network)
      setStep('success')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteCode.replace(/-/g, '').length !== 6) {
      setJoinError('Bitte gib einen gültigen Code ein (XXX-XXX)')
      return
    }

    setIsJoining(true)
    setJoinError(null)

    try {
      const response = await fetch('/api/networks/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
        },
        body: JSON.stringify({
          inviteCode,
          role: 'child' as UserRole,
          nickname: nickname || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Beitreten')
      }

      onComplete(data.network)
      handleReset()
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsJoining(false)
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
    onComplete(createdNetwork)
    handleReset()
  }

  const handleReset = () => {
    setStep('role')
    setUserRole(null)
    setFamilyName('')
    setCreatedNetwork(null)
    setInviteCode('')
    setNickname('')
    setCreateError(null)
    setJoinError(null)
  }

  const handleBack = () => {
    if (step === 'create' || step === 'join') {
      setStep('role')
      setUserRole(null)
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
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {(step === 'create' || step === 'join') && (
                  <button
                    onClick={handleBack}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mr-1"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <Users className="h-5 w-5 text-primary-500" />
                <h2 className="font-semibold text-gray-900">
                  {step === 'role' && 'Familie einrichten'}
                  {step === 'create' && 'Familie erstellen'}
                  {step === 'join' && 'Familie beitreten'}
                  {step === 'success' && 'Familie erstellt!'}
                </h2>
              </div>
              <button
                onClick={step === 'success' ? handleDone : onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* Cloud Sync Required */}
              {!isRegistered && (
                <motion.div
                  key="cloud-required"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CloudSyncRequired onClose={onClose} />
                </motion.div>
              )}

              {/* Step 1: Role Selection */}
              {isRegistered && step === 'role' && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 space-y-4"
                >
                  <p className="text-gray-600 text-center">
                    Wer bist du?
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleRoleSelect('parent')}
                      className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">👨‍👩‍👧</span>
                        <div>
                          <span className="font-semibold text-gray-900 block">Ich bin ein Elternteil</span>
                          <span className="text-sm text-gray-500">
                            Ich richte dies für mein Kind ein und möchte den Fortschritt sehen können.
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleRoleSelect('child')}
                      className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">🎒</span>
                        <div>
                          <span className="font-semibold text-gray-900 block">Ich bin das Kind</span>
                          <span className="text-sm text-gray-500">
                            Meine Eltern haben mir einen Einladungscode gegeben.
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2a: Create Family (Parent) */}
              {isRegistered && step === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4"
                >
                  <form onSubmit={handleCreateFamily} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Name der Familie
                      </label>
                      <input
                        type="text"
                        value={familyName}
                        onChange={(e) => {
                          setFamilyName(e.target.value)
                          setCreateError(null)
                        }}
                        placeholder="z.B. Familie Müller"
                        maxLength={100}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        autoFocus
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Was passiert dann?</strong><br />
                        Du erhältst einen Einladungscode, den du deinen Kindern geben kannst.
                        So könnt ihr euren Lernfortschritt gemeinsam sehen.
                      </p>
                    </div>

                    {createError && (
                      <div className="p-3 bg-error-50 text-error-600 text-sm rounded-lg">
                        {createError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isCreating || !familyName.trim()}
                      className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Wird erstellt...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5" />
                          Familie erstellen
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Step 2b: Join Family (Child) */}
              {isRegistered && step === 'join' && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4"
                >
                  <form onSubmit={handleJoinFamily} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Einladungscode von deinen Eltern
                      </label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => {
                          setInviteCode(formatInviteCode(e.target.value))
                          setJoinError(null)
                        }}
                        placeholder="XXX-XXX"
                        maxLength={7}
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Dein Spitzname (optional)
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="z.B. Max"
                        maxLength={50}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        So sehen dich andere in der Familie
                      </p>
                    </div>

                    {joinError && (
                      <div className="p-3 bg-error-50 text-error-600 text-sm rounded-lg">
                        {joinError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isJoining || inviteCode.replace(/-/g, '').length !== 8}
                      className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Wird beigetreten...
                        </>
                      ) : (
                        'Familie beitreten'
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Step 3: Success */}
              {isRegistered && step === 'success' && createdNetwork && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 space-y-4"
                >
                  <div className="text-center py-4">
                    <div className="text-5xl mb-3">🎉</div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {createdNetwork.name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Teile diesen Code mit deinen Kindern
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">Einladungscode</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-mono tracking-widest font-bold text-gray-900">
                          {createdNetwork.inviteCode}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {codeCopied ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <Copy className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Nächster Schritt:</strong><br />
                      Deine Kinder geben diesen Code im Vokabeltrainer ein unter:
                      <br />
                      <span className="font-mono text-xs">Profil → Einstellungen → Familie beitreten</span>
                    </p>
                  </div>

                  <button
                    onClick={handleDone}
                    className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                  >
                    Fertig
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
