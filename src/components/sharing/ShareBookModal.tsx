'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, Users, Loader2, Check } from 'lucide-react'
import type { Network, Book } from '@/lib/db/schema'

interface ShareBookModalProps {
  isOpen: boolean
  onClose: () => void
  book: Book | null
  onShared?: (networkId: string) => void
}

export function ShareBookModal({ isOpen, onClose, book, onShared }: ShareBookModalProps) {
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sharingNetworkId, setSharingNetworkId] = useState<string | null>(null)
  const [sharedNetworks, setSharedNetworks] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    async function fetchNetworks() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/networks', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch networks')
        }

        const data = await response.json()
        setNetworks(data.networks || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNetworks()
  }, [isOpen])

  const handleShare = async (networkId: string) => {
    if (!book) return

    setSharingNetworkId(networkId)
    setError(null)

    try {
      const response = await fetch('/api/shared-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          bookId: book.id,
          networkId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Teilen')
      }

      setSharedNetworks((prev) => new Set([...prev, networkId]))
      onShared?.(networkId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setSharingNetworkId(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class':
        return '🏫'
      case 'study_group':
        return '📚'
      case 'family':
        return '👨‍👩‍👧‍👦'
      default:
        return '👥'
    }
  }

  const getLanguageEmoji = (language: string) => {
    switch (language) {
      case 'french':
        return '🇫🇷'
      case 'spanish':
        return '🇪🇸'
      case 'latin':
        return '🏛️'
      default:
        return '📚'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
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
                <Share2 className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Buch teilen</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Book Preview */}
            {book && (
              <div className="p-4 bg-secondary/30 border-b flex items-center gap-3">
                <div
                  className="w-12 h-16 rounded-lg flex items-center justify-center text-xl shadow-inner"
                  style={{ backgroundColor: book.coverColor }}
                >
                  {getLanguageEmoji(book.language)}
                </div>
                <div>
                  <h3 className="font-medium">{book.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Andere können dieses Buch kopieren
                  </p>
                </div>
              </div>
            )}

            {/* Network List */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Wähle ein Netzwerk
              </h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : networks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Du bist in keinem Netzwerk</p>
                  <p className="text-sm">Tritt einem Netzwerk bei, um Bücher zu teilen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {networks.map((network) => {
                    const isShared = sharedNetworks.has(network.id)
                    const isSharing = sharingNetworkId === network.id

                    return (
                      <button
                        key={network.id}
                        onClick={() => !isShared && handleShare(network.id)}
                        disabled={isSharing || isShared}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                          isShared
                            ? 'bg-green-500/10 border border-green-500/30'
                            : 'bg-card border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl">{getTypeIcon(network.type)}</span>
                        <div className="flex-1 text-left">
                          <span className="font-medium block">{network.name}</span>
                        </div>
                        {isSharing ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : isShared ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Share2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-secondary/30">
              <p className="text-xs text-muted-foreground text-center">
                Geteilte Bücher können von Netzwerkmitgliedern kopiert werden.
                Deine Originaldaten bleiben unverändert.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
