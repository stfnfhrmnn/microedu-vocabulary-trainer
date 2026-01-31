'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { PageContainer } from '@/components/layout/PageContainer'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import {
  getAchievementsByCategory,
  type Achievement,
} from '@/lib/gamification/achievements'
import {
  useAchievements,
  useAchievementProgress,
} from '@/stores/achievements'
import { cn } from '@/lib/utils/cn'

const categoryIcons: Record<Achievement['category'], string> = {
  consistency: '📅',
  volume: '📚',
  accuracy: '🎯',
  special: '⭐',
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const t = useTranslations('achievements')
  const isUnlocked = useAchievements((s) => s.isUnlocked(achievement.id))
  const getUnlockDate = useAchievements((s) => s.getUnlockDate)
  const unlockDate = getUnlockDate(achievement.id)

  // Get translated name and description, falling back to achievement defaults
  const name = t.has(`items.${achievement.id}.name`)
    ? t(`items.${achievement.id}.name`)
    : achievement.name
  const description = t.has(`items.${achievement.id}.description`)
    ? t(`items.${achievement.id}.description`)
    : achievement.description

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card
        className={cn(
          'h-full transition-all duration-200',
          isUnlocked
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
            : 'bg-gray-50 border-gray-200 opacity-60'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                isUnlocked
                  ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg'
                  : 'bg-gray-200'
              )}
            >
              {isUnlocked ? achievement.icon : '🔒'}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'font-semibold',
                  isUnlocked ? 'text-gray-900' : 'text-gray-500'
                )}
              >
                {name}
              </h3>
              <p
                className={cn(
                  'text-sm mt-0.5',
                  isUnlocked ? 'text-gray-600' : 'text-gray-400'
                )}
              >
                {description}
              </p>
              {isUnlocked && unlockDate && (
                <p className="text-xs text-amber-600 mt-2">
                  {t('unlockedOn', { date: unlockDate.toLocaleDateString() })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CategorySection({ category }: { category: Achievement['category'] }) {
  const t = useTranslations('achievements')
  const achievements = getAchievementsByCategory(category)
  const isUnlocked = useAchievements((s) => s.isUnlocked)
  const unlockedCount = achievements.filter((a) => isUnlocked(a.id)).length

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{categoryIcons[category]}</span>
        <h2 className="text-lg font-semibold text-gray-900">
          {t(`categories.${category}`)}
        </h2>
        <span className="ml-auto text-sm text-gray-500">
          {unlockedCount}/{achievements.length}
        </span>
      </div>
      <div className="grid gap-3">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </section>
  )
}

export default function AchievementsPage() {
  const t = useTranslations('achievements')
  const { unlocked, total, percentage } = useAchievementProgress()

  return (
    <PageContainer>
      <Header title={t('title')} showBack />

      {/* Progress Summary */}
      <Card className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600">
        <CardContent className="text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
            <div className="flex-1">
              <p className="text-primary-100 text-sm">{t('unlocked')}</p>
              <p className="text-2xl font-bold">
                {t('unlockedOf', { unlocked, total })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{percentage}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Achievement Categories */}
      <CategorySection category="consistency" />
      <CategorySection category="volume" />
      <CategorySection category="accuracy" />
      <CategorySection category="special" />
    </PageContainer>
  )
}
