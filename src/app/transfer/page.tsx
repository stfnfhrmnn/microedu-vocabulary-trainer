'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { setAuthToken, fullSync } from '@/lib/sync/sync-service'
import { setRegistered } from '@/lib/sync/sync-queue'
import { useSyncStore } from '@/stores/sync'
import { useUserSession } from '@/stores/user-session'
import { useOnboarding } from '@/stores/onboarding'

function TransferForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setRegistered: setSyncRegistered } = useSyncStore()
  const { upsertProfile } = useUserSession()
  const { completeOnboarding } = useOnboarding()

  const [pin, setPin] = useState(['', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const token = searchParams.get('token')

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handlePinChange = (index: number, value: string) => {
    // Only accept digits
    const digit = value.replace(/\D/g, '').slice(-1)

    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)
    setError(null)

    // Auto-advance to next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (digit && index === 3) {
      const fullPin = newPin.join('')
      if (fullPin.length === 4) {
        handleSubmit(fullPin)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData.length === 4) {
      const newPin = pastedData.split('')
      setPin(newPin)
      handleSubmit(pastedData)
    }
  }

  const handleSubmit = async (pinCode: string) => {
    if (!token || pinCode.length !== 4) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/transfer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin: pinCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Übertragung fehlgeschlagen')
      }

      // Save token and mark as registered
      setAuthToken(data.token)
      await setRegistered(data.user.id, true)
      setSyncRegistered(true, data.user.id)
      upsertProfile({
        id: data.user.userCode,
        name: data.user.name,
        avatar: data.user.avatar,
      })
      completeOnboarding()

      // Full sync from server
      setSuccess(true)
      const syncResult = await fullSync()

      if (!syncResult.success) {
        console.warn('Sync warning:', syncResult.error)
      }

      // Redirect to home
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err) {
      setError((err as Error).message)
      setIsLoading(false)
      // Reset PIN on error
      setPin(['', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  // No token - show error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ungültiger Link
          </h1>
          <p className="text-gray-600 mb-6">
            Dieser Übertragungslink ist ungültig. Bitte fordere einen neuen Link an.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-success-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-success-500"
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Übertragung erfolgreich!
          </h1>
          <p className="text-gray-600">
            Deine Vokabeln werden geladen...
          </p>
        </div>
      </div>
    )
  }

  // PIN entry form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gerät übertragen
            </h1>
            <p className="text-gray-500 mt-2">
              Gib die 4-stellige PIN ein, die auf deinem anderen Gerät angezeigt wird
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-14 h-16 text-center text-3xl font-bold border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center mb-4">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <svg
                className="animate-spin h-5 w-5"
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
              <span>Wird übertragen...</span>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Die PIN findest du in der App auf deinem ursprünglichen Gerät unter
          &quot;Auf anderem Gerät nutzen&quot;.
        </p>
      </div>
    </div>
  )
}

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <TransferForm />
    </Suspense>
  )
}
