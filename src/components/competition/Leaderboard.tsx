'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Flame, Target, TrendingUp, ChevronDown } from 'lucide-react'
import { useCompetitionStore } from '@/stores/competition'
import type { LeaderboardEntry, PeriodType } from '@/lib/db/schema'

interface LeaderboardProps {
  networkId: string
  currentUserId: string
}

export function Leaderboard({ networkId, currentUserId }: LeaderboardProps) {
  const { currentPeriod, setCurrentPeriod, setLeaderboard, getLeaderboard, isLoading, setLoading } = useCompetitionStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [supporters, setSupporters] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)

  const periods: Array<{ value: PeriodType; label: string }> = [
    { value: 'daily', label: 'Heute' },
    { value: 'weekly', label: 'Diese Woche' },
    { value: 'monthly', label: 'Diesen Monat' },
    { value: 'all_time', label: 'Gesamt' },
  ]

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/networks/${networkId}/leaderboard?period=${currentPeriod}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard')
        }

        const data = await response.json()
        setEntries(data.competitors || [])
        setSupporters(data.supporters || [])
        setMyRank(data.myRank)
        setLeaderboard(networkId, data.leaderboard, currentPeriod)
      } catch (error) {
        console.error('Leaderboard error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [networkId, currentPeriod, setLeaderboard, setLoading])

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: <Trophy className="h-6 w-6" />, color: 'text-yellow-500', bg: 'bg-yellow-500/20' }
    if (rank === 2) return { icon: <Medal className="h-6 w-6" />, color: 'text-gray-400', bg: 'bg-gray-400/20' }
    if (rank === 3) return { icon: <Medal className="h-6 w-6" />, color: 'text-amber-600', bg: 'bg-amber-600/20' }
    return { icon: <span className="text-lg font-bold">{rank}</span>, color: 'text-muted-foreground', bg: 'bg-secondary' }
  }

  return (
    <div className="space-y-4">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Rangliste
        </h2>
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-1"
          >
            {periods.find((p) => p.value === currentPeriod)?.label}
            <ChevronDown className={`h-4 w-4 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showPeriodDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-1 w-40 bg-background border rounded-lg shadow-lg z-10 overflow-hidden"
              >
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => {
                      setCurrentPeriod(period.value)
                      setShowPeriodDropdown(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors ${
                      currentPeriod === period.value ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* My Rank Banner (if not in top 3) */}
      {myRank && myRank > 3 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">#{myRank}</span>
            <span className="text-sm">Dein Platz</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {entries.find((e) => e.userId === currentUserId)?.xpEarned || 0} XP
          </span>
        </div>
      )}

      {/* Competitors List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 border rounded-xl border-dashed">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Noch keine Aktivität in diesem Zeitraum
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const rankDisplay = getRankDisplay(entry.rank)
            const isMe = entry.userId === currentUserId

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-xl flex items-center gap-3 ${
                  isMe ? 'bg-primary/10 border border-primary/30' : 'bg-card border'
                }`}
              >
                {/* Rank */}
                <div className={`w-10 h-10 rounded-full ${rankDisplay.bg} ${rankDisplay.color} flex items-center justify-center`}>
                  {rankDisplay.icon}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {entry.nickname}
                      {isMe && <span className="text-primary ml-1">(Du)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {entry.accuracyPercentage.toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {entry.streakDays}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {entry.wordsMastered}
                    </span>
                  </div>
                </div>

                {/* XP */}
                <div className="text-right">
                  <span className="font-bold text-lg">{entry.xpEarned}</span>
                  <span className="text-xs text-muted-foreground ml-1">XP</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Supporters Section */}
      {supporters.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            Unterstützer (nicht gerankt)
          </h3>
          <div className="space-y-2">
            {supporters.map((supporter) => (
              <div
                key={supporter.userId}
                className="p-2 rounded-lg bg-secondary/50 flex items-center gap-2"
              >
                <span className="text-lg">{supporter.role === 'parent' ? '👨‍👩‍👧' : '👨‍🏫'}</span>
                <span className="text-sm">{supporter.nickname}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {supporter.role === 'parent' ? 'Eltern' : 'Lehrer'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
