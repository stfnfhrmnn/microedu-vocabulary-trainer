'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Settings, ChevronRight, Trophy, BookOpen } from 'lucide-react'
import { useNetworkStore } from '@/stores/network'
import { JoinNetworkModal } from './JoinNetworkModal'
import { CreateNetworkModal } from './CreateNetworkModal'
import type { Network, UserRole } from '@/lib/db/schema'

interface NetworkListProps {
  userId: string
  onSelectNetwork?: (networkId: string) => void
}

export function NetworkList({ userId, onSelectNetwork }: NetworkListProps) {
  const { networks, isLoading, setNetworks, setLoading, setError } = useNetworkStore()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    async function fetchNetworks() {
      setLoading(true)
      try {
        const response = await fetch('/api/networks', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch networks')
        }

        const data = await response.json()
        setNetworks(data.networks || [])
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    }

    fetchNetworks()
  }, [setNetworks, setLoading, setError])

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'child':
        return 'Schüler'
      case 'parent':
        return 'Eltern'
      case 'teacher':
        return 'Lehrer'
      case 'admin':
        return 'Admin'
      default:
        return role
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Meine Netzwerke
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            Beitreten
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Erstellen
          </button>
        </div>
      </div>

      {/* Network List */}
      {networks.length === 0 ? (
        <div className="text-center py-12 border rounded-xl border-dashed">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            Du bist noch in keinem Netzwerk
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              Mit Code beitreten
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
            >
              Netzwerk erstellen
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {networks.map((network, index) => (
              <motion.button
                key={network.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectNetwork?.(network.id)}
                className="w-full p-4 bg-card border rounded-xl hover:border-primary/50 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(network.type)}</span>
                    <div>
                      <h3 className="font-medium">{network.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getRoleLabel((network as Network & { myRole?: UserRole }).myRole || 'child')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <Trophy className="h-4 w-4" />
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <JoinNetworkModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={(network) => {
          setNetworks([...networks, network])
          setShowJoinModal(false)
        }}
      />

      <CreateNetworkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(network) => {
          setNetworks([...networks, network])
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}
