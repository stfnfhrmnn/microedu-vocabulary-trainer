'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, Copy, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSyncStatus } from '@/stores/sync'
import { useCurrentProfile } from '@/stores/user-session'

interface CodeAwarenessPromptProps {
  onDismiss?: () => void
}

export function CodeAwarenessPrompt({ onDismiss }: CodeAwarenessPromptProps) {
  const { shouldShowCodePrompt, setHasSeenCodePrompt } = useSyncStatus()
  const profile = useCurrentProfile()
  const [copiedId, setCopiedId] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  const handleCopyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = profile.id
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }, [profile.id])

  const handleDismiss = () => {
    setHasSeenCodePrompt(true)
    setIsOpen(false)
    onDismiss?.()
  }

  if (!shouldShowCodePrompt || !isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-blue-50">
            <div className="flex items-center gap-2 text-blue-800">
              <Info className="w-5 h-5" />
              <h2 className="font-semibold">Dein persönlicher Code</h2>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-blue-700" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Code Display */}
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-2">Dein Code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-widest text-gray-900">
                  {profile.id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiedId ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Wofür ist dieser Code?
              </p>
              <p className="text-sm text-blue-700">
                Mit diesem Code kannst du dich auf anderen Geräten anmelden oder die App neu installieren
                und behältst trotzdem alle Daten.
              </p>
            </div>

            {/* Where to find it */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-900 font-medium mb-2">
                Keine Sorge - du findest ihn immer wieder!
              </p>
              <p className="text-sm text-gray-600">
                Dein Code ist jederzeit im <strong>Profil-Menü</strong> sichtbar (oben rechts auf dein Profil tippen).
                Du musst ihn nicht jetzt aufschreiben.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button variant="primary" fullWidth onClick={handleCopyId}>
                {copiedId ? 'Kopiert!' : 'Code kopieren'}
              </Button>
              <Button variant="ghost" fullWidth onClick={handleDismiss}>
                Verstanden
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
