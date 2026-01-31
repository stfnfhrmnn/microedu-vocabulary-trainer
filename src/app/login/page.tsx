'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Smartphone, ArrowRight, Home } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // If there's a transfer token, redirect to transfer page
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      router.replace(`/transfer?token=${token}`)
    }
  }, [searchParams, router])

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

          <div className="space-y-4">
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
