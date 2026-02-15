'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface AudioWaveformProps {
  audioLevels: number[]
  isActive: boolean
  className?: string
  barCount?: number
}

const BAR_WIDTH = 3
const BAR_GAP = 2
const MIN_HEIGHT = 3
const MAX_HEIGHT = 56

function AudioWaveformInner({
  audioLevels,
  isActive,
  className,
  barCount = 32,
}: AudioWaveformProps) {
  // Downsample audioLevels to barCount bars by averaging groups
  const bars = useMemo(() => {
    if (!audioLevels.length) return new Array(barCount).fill(0)

    const groupSize = Math.max(1, Math.floor(audioLevels.length / barCount))
    const result: number[] = []

    for (let i = 0; i < barCount; i++) {
      const start = i * groupSize
      const end = Math.min(start + groupSize, audioLevels.length)
      let sum = 0
      for (let j = start; j < end; j++) {
        sum += audioLevels[j]
      }
      // Normalize 0-255 to 0-1
      result.push(sum / (end - start) / 255)
    }

    return result
  }, [audioLevels, barCount])

  const totalWidth = barCount * BAR_WIDTH + (barCount - 1) * BAR_GAP

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ height: MAX_HEIGHT + 8 }}
    >
      <div
        className="flex items-center gap-px"
        style={{ width: totalWidth, gap: BAR_GAP }}
      >
        {bars.map((level, i) => {
          const height = isActive
            ? Math.max(MIN_HEIGHT, level * MAX_HEIGHT)
            : MIN_HEIGHT + Math.sin((Date.now() / 600 + i) * 0.5) * 1.5

          return (
            <motion.div
              key={i}
              animate={{ height }}
              transition={{ duration: 0.08, ease: 'easeOut' }}
              className={cn(
                'rounded-full',
                isActive ? 'bg-primary-500' : 'bg-gray-300'
              )}
              style={{ width: BAR_WIDTH, minHeight: MIN_HEIGHT }}
            />
          )
        })}
      </div>
    </div>
  )
}

export const AudioWaveform = memo(AudioWaveformInner)
