'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone, Copy, Share2, Loader2, Check } from 'lucide-react'

interface ShareButtonProps {
  className?: string
}

export function ShareButton({ className }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transferData, setTransferData] = useState<{
    pin: string
    transferUrl: string
    expiresInMinutes: number
  } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleOpenModal() {
    setIsModalOpen(true)
    setIsLoading(true)
    setError(null)
    setTransferData(null)

    try {
      const response = await fetch('/api/auth/transfer/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen des Links')
      }

      setTransferData(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleShare() {
    if (!transferData) return

    const shareText = `Nutze diesen Link, um dich auf einem neuen Gerät anzumelden. Die PIN ist: ${transferData.pin}`

    // Try native share first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Vokabeltrainer - Geräteübertragung',
          text: shareText,
          url: transferData.transferUrl,
        })
        return
      } catch (error) {
        // User cancelled or share failed, fall back to clipboard
        if ((error as Error).name !== 'AbortError') {
          console.warn('Share failed:', error)
        }
      }
    }

    // Fallback to clipboard
    await copyToClipboard(transferData.transferUrl)
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleClose() {
    setIsModalOpen(false)
    setTransferData(null)
    setError(null)
    setCopied(false)
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="outline"
        size="sm"
        className={className}
      >
        <Smartphone className="w-4 h-4 mr-2" />
        Auf anderem Gerät nutzen
      </Button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Auf anderem Gerät nutzen</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Link wird erstellt...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <X className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={handleOpenModal} variant="outline">
                      Erneut versuchen
                    </Button>
                  </div>
                )}

                {transferData && !error && (
                  <div className="space-y-6">
                    {/* Step 1: Share Link */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                          1
                        </span>
                        <span className="font-medium">Link teilen</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-8">
                        Öffne diesen Link auf dem neuen Gerät:
                      </p>
                      <div className="ml-8 flex gap-2">
                        <Button
                          onClick={handleShare}
                          className="flex-1"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Kopiert!
                            </>
                          ) : (
                            <>
                              <Share2 className="w-4 h-4 mr-2" />
                              Link teilen
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => copyToClipboard(transferData.transferUrl)}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Step 2: PIN Display */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                          2
                        </span>
                        <span className="font-medium">PIN eingeben</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-8">
                        Gib diese PIN auf dem neuen Gerät ein:
                      </p>
                      <div className="ml-8 flex justify-center">
                        <div className="flex gap-2">
                          {transferData.pin.split('').map((digit, i) => (
                            <div
                              key={i}
                              className="w-14 h-16 border-2 border-primary rounded-xl flex items-center justify-center text-3xl font-bold text-primary"
                            >
                              {digit}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 ml-8">
                      <p className="text-sm text-amber-800">
                        <strong>Hinweis:</strong> Der Link ist {transferData.expiresInMinutes} Minuten gültig und kann nur einmal verwendet werden.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
