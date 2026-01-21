'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { setAuthToken, fullSync } from '@/lib/sync/sync-service'
import { setRegistered } from '@/lib/sync/sync-queue'
import { useSyncStore } from '@/stores/sync'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setRegistered: setSyncRegistered } = useSyncStore()

  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Auto-fill code from URL parameter
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCode(formatCodeInput(urlCode))
    }
  }, [searchParams])

  const formatCodeInput = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (clean.length > 4) {
      return clean.slice(0, 4) + '-' + clean.slice(4, 8)
    }
    return clean
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode: code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Anmeldung fehlgeschlagen')
      }

      // Save token and mark as registered
      setAuthToken(data.token)
      await setRegistered(data.user.id, true)
      setSyncRegistered(true, data.user.id)

      // Pull all data from server
      setSuccess(true)
      const syncResult = await fullSync()

      if (!syncResult.success) {
        console.warn('Sync warning:', syncResult.error)
      }

      // Redirect to home after brief success message
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err) {
      setError((err as Error).message)
      setIsLoading(false)
    }
  }

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
            Willkommen zurück!
          </h1>
          <p className="text-gray-600">
            Deine Vokabeln werden geladen...
          </p>
        </div>
      </div>
    )
  }

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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mit Code anmelden
            </h1>
            <p className="text-gray-500 mt-2">
              Gib deinen Code ein, um auf deine Vokabeln zuzugreifen
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Dein Code
              </label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(formatCodeInput(e.target.value))}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="text-center text-2xl font-mono tracking-[0.2em] py-4"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>

            {error && (
              <div className="bg-error-50 text-error-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              disabled={code.length !== 9 || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                  Anmelden...
                </span>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-gray-500"
              onClick={() => router.push('/')}
            >
              Zurück zur Startseite
            </Button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Noch keinen Code? Erstelle auf der Startseite ein Profil und aktiviere
          die Cloud-Sicherung.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
