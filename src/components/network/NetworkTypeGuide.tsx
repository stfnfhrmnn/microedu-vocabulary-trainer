'use client'

import { cn } from '@/lib/utils/cn'
import type { NetworkType } from '@/lib/db/schema'

interface NetworkTypeGuideProps {
  selectedType?: NetworkType
  onSelect?: (type: NetworkType) => void
  className?: string
}

const NETWORK_TYPE_HINTS: Array<{
  type: NetworkType
  emoji: string
  title: string
  description: string
  recommendation?: string
}> = [
  {
    type: 'family',
    emoji: '👨‍👩‍👧‍👦',
    title: 'Familie',
    description: 'Eltern + Kinder, Fortschritt im Alltag begleiten.',
    recommendation: 'Empfohlen für Eltern',
  },
  {
    type: 'class',
    emoji: '🏫',
    title: 'Klasse',
    description: 'Lehrkraft teilt Material mit einer Lerngruppe in der Schule.',
  },
  {
    type: 'study_group',
    emoji: '📚',
    title: 'Lerngruppe',
    description: 'Freunde lernen zusammen ohne Eltern-/Lehrerstruktur.',
  },
]

export function NetworkTypeGuide({ selectedType, onSelect, className }: NetworkTypeGuideProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-gray-600">Welche Art passt?</p>
      <div className="space-y-2">
        {NETWORK_TYPE_HINTS.map((item) => {
          const isSelected = selectedType === item.type
          const Wrapper = onSelect ? 'button' : 'div'

          return (
            <Wrapper
              key={item.type}
              {...(onSelect
                ? {
                    type: 'button' as const,
                    onClick: () => onSelect(item.type),
                  }
                : {})}
              className={cn(
                'w-full rounded-xl border px-3 py-2 text-left transition-colors',
                onSelect && 'hover:bg-gray-50',
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{item.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                    {item.recommendation && (
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                        {item.recommendation}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              </div>
            </Wrapper>
          )
        })}
      </div>
    </div>
  )
}
