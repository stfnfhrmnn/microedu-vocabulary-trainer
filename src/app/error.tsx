'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-20 h-20 mb-6 rounded-full bg-error-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-error-500"
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Etwas ist schiefgelaufen
      </h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut oder lade die Seite neu.
      </p>
      <div className="flex gap-3">
        <Button variant="primary" onClick={reset}>
          Erneut versuchen
        </Button>
        <Button variant="secondary" onClick={() => window.location.href = '/'}>
          Zur Startseite
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 w-full max-w-lg text-left">
          <summary className="text-sm text-gray-500 cursor-pointer">
            Technische Details
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
    </div>
  )
}
