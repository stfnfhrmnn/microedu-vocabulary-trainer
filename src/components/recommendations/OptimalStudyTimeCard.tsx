'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { useOptimalStudyTimes } from '@/hooks/useStudyRecommendations'
import { formatOptimalTime } from '@/lib/learning/study-recommendations'
import { cn } from '@/lib/utils/cn'

export function OptimalStudyTimeCard() {
  const { times, isLoading, isNowOptimal, bestTime } = useOptimalStudyTimes()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-3">
          <div className="animate-pulse h-5 bg-gray-200 rounded w-40" />
        </CardContent>
      </Card>
    )
  }

  if (times.length === 0) {
    return null
  }

  return (
    <Card className={cn(isNowOptimal && 'border-success-300 bg-success-50')}>
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            isNowOptimal ? 'bg-success-100' : 'bg-gray-100'
          )}>
            <svg
              className={cn('w-5 h-5', isNowOptimal ? 'text-success-600' : 'text-gray-600')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {isNowOptimal ? (
              <>
                <p className="font-medium text-success-700">Gute Zeit zum Lernen!</p>
                <p className="text-sm text-success-600">
                  Deine Leistung ist jetzt besonders gut
                </p>
              </>
            ) : bestTime ? (
              <>
                <p className="font-medium text-gray-900">Beste Lernzeit</p>
                <p className="text-sm text-gray-500">
                  {formatOptimalTime(bestTime)} ({Math.round(bestTime.averageAccuracy * 100)}% Genauigkeit)
                </p>
              </>
            ) : null}
          </div>

          {isNowOptimal && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-200 text-success-800">
                Jetzt!
              </span>
            </div>
          )}
        </div>

        {/* Top times list (collapsed) */}
        {times.length > 1 && !isNowOptimal && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Deine Top-Lernzeiten:</p>
            <div className="flex flex-wrap gap-2">
              {times.slice(0, 3).map((time, index) => (
                <span
                  key={`${time.dayOfWeek}-${time.hour}`}
                  className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    index === 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {formatOptimalTime(time).split(' um ')[0].slice(0, 2)}. {time.hour}:00
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
