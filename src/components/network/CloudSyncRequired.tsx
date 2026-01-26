'use client'

import { Cloud, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CloudSyncRequiredProps {
  onClose?: () => void
}

export function CloudSyncRequired({ onClose }: CloudSyncRequiredProps) {
  const router = useRouter()

  const handleGoToSettings = () => {
    onClose?.()
    router.push('/settings')
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Cloud className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="font-semibold text-lg text-gray-900 mb-2">
          Cloud-Sync erforderlich
        </h3>
        <p className="text-gray-600 text-sm">
          Um mit anderen gemeinsam zu lernen, muss dein Profil mit der Cloud verbunden sein.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-900">Was passiert dabei?</p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Deine Daten werden sicher in der Cloud gespeichert</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Du bekommst einen persönlichen Code (findest du immer im Profil-Menü)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Du kannst Familien, Klassen oder Lerngruppen beitreten</span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-800">
          <strong>Hinweis:</strong> Ohne Cloud-Sync bleiben alle Daten lokal auf diesem Gerät.
          Du kannst die App auch komplett offline nutzen.
        </p>
      </div>

      <button
        onClick={handleGoToSettings}
        className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
      >
        Zu den Einstellungen
        <ArrowRight className="w-4 h-4" />
      </button>

      <button
        onClick={onClose}
        className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
      >
        Später
      </button>
    </div>
  )
}
