'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CodeFormatHint } from '@/components/network/CodeFormatHint'
import { Smartphone, Home, KeyRound, Loader2 } from 'lucide-react'
import { setAuthToken, fullSync } from '@/lib/sync/sync-service'
import { setRegistered } from '@/lib/sync/sync-queue'
import { useSyncStore } from '@/stores/sync'
import { useUserSession } from '@/stores/user-session'
import { useOnboarding } from '@/stores/onboarding'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setRegistered: setSyncRegistered } = useSyncStore()
  const { upsertProfile } = useUserSession()
  const { completeOnboarding } = useOnboarding()

  const [loginCode, setLoginCode] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // If there's a transfer token, redirect to transfer page
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      router.replace(`/transfer?token=${token}`)
    }
  }, [searchParams, router])

  const formatCodeInput = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (clean.length > 4) {
      return clean.slice(0, 4) + '-' + clean.slice(4, 8)
    }
    return clean
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError(null)

    const formattedCode = loginCode.toUpperCase().trim()

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode: formattedCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Anmeldung fehlgeschlagen')
      }

      setAuthToken(data.token)
      await setRegistered(data.user.id, true)
      setSyncRegistered(true, data.user.id)

      upsertProfile({
        id: data.user.userCode,
        name: data.user.name,
        avatar: data.user.avatar,
      })
      completeOnboarding()

      const syncResult = await fullSync()
      if (!syncResult.success) {
        console.warn('Full sync warning:', syncResult.error)
      }

      router.push('/')
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen')
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Auf einem neuen Gerät?
            </h1>
            <p className="text-gray-500 mt-2">
              Um deine Vokabeln auf diesem Gerät zu nutzen, verwende die Übertragungsfunktion.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-medium text-blue-900 mb-2">So funktioniert&apos;s:</h3>
              <ol className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-900 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Öffne die App auf deinem ursprünglichen Gerät</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-900 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Gehe zu Einstellungen &rarr; &quot;Auf anderem Gerät nutzen&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-900 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Teile den Link und gib die PIN auf diesem Gerät ein</span>
                </li>
              </ol>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                variant="primary"
                className="w-full py-3 flex items-center justify-center gap-2"
                onClick={() => router.push('/')}
              >
                <Home className="w-4 h-4" />
                Zur Startseite
              </Button>

              <p className="text-center text-xs text-gray-500">
                Noch keinen Account? Auf der Startseite kannst du ein neues Profil erstellen.
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <KeyRound className="w-4 h-4 text-gray-500" />
                Mit Code anmelden
              </div>
              <form onSubmit={handleLogin} className="space-y-3">
                <Input
                  value={loginCode}
                  onChange={(e) => {
                    setLoginCode(formatCodeInput(e.target.value))
                    setLoginError(null)
                  }}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="font-mono text-center text-lg tracking-wider"
                  autoComplete="one-time-code"
                />
                {loginError && (
                  <div className="bg-red-50 text-red-700 p-2 rounded-lg text-xs text-center">
                    {loginError}
                  </div>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full py-3 flex items-center justify-center gap-2"
                  disabled={isLoggingIn || loginCode.length !== 9}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Anmeldung läuft...
                    </>
                  ) : (
                    'Daten laden'
                  )}
                </Button>
              </form>
              <div className="space-y-1 mt-2">
                <p className="text-xs text-gray-500">
                  Nutze deinen persönlichen Code, wenn du keinen Übertragungslink hast.
                </p>
                <CodeFormatHint context="account" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
