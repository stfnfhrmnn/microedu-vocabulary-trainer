'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Settings, Copy, Check, RefreshCw, Trophy, Users, BookOpen, Share2 } from 'lucide-react'
import { Leaderboard } from '@/components/competition/Leaderboard'
import { SharedBooksGallery } from '@/components/sharing/SharedBooksGallery'
import { MemberList } from './MemberList'
import { CodeFormatHint } from './CodeFormatHint'
import type { Network, UserRole } from '@/lib/db/schema'

type TabType = 'leaderboard' | 'members' | 'books'

interface NetworkDetailProps {
  networkId: string
  currentUserId: string
  onBack: () => void
}

interface NetworkWithDetails extends Network {
  memberCount: number
  myRole?: UserRole
  myNickname?: string
}

interface Member {
  id: string
  userId: string
  role: UserRole
  nickname: string
  avatar: string
  visibility: string
  joinedAt: string
  isMe: boolean
}

export function NetworkDetail({ networkId, currentUserId, onBack }: NetworkDetailProps) {
  const [network, setNetwork] = useState<NetworkWithDetails | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard')
  const [isLoading, setIsLoading] = useState(true)
  const [codeCopied, setCodeCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    async function fetchNetwork() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/networks/${networkId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setNetwork(data.network)
        }
      } catch (error) {
        console.error('Error fetching network:', error)
      } finally {
        setIsLoading(false)
      }
    }

    async function fetchMembers() {
      try {
        const response = await fetch(`/api/networks/${networkId}/members`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error('Error fetching members:', error)
      }
    }

    fetchNetwork()
    fetchMembers()
  }, [networkId])

  const handleCopyCode = async () => {
    if (network?.inviteCode) {
      await navigator.clipboard.writeText(network.inviteCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const handleRegenerateCode = async () => {
    try {
      const response = await fetch(`/api/networks/${networkId}/regenerate-code`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setNetwork((prev) => prev ? { ...prev, inviteCode: data.inviteCode } : null)
      }
    } catch (error) {
      console.error('Error regenerating code:', error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    try {
      const response = await fetch(`/api/networks/${networkId}/members/${member.userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
        },
      })
      if (response.ok) {
        if (member.isMe) {
          onBack()
        } else {
          setMembers((prev) => prev.filter((m) => m.id !== memberId))
        }
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const handleUpdateMember = async (memberId: string, updates: Partial<Member>) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    try {
      const response = await fetch(`/api/networks/${networkId}/members/${member.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sync-auth-token')}`,
        },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, ...updates } : m))
        )
      }
    } catch (error) {
      console.error('Error updating member:', error)
    }
  }

  const isAdmin = network?.myRole === 'admin' || network?.myRole === 'teacher'

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'leaderboard', label: 'Rangliste', icon: <Trophy className="h-4 w-4" /> },
    { id: 'members', label: 'Mitglieder', icon: <Users className="h-4 w-4" /> },
    { id: 'books', label: 'Bücher', icon: <BookOpen className="h-4 w-4" /> },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!network) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Netzwerk nicht gefunden</p>
        <button onClick={onBack} className="mt-4 text-primary">
          Zurück
        </button>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class': return '🏫'
      case 'study_group': return '📚'
      case 'family': return '👨‍👩‍👧‍👦'
      default: return '👥'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTypeIcon(network.type)}</span>
            <h1 className="text-xl font-bold">{network.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {network.memberCount} Mitglieder
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Invite Code Section */}
      <div className="bg-secondary/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Einladungscode</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono font-bold tracking-wider">
                {network.inviteCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              >
                {codeCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              {isAdmin && (
                <button
                  onClick={handleRegenerateCode}
                  className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                  title="Neuen Code generieren"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${network.name} beitreten`,
                  text: `Tritt ${network.name} bei! Einladungscode: ${network.inviteCode}`,
                })
              } else {
                handleCopyCode()
              }
            }}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        <CodeFormatHint context="network" className="mt-2" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-background shadow-sm'
                : 'hover:bg-secondary'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'leaderboard' && (
          <Leaderboard networkId={networkId} currentUserId={currentUserId} />
        )}
        {activeTab === 'members' && (
          <MemberList
            members={members}
            isAdmin={isAdmin}
            onRemoveMember={handleRemoveMember}
            onUpdateMember={handleUpdateMember}
          />
        )}
        {activeTab === 'books' && (
          <SharedBooksGallery networkId={networkId} />
        )}
      </motion.div>
    </div>
  )
}
