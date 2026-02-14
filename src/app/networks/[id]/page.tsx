'use client'

import { useState, useEffect } from 'react'
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

export default function NetworkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const networkParam = params.id
  const networkId = Array.isArray(networkParam) ? networkParam[0] : networkParam

  const [network, setNetwork] = useState<NetworkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!networkId) return

    const fetchNetwork = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('sync-auth-token')
        if (!token) {
          setError('Bitte melde dich an')
          setIsLoading(false)
          return
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
            throw new Error('Bitte melde dich erneut an')
          }

          if (response.status === 403) {
            throw new Error(apiError || 'Du bist kein Mitglied dieses Netzwerks')
          }

          if (response.status === 404) {
            throw new Error(apiError || 'Netzwerk nicht gefunden')
          }

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
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNetwork()
  }, [networkId])

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
            <Button variant="secondary" onClick={() => router.push('/networks')}>
              Zurück zur Übersicht
            </Button>
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
