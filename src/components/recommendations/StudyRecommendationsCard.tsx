'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { useStudyRecommendations } from '@/hooks/useStudyRecommendations'
import { cn } from '@/lib/utils/cn'
import type { StudyRecommendation } from '@/lib/learning/study-recommendations'

interface Props {
  onAction?: (recommendation: StudyRecommendation) => void
  maxItems?: number
}

const typeIcons: Record<StudyRecommendation['type'], string> = {
  weakness: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  optimal_time: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  streak_risk: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  milestone: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
}

const typeColors: Record<StudyRecommendation['type'], string> = {
  weakness: 'bg-warning-100 text-warning-600',
  optimal_time: 'bg-success-100 text-success-600',
  streak_risk: 'bg-error-100 text-error-600',
  milestone: 'bg-primary-100 text-primary-600',
}

const priorityBadgeColors: Record<StudyRecommendation['priority'], string> = {
  high: 'bg-error-100 text-error-700',
  medium: 'bg-warning-100 text-warning-700',
  low: 'bg-gray-100 text-gray-700',
}

export function StudyRecommendationsCard({ onAction, maxItems = 3 }: Props) {
  const { recommendations, isLoading, error } = useStudyRecommendations()

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || recommendations.length === 0) {
    return null
  }

  const displayItems = recommendations.slice(0, maxItems)

  return (
    <Card>
      <CardContent>
        <h3 className="font-semibold text-gray-900 mb-3">Empfehlungen</h3>
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {displayItems.map((rec, index) => (
              <motion.button
                key={`${rec.type}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onAction?.(rec)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                  'bg-gray-50 hover:bg-gray-100'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  typeColors[rec.type]
                )}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeIcons[rec.type]} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{rec.title}</p>
                    {rec.priority === 'high' && (
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded',
                        priorityBadgeColors[rec.priority]
                      )}>
                        Wichtig
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{rec.description}</p>
                </div>
                {rec.action && (
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </motion.button>
            ))}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
