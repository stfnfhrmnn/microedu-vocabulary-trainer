'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, BookOpen, Shield, Crown } from 'lucide-react'
import type { Network, UserRole } from '@/lib/db/schema'

interface NetworkMemberSummary {
  userId: string
  nickname: string
  avatar: string
  role: UserRole
  xp?: number
  rank?: number
}

interface NetworkOverviewProps {
  network: Network
  members: NetworkMemberSummary[]
  sharedBooksCount: number
  myRole?: UserRole
}

export function NetworkOverview({
  network,
  members,
  sharedBooksCount,
  myRole,
}: NetworkOverviewProps) {
  const competitors = members.filter((m) => m.role === 'child')
  const supporters = members.filter((m) => m.role !== 'child')

  // Sort competitors by XP for top 3
  const topThree = [...competitors]
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 3)

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

  return (
    <div className="relative">
      {/* Network Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-2 border-primary/20 rounded-2xl p-6 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Header */}
        <div className="relative text-center mb-6">
          <span className="text-4xl mb-2 block">{getTypeEmoji(network.type)}</span>
          <h2 className="text-xl font-bold">{network.name}</h2>
          <p className="text-sm text-muted-foreground">{getTypeLabel(network.type)}</p>

          {/* Invite Code Badge */}
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur rounded-full border">
            <span className="text-xs text-muted-foreground">Code:</span>
            <span className="font-mono font-bold tracking-wider">{network.inviteCode}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-background/60 rounded-xl">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <span className="text-2xl font-bold block">{competitors.length}</span>
            <span className="text-xs text-muted-foreground">Schüler</span>
          </div>
          <div className="text-center p-3 bg-background/60 rounded-xl">
            <Shield className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <span className="text-2xl font-bold block">{supporters.length}</span>
            <span className="text-xs text-muted-foreground">Unterstützer</span>
          </div>
          <div className="text-center p-3 bg-background/60 rounded-xl">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <span className="text-2xl font-bold block">{sharedBooksCount}</span>
            <span className="text-xs text-muted-foreground">Bücher</span>
          </div>
        </div>

        {/* Visual Network Diagram */}
        <div className="relative bg-background/40 rounded-xl p-4 min-h-[200px]">
          {/* Center - Network */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Top 3 Competitors */}
          {topThree.length > 0 && (
            <div className="absolute left-0 right-0 top-2 flex justify-center gap-4">
              {topThree.map((member, idx) => (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      idx === 0 ? 'bg-yellow-500/20 ring-2 ring-yellow-500' :
                      idx === 1 ? 'bg-gray-400/20 ring-2 ring-gray-400' :
                      'bg-amber-600/20 ring-2 ring-amber-600'
                    }`}>
                      {member.avatar}
                    </div>
                    {idx === 0 && (
                      <Crown className="absolute -top-2 -right-1 h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <span className="text-xs mt-1 truncate max-w-[60px]">{member.nickname}</span>
                  <span className="text-xs text-muted-foreground">{member.xp || 0} XP</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Connecting Lines (decorative) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            {topThree.map((_, idx) => {
              const angle = -90 + (idx - 1) * 45 // -135, -90, -45 degrees
              const rad = (angle * Math.PI) / 180
              const x1 = 50 + Math.cos(rad) * 15
              const y1 = 50 + Math.sin(rad) * 15
              const x2 = 50 + Math.cos(rad) * 35
              const y2 = 50 + Math.sin(rad) * 35
              return (
                <line
                  key={idx}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
              )
            })}
          </svg>

          {/* Supporters on sides */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {supporters.slice(0, 2).map((supporter, idx) => (
              <motion.div
                key={supporter.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm">
                  {supporter.role === 'teacher' ? '👨‍🏫' : '👨‍👩‍👧'}
                </div>
                <span className="text-xs hidden sm:block">{supporter.nickname}</span>
              </motion.div>
            ))}
          </div>

          {/* Remaining competitors indicator */}
          {competitors.length > 3 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <span className="text-xs text-muted-foreground">
                +{competitors.length - 3} weitere Schüler
              </span>
            </div>
          )}
        </div>

        {/* My Role Badge */}
        {myRole && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm">
              <span>Du bist</span>
              <span className="font-medium">
                {myRole === 'child' ? '🎒 Schüler' :
                 myRole === 'parent' ? '👨‍👩‍👧 Eltern' :
                 myRole === 'teacher' ? '👨‍🏫 Lehrer' :
                 '👑 Admin'}
              </span>
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
}
