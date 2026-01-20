'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { SectionDueStat } from '@/lib/db/hooks/useSectionDueStats'

export interface SectionSuggestionsProps {
  sections: SectionDueStat[]
  selectedSectionIds: string[]
  onToggleSection: (sectionId: string) => void
  maxSuggestions?: number
}

export function SectionSuggestions({
  sections,
  selectedSectionIds,
  onToggleSection,
  maxSuggestions = 3,
}: SectionSuggestionsProps) {
  // Get sections with due words
  const suggestedSections = sections
    .filter((s) => s.dueCount > 0)
    .slice(0, maxSuggestions)

  if (suggestedSections.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="text-lg">📚</span>
        Empfohlen zum Wiederholen
      </h3>
      <div className="space-y-2">
        {suggestedSections.map((stat, index) => {
          const isSelected = selectedSectionIds.includes(stat.section.id)
          return (
            <motion.button
              key={stat.section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onToggleSection(stat.section.id)}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left',
                isSelected
                  ? 'bg-primary-50 border-2 border-primary-500'
                  : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                  isSelected ? 'bg-primary-500 text-white' : 'bg-gray-200'
                )}
              >
                {isSelected && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {stat.section.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {stat.book.name} › {stat.chapter.name}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-semibold text-primary-600">
                  {stat.dueCount}
                </span>
                <span className="text-xs text-gray-500 ml-1">fällig</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
