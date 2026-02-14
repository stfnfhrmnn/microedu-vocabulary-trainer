'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NetworkOverview } from '@/components/network/NetworkOverview'
import type { Network, UserRole } from '@/lib/db/schema'

interface NetworkMemberSummary {
  userId: string
  nickname: string
  avatar: string
  role: UserRole
  xp?: number
  rank?: number
}

interface NetworkDetail extends Network {
  myRole?: UserRole
  members: NetworkMemberSummary[]
  sharedBooksCount: number
}

type LoadErrorKind = 'auth' | 'forbidden' | 'notFound' | 'offline' | 'server' | 'unknown'

export default function NetworkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const networkParam = params.id
  const networkId = Array.isArray(networkParam) ? networkParam[0] : networkParam

  const [network, setNetwork] = useState<NetworkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<LoadErrorKind>('unknown')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateOnlineState = () => {
      setIsOffline(!window.navigator.onLine)
    }

    updateOnlineState()
    window.addEventListener('online', updateOnlineState)
    window.addEventListener('offline', updateOnlineState)

    return () => {
      window.removeEventListener('online', updateOnlineState)
      window.removeEventListener('offline', updateOnlineState)
    }
  }, [])

  const fetchNetwork = useCallback(async () => {
    if (!networkId) return

    setIsLoading(true)
    setError(null)
    setErrorKind('unknown')
    let nextErrorKind: LoadErrorKind = 'unknown'

    try {
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        nextErrorKind = 'offline'
        setErrorKind(nextErrorKind)
        throw new Error('Du bist offline. Bitte prüfe deine Internetverbindung.')
      }

      const token = localStorage.getItem('sync-auth-token')
      if (!token) {
        nextErrorKind = 'auth'
        setErrorKind(nextErrorKind)
        throw new Error('Bitte melde dich an')
      }

      const response = await fetch(`/api/networks/${encodeURIComponent(networkId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        let apiError: string | undefined
        try {
          const data = await response.json()
          apiError = typeof data?.error === 'string' ? data.error : undefined
        } catch {
          // Ignore JSON parsing errors for non-JSON API responses
        }

        if (response.status === 401) {
          nextErrorKind = 'auth'
          setErrorKind(nextErrorKind)
          throw new Error(apiError || 'Bitte melde dich erneut an')
        }

        if (response.status === 403) {
          nextErrorKind = 'forbidden'
          setErrorKind(nextErrorKind)
          throw new Error(apiError || 'Du bist kein Mitglied dieses Netzwerks')
        }

        if (response.status === 404) {
          nextErrorKind = 'notFound'
          setErrorKind(nextErrorKind)
          throw new Error(apiError || 'Netzwerk nicht gefunden')
        }

        nextErrorKind = 'server'
        setErrorKind(nextErrorKind)
        throw new Error(apiError || 'Fehler beim Laden')
      }

      const data = await response.json()
      setNetwork({
        ...data.network,
        members: data.network?.members ?? [],
        sharedBooksCount: data.network?.sharedBooksCount ?? 0,
      })
      setError(null)
    } catch (err) {
      if (nextErrorKind === 'unknown' && typeof window !== 'undefined' && !window.navigator.onLine) {
        nextErrorKind = 'offline'
        setErrorKind(nextErrorKind)
      }
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }, [networkId])

  useEffect(() => {
    fetchNetwork()
  }, [fetchNetwork, refreshKey])

  const handleRetry = () => {
    setRefreshKey((value) => value + 1)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Header title="Laden..." showBack />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </PageContainer>
    )
  }

  if (error || !network) {
    return (
      <PageContainer>
        <Header title="Fehler" showBack />
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-error-500 mb-4">{error || 'Netzwerk nicht gefunden'}</p>
            {(isOffline || errorKind === 'offline') && (
              <p className="text-sm text-gray-500 mb-4">
                Offline-Modus: Netzwerkdetails benötigen eine Verbindung.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={handleRetry}>
                Erneut versuchen
              </Button>
              {errorKind === 'auth' && (
                <Button variant="outline" onClick={() => router.push('/login')}>
                  Zum Login
                </Button>
              )}
              <Button variant="ghost" onClick={() => router.push('/networks')}>
                Zurück zur Übersicht
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Header title={network.name} showBack />

      <NetworkOverview
        network={network}
        members={network.members}
        sharedBooksCount={network.sharedBooksCount}
        myRole={network.myRole}
      />

      {/* Actions */}
      <Card className="mt-6">
        <CardContent className="space-y-3">
          <Button variant="secondary" fullWidth>
            Mitglieder verwalten
          </Button>
          <Button variant="secondary" fullWidth>
            Bücher teilen
          </Button>
          <Button variant="secondary" fullWidth>
            Rangliste anzeigen
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
