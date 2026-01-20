'use client'

import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ScanPage() {
  const router = useRouter()

  return (
    <PageContainer>
      <Header title="Vokabeln scannen" showBack />

      <Card>
        <CardContent className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Foto-Import
          </h3>

          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Diese Funktion ermöglicht es dir, Vokabeln aus Fotos deines
            Schulbuchs automatisch zu erkennen und zu importieren.
          </p>

          <div className="bg-primary-50 rounded-xl p-4 mb-6 text-left">
            <h4 className="font-medium text-primary-700 mb-2">
              So funktioniert es:
            </h4>
            <ol className="text-sm text-primary-600 space-y-2 list-decimal list-inside">
              <li>Fotografiere eine Vokabelliste aus deinem Buch</li>
              <li>Die App erkennt die Wörter automatisch (OCR)</li>
              <li>Prüfe und bearbeite die erkannten Vokabeln</li>
              <li>Speichere sie in deinem gewählten Abschnitt</li>
            </ol>
          </div>

          <div className="bg-warning-50 rounded-xl p-4 text-left mb-6">
            <div className="flex items-start gap-3">
              <span className="text-warning-500 text-xl">🚧</span>
              <div>
                <h4 className="font-medium text-warning-700">In Entwicklung</h4>
                <p className="text-sm text-warning-600">
                  Diese Funktion wird in einem zukünftigen Update verfügbar sein.
                  Bis dahin kannst du Vokabeln manuell eingeben.
                </p>
              </div>
            </div>
          </div>

          <Button variant="primary" onClick={() => router.push('/add')}>
            Manuell eingeben
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
