'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCurrentProfile } from '@/stores/user-session'
import { useSyncStore } from '@/stores/sync'
import { setAuthToken, fullSync } from '@/lib/sync/sync-service'
import { setRegistered, isUserRegistered } from '@/lib/sync/sync-queue'
import { db } from '@/lib/db/db'

type MigrationStep = 'prompt' | 'registering' | 'login' | 'logging-in' | 'success' | 'error'

export function MigrationPrompt() {
  const profile = useCurrentProfile()
  const setSyncRegistered = useSyncStore((s) => s.setRegistered)
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<MigrationStep>('prompt')
  const [loginCode, setLoginCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [newUserCode, setNewUserCode] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // Check if we should show the migration prompt
  useEffect(() => {
    async function checkMigration() {
      // Don't show if already dismissed
      if (dismissed || localStorage.getItem('migration-dismissed') === 'true') {
        return
      }

      // Check if already registered
      const registered = await isUserRegistered()
      if (registered) return

      // Check if there's local data worth backing up
      const bookCount = await db.books.count()
      const vocabCount = await db.vocabularyItems.count()

      if (bookCount > 0 || vocabCount > 0) {
        // Has data, show prompt after a short delay
        setTimeout(() => setIsOpen(true), 2000)
      }
    }

    checkMigration()
  }, [dismissed])

  const handleDismiss = () => {
    setIsOpen(false)
    setDismissed(true)
    localStorage.setItem('migration-dismissed', 'true')
  }

  const handleRegister = async () => {
    setStep('registering')
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          avatar: profile.avatar,
          existingUserCode: profile.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Save token and mark as registered
      setAuthToken(data.token)
      await setRegistered(data.user.id, true)
      setSyncRegistered(true, data.user.id)
      setNewUserCode(data.user.userCode)
      setStep('success')
    } catch (err) {
      setError((err as Error).message)
      setStep('error')
    }
  }

  const handleLogin = async () => {
    setStep('logging-in')
    setError(null)

    // Format code to uppercase
    const formattedCode = loginCode.toUpperCase().trim()

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode: formattedCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Save token and mark as registered
      setAuthToken(data.token)
      await setRegistered(data.user.id, true)
      setSyncRegistered(true, data.user.id)

      // Pull all data from server
      const syncResult = await fullSync()
      if (!syncResult.success) {
        console.warn('Full sync warning:', syncResult.error)
      }

      setNewUserCode(data.user.userCode)
      setStep('success')
    } catch (err) {
      setError((err as Error).message)
      setStep('error')
    }
  }

  const formatCodeInput = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    // Insert hyphen after 4 characters
    if (clean.length > 4) {
      return clean.slice(0, 4) + '-' + clean.slice(4, 8)
    }
    return clean
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title={
        step === 'success'
          ? 'Erfolgreich!'
          : step === 'login'
            ? 'Mit Code anmelden'
            : 'Vokabeln sichern?'
      }
    >
      {step === 'prompt' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Möchtest du deine Vokabeln in der Cloud speichern? So kannst du sie
            auf anderen Geräten nutzen und nie verlieren.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRegister} variant="primary" className="w-full">
              Ja, sichern
            </Button>
            <Button
              onClick={() => setStep('login')}
              variant="outline"
              className="w-full"
            >
              Ich habe bereits einen Code
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="w-full text-gray-500"
            >
              Später
            </Button>
          </div>
        </div>
      )}

      {step === 'registering' && (
        <div className="flex flex-col items-center py-8">
          <svg
            className="w-8 h-8 animate-spin text-primary-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-gray-600">Erstelle dein Cloud-Konto...</p>
        </div>
      )}

      {step === 'login' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Gib deinen Code ein, um deine Vokabeln von einem anderen Gerät zu laden.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code
            </label>
            <Input
              value={loginCode}
              onChange={(e) => setLoginCode(formatCodeInput(e.target.value))}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className="font-mono text-center text-lg tracking-wider"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setStep('prompt')}
              variant="ghost"
              className="flex-1"
            >
              Zurück
            </Button>
            <Button
              onClick={handleLogin}
              variant="primary"
              className="flex-1"
              disabled={loginCode.length !== 9}
            >
              Anmelden
            </Button>
          </div>
        </div>
      )}

      {step === 'logging-in' && (
        <div className="flex flex-col items-center py-8">
          <svg
            className="w-8 h-8 animate-spin text-primary-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-gray-600">Lade deine Vokabeln...</p>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-success-500"
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
          </div>
          <div>
            <p className="text-gray-600 mb-2">Dein Code zum Teilen:</p>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {newUserCode}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Speichere diesen Code, um deine Vokabeln auf anderen Geräten zu öffnen.
          </p>
          <Button onClick={() => setIsOpen(false)} variant="primary" className="w-full">
            Fertig
          </Button>
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-4">
          <div className="bg-error-50 text-error-700 p-3 rounded-lg">
            {error || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setStep('prompt')}
              variant="ghost"
              className="flex-1"
            >
              Zurück
            </Button>
            <Button
              onClick={handleRegister}
              variant="primary"
              className="flex-1"
            >
              Erneut versuchen
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
