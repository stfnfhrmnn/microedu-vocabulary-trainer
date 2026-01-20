'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'

interface WeeklyChartProps {
  data: { date: string; count: number }[]
  dailyGoal?: number
  className?: string
}

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function WeeklyChart({ data, dailyGoal = 15, className }: WeeklyChartProps) {
  const { chartData, maxCount } = useMemo(() => {
    // Get the last 7 days
    const today = new Date()
    const weekData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayData = data.find((d) => d.date === dateStr)
      weekData.push({
        date: dateStr,
        count: dayData?.count || 0,
        dayIndex: (date.getDay() + 6) % 7, // Monday = 0
        isToday: i === 0,
      })
    }

    const max = Math.max(...weekData.map((d) => d.count), dailyGoal)
    return { chartData: weekData, maxCount: max }
  }, [data, dailyGoal])

  return (
    <div className={cn('', className)}>
      {/* Goal line label */}
      <div className="flex items-center justify-end mb-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-primary-300 rounded-full" />
          <span className="text-xs text-gray-500">Tagesziel ({dailyGoal})</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-32">
        {/* Goal line */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-primary-200"
          style={{ bottom: `${(dailyGoal / maxCount) * 100}%` }}
        />

        {/* Bars */}
        <div className="flex items-end justify-between h-full gap-2">
          {chartData.map((day, index) => {
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
            const reachedGoal = day.count >= dailyGoal

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <motion.div
                  className="w-full relative"
                  style={{ height: '100%' }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      'absolute bottom-0 w-full rounded-t-lg',
                      reachedGoal
                        ? 'bg-gradient-to-t from-success-500 to-success-400'
                        : day.count > 0
                        ? 'bg-gradient-to-t from-primary-500 to-primary-400'
                        : 'bg-gray-200'
                    )}
                  >
                    {/* Count label on top of bar */}
                    {day.count > 0 && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className={cn(
                          'absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium',
                          reachedGoal ? 'text-success-600' : 'text-gray-600'
                        )}
                      >
                        {day.count}
                      </motion.span>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Day labels */}
      <div className="flex justify-between mt-2">
        {chartData.map((day) => (
          <div
            key={day.date}
            className={cn(
              'flex-1 text-center text-xs',
              day.isToday ? 'text-primary-600 font-semibold' : 'text-gray-500'
            )}
          >
            {DAYS[day.dayIndex]}
            {day.isToday && (
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-auto mt-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
