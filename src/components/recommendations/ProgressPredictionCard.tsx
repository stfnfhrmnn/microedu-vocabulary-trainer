'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { useProgressPrediction } from '@/hooks/useStudyRecommendations'
import { formatPrediction } from '@/lib/learning/study-recommendations'
import { cn } from '@/lib/utils/cn'

export function ProgressPredictionCard() {
  const { prediction, isLoading } = useProgressPrediction()

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!prediction || prediction.totalWords === 0) {
    return null
  }

  const { masteryPercentage, currentMastered, totalWords, weeklyProgress, projectedMasteryDate } = prediction

  // Determine motivation message
  let motivationMessage = ''
  let motivationColor = 'text-gray-600'

  if (masteryPercentage >= 90) {
    motivationMessage = 'Fast geschafft!'
    motivationColor = 'text-success-600'
  } else if (masteryPercentage >= 75) {
    motivationMessage = 'Auf der Zielgeraden!'
    motivationColor = 'text-success-600'
  } else if (masteryPercentage >= 50) {
    motivationMessage = 'Halbzeit erreicht!'
    motivationColor = 'text-primary-600'
  } else if (masteryPercentage >= 25) {
    motivationMessage = 'Guter Fortschritt!'
    motivationColor = 'text-primary-600'
  } else if (weeklyProgress > 0) {
    motivationMessage = 'Du bist auf dem richtigen Weg'
    motivationColor = 'text-gray-600'
  }

  return (
    <Card>
      <CardContent>
        <h3 className="font-semibold text-gray-900 mb-4">Dein Lernfortschritt</h3>

        {/* Circular progress indicator */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={masteryPercentage >= 75 ? '#22c55e' : masteryPercentage >= 50 ? '#3b82f6' : '#fbbf24'}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 100' }}
                animate={{ strokeDasharray: `${masteryPercentage} ${100 - masteryPercentage}` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900">
                {Math.round(masteryPercentage)}%
              </span>
            </div>
          </div>

          <div className="flex-1">
            <p className={cn('font-medium text-lg', motivationColor)}>
              {motivationMessage}
            </p>
            <p className="text-sm text-gray-500">
              {currentMastered} von {totalWords} gemeistert
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Pro Woche</p>
            <p className="text-lg font-semibold text-gray-900">
              {weeklyProgress > 0 ? `~${weeklyProgress}` : '—'}
            </p>
            <p className="text-xs text-gray-500">Vokabeln</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Prognose</p>
            <p className="text-lg font-semibold text-gray-900">
              {projectedMasteryDate ? formatPrediction(prediction) : '—'}
            </p>
            <p className="text-xs text-gray-500">bis Meisterschaft</p>
          </div>
        </div>

        {/* Projected date */}
        {projectedMasteryDate && (
          <p className="text-xs text-center text-gray-400 mt-3">
            Geschätzt: {projectedMasteryDate.toLocaleDateString('de-DE', {
              day: 'numeric',
              month: 'long',
              year: masteryPercentage < 90 ? 'numeric' : undefined
            })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
