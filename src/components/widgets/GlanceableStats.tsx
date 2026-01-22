'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useOverallStats, useDailyStudyStats } from '@/hooks/useAnalytics'
import { useDueWordsCount } from '@/lib/db/hooks/useDueWords'
import { cn } from '@/lib/utils/cn'

interface Props {
  variant?: 'compact' | 'full'
  className?: string
}

/**
 * Compact glanceable stats for quick overview
 * Can be used like a widget on the home screen
 */
export function GlanceableStats({ variant = 'full', className }: Props) {
  const dueCount = useDueWordsCount()
  const { stats, isLoading: statsLoading } = useOverallStats()
  const { summary } = useDailyStudyStats(7)

  if (statsLoading) {
    return (
      <div className={cn('animate-pulse rounded-2xl bg-gray-100 h-32', className)} />
    )
  }

  if (variant === 'compact') {
    return (
      <Link href="/practice">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={cn(
            'bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 text-white shadow-lg',
            className
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-xs font-medium">Heute fällig</p>
              <p className="text-3xl font-bold">{dueCount}</p>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-xs font-medium">Streak</p>
              <p className="text-2xl font-bold">{stats?.currentStreak || 0}🔥</p>
            </div>
          </div>
        </motion.div>
      </Link>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main CTA - Due words */}
      <Link href="/practice">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Heute fällig</p>
              <p className="text-4xl font-bold">{dueCount}</p>
              <p className="text-primary-200 text-xs mt-1">
                {dueCount === 0 ? 'Alles erledigt!' : 'Tippe zum Üben'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8Z" />
                <path d="M12 4v8l5.24 3.02.94-1.68L13 10.8V4h-1Z" />
              </svg>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <div className="bg-warning-50 rounded-xl p-3 text-center">
          <p className="text-warning-600 text-2xl font-bold">
            {stats?.currentStreak || 0}
          </p>
          <p className="text-warning-700 text-xs">Tage 🔥</p>
        </div>

        {/* Mastered */}
        <div className="bg-success-50 rounded-xl p-3 text-center">
          <p className="text-success-600 text-2xl font-bold">
            {stats?.masteredWords || 0}
          </p>
          <p className="text-success-700 text-xs">Gemeistert</p>
        </div>

        {/* This week */}
        <div className="bg-primary-50 rounded-xl p-3 text-center">
          <p className="text-primary-600 text-2xl font-bold">
            {summary.totalWordsReviewed}
          </p>
          <p className="text-primary-700 text-xs">Diese Woche</p>
        </div>
      </div>

      {/* Progress bar */}
      {stats && stats.totalWords > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Fortschritt</span>
            <span className="text-sm text-gray-500">
              {Math.round((stats.masteredWords / stats.totalWords) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(stats.masteredWords / stats.totalWords) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{stats.totalWords} gesamt</span>
            <span>{stats.totalWords - stats.masteredWords} übrig</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Mini widget for notification-like display
 */
export function MiniStatsWidget({ className }: { className?: string }) {
  const dueCount = useDueWordsCount()

  if (dueCount === 0) {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 bg-success-100 text-success-700 rounded-full text-sm font-medium',
        className
      )}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
        Alles erledigt
      </div>
    )
  }

  return (
    <Link href="/practice">
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-200 transition-colors',
        className
      )}>
        <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs">
          {dueCount > 99 ? '99+' : dueCount}
        </span>
        Vokabeln üben
      </div>
    </Link>
  )
}
