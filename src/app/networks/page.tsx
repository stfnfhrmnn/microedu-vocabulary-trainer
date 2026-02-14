'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Plus, ChevronRight, Loader2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { JoinNetworkModal } from '@/components/network/JoinNetworkModal'
import { CreateNetworkModal } from '@/components/network/CreateNetworkModal'
import { NetworkTypeGuide } from '@/components/network/NetworkTypeGuide'
import type { Network, UserRole } from '@/lib/db/schema'

interface NetworkWithRole extends Network {
  myRole?: UserRole
  memberCount?: number
}

type LoadErrorKind = 'auth' | 'offline' | 'server' | 'unknown'

const getTypeEmoji = (type: string) => {
  switch (type) {
    case 'class': return '🏫'
    case 'study_group': return '📚'
    case 'family': return '👨‍👩‍👧‍👦'
    default: return '👥'
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'class': return 'Klasse'
    case 'study_group': return 'Lerngruppe'
    case 'family': return 'Familie'
    default: return 'Netzwerk'
  }
}

const getRoleLabel = (role?: UserRole) => {
  switch (role) {
    case 'child': return '🎒 Schüler'
    case 'parent': return '👨‍👩‍👧 Eltern'
    case 'teacher': return '👨‍🏫 Lehrer'
    case 'admin': return '👑 Admin'
    default: return ''
  }
}

function NetworkCard({ network }: { network: NetworkWithRole }) {
  return (
    <Link href={`/networks/${network.id}`}>
      <Card interactive className="h-full">
        <CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">
            {getTypeEmoji(network.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{network.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{getTypeLabel(network.type)}</span>
              {network.myRole && (
                <>
                  <span>·</span>
                  <span>{getRoleLabel(network.myRole)}</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Code: {network.inviteCode}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}

export default function NetworksPage() {
  const router = useRouter()
  const [networks, setNetworks] = useState<NetworkWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<LoadErrorKind>('unknown')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchNetworks = async () => {
    let nextErrorKind: LoadErrorKind = 'unknown'
    try {
      setError(null)
      setErrorKind('unknown')

      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        nextErrorKind = 'offline'
        setErrorKind(nextErrorKind)
        throw new Error('Du bist offline. Netzwerke benötigen eine Internetverbindung.')
      }

      const token = localStorage.getItem('sync-auth-token')
      if (!token) {
        nextErrorKind = 'auth'
        setErrorKind(nextErrorKind)
        throw new Error('Bitte melde dich an, um Netzwerke zu laden.')
      }

      const response = await fetch('/api/networks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          nextErrorKind = 'auth'
          setErrorKind(nextErrorKind)
          throw new Error('Sitzung abgelaufen. Bitte melde dich erneut an.')
        }
        nextErrorKind = 'server'
        setErrorKind(nextErrorKind)
        throw new Error('Fehler beim Laden der Netzwerke')
      }

      const data = await response.json()
      setNetworks(data.networks || [])
    } catch (err) {
      if (nextErrorKind === 'unknown' && typeof window !== 'undefined' && !window.navigator.onLine) {
        nextErrorKind = 'offline'
        setErrorKind(nextErrorKind)
      }
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNetworks()
  }, [])

  const handleNetworkJoined = (network: Network) => {
    setShowJoinModal(false)
    fetchNetworks()
  }

  const handleNetworkCreated = (network: Network) => {
    setShowCreateModal(false)
    fetchNetworks()
  }

  return (
    <PageContainer>
      <Header
        title="Meine Netzwerke"
        showBack
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowJoinModal(true)}>
              Beitreten
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Neu
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-error-500 mb-4">{error}</p>
            {errorKind === 'offline' && (
              <p className="text-sm text-gray-500 mb-4">
                Sobald du wieder online bist, kannst du deine Netzwerke laden.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={fetchNetworks}>
                Erneut versuchen
              </Button>
              {errorKind === 'auth' && (
                <Button variant="outline" onClick={() => router.push('/login')}>
                  Zum Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : networks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Netzwerke</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Erstelle ein Netzwerk für deine Familie oder Klasse, oder tritt einem bestehenden bei.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setShowJoinModal(true)}>
                Beitreten
              </Button>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {networks.map((network, index) => (
            <motion.div
              key={network.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NetworkCard network={network} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Info Section */}
      <Card className="mt-6">
        <CardContent>
          <h4 className="font-medium text-gray-900 mb-2">Was sind Netzwerke?</h4>
          <p className="text-sm text-gray-500">
            Netzwerke verbinden dich mit anderen Lernenden. Du kannst Bücher teilen,
            Fortschritte vergleichen und gemeinsam lernen.
          </p>
          <NetworkTypeGuide className="mt-4" />
        </CardContent>
      </Card>

      {/* Modals */}
      <JoinNetworkModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={handleNetworkJoined}
      />

      <CreateNetworkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleNetworkCreated}
      />
    </PageContainer>
  )
}
