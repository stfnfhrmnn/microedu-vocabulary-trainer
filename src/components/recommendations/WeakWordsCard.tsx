'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { useWeakWords } from '@/hooks/useStudyRecommendations'
import { cn } from '@/lib/utils/cn'
import type { WeakWord } from '@/lib/learning/study-recommendations'

interface Props {
  limit?: number
  onPractice?: (words: WeakWord[]) => void
}

const difficultyColors: Record<WeakWord['difficulty'], string> = {
  struggling: 'bg-error-100 text-error-700',
  very_hard: 'bg-warning-100 text-warning-700',
  hard: 'bg-yellow-100 text-yellow-700',
}

const difficultyLabels: Record<WeakWord['difficulty'], string> = {
  struggling: 'Schwierig',
  very_hard: 'Sehr schwer',
  hard: 'Schwer',
}

export function WeakWordsCard({ limit = 5, onPractice }: Props) {
  const { weakWords, isLoading, strugglingCount, veryHardCount, hardCount } = useWeakWords(limit)

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-40" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (weakWords.length === 0) {
    return null
  }

  const totalProblematic = strugglingCount + veryHardCount + hardCount

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Problemvokabeln</h3>
          <span className="text-sm text-gray-500">
            {totalProblematic} {totalProblematic === 1 ? 'Wort' : 'Wörter'}
          </span>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mb-3">
          {strugglingCount > 0 && (
            <span className={cn('text-xs font-medium px-2 py-1 rounded-full', difficultyColors.struggling)}>
              {strugglingCount} kritisch
            </span>
          )}
          {veryHardCount > 0 && (
            <span className={cn('text-xs font-medium px-2 py-1 rounded-full', difficultyColors.very_hard)}>
              {veryHardCount} sehr schwer
            </span>
          )}
          {hardCount > 0 && (
            <span className={cn('text-xs font-medium px-2 py-1 rounded-full', difficultyColors.hard)}>
              {hardCount} schwer
            </span>
          )}
        </div>

        {/* Word list */}
        <div className="space-y-2">
          {weakWords.map((item, index) => (
            <motion.div
              key={item.vocabulary.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">
                    {item.vocabulary.sourceText}
                  </p>
                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded',
                    difficultyColors[item.difficulty]
                  )}>
                    {difficultyLabels[item.difficulty]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {item.vocabulary.targetText}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn(
                  'text-sm font-medium',
                  item.accuracy < 0.3 ? 'text-error-600' :
                    item.accuracy < 0.5 ? 'text-warning-600' : 'text-gray-600'
                )}>
                  {Math.round(item.accuracy * 100)}%
                </p>
                <p className="text-xs text-gray-400">
                  {item.totalAttempts} Versuche
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Practice button */}
        {onPractice && weakWords.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onPractice(weakWords)}
            className="w-full mt-4 py-3 bg-warning-500 text-white font-semibold rounded-xl hover:bg-warning-600 transition-colors"
          >
            Diese Vokabeln gezielt üben
          </motion.button>
        )}

        {/* Link to all weak words */}
        {totalProblematic > limit && (
          <Link
            href="/progress?tab=weak"
            className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-3"
          >
            Alle {totalProblematic} anzeigen →
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
