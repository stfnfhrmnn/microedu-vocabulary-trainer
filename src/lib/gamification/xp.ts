import type { ExerciseType } from '@/lib/db/schema'

// XP rewards per action
const BASE_XP = {
  flashcard: 5,
  multipleChoice: 8,
  typed: 12,
} as const

const BONUSES = {
  perfectSession: 20,
  firstPracticeOfDay: 10,
  dailyGoalComplete: 25,
} as const

// Level thresholds
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5 - Bronze
  2000,   // Level 6
  3500,   // Level 7
  5000,   // Level 8
  7000,   // Level 9
  10000,  // Level 10 - Silver
  13000,  // Level 11
  16000,  // Level 12
  20000,  // Level 13
  25000,  // Level 14
  30000,  // Level 15 - Gold
  36000,  // Level 16
  43000,  // Level 17
  50000,  // Level 18
  60000,  // Level 19
  75000,  // Level 20 - Platinum
  90000,  // Level 21
  110000, // Level 22
  135000, // Level 23
  165000, // Level 24
  200000, // Level 25 - Diamond
] as const

const LEVEL_TITLES: Record<number, string> = {
  1: 'Beginner',
  5: 'Bronze',
  10: 'Silver',
  15: 'Gold',
  20: 'Platinum',
  25: 'Diamond',
}

export interface XPGain {
  base: number
  streakBonus: number
  total: number
  reason: string
}

/**
 * Calculate XP gained for a correct answer
 */
export function calculateAnswerXP(
  exerciseType: ExerciseType,
  streakDays: number = 0
): XPGain {
  const base = BASE_XP[exerciseType]
  // +1 XP per 5 days of streak
  const streakBonus = Math.floor(streakDays / 5)
  const total = base + streakBonus

  return {
    base,
    streakBonus,
    total,
    reason: 'Richtige Antwort',
  }
}

/**
 * Calculate bonus XP for session completion
 */
export function calculateSessionBonusXP(
  correctCount: number,
  totalCount: number,
  isFirstPracticeOfDay: boolean,
  dailyGoalReached: boolean
): XPGain[] {
  const bonuses: XPGain[] = []

  // Perfect session bonus
  if (correctCount === totalCount && totalCount > 0) {
    bonuses.push({
      base: BONUSES.perfectSession,
      streakBonus: 0,
      total: BONUSES.perfectSession,
      reason: 'Perfekte Runde!',
    })
  }

  // First practice of day bonus
  if (isFirstPracticeOfDay) {
    bonuses.push({
      base: BONUSES.firstPracticeOfDay,
      streakBonus: 0,
      total: BONUSES.firstPracticeOfDay,
      reason: 'Erste Übung heute',
    })
  }

  // Daily goal complete bonus
  if (dailyGoalReached) {
    bonuses.push({
      base: BONUSES.dailyGoalComplete,
      streakBonus: 0,
      total: BONUSES.dailyGoalComplete,
      reason: 'Tagesziel erreicht!',
    })
  }

  return bonuses
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
    } else {
      break
    }
  }
  return level
}

/**
 * Get XP progress within current level
 */
export function getLevelProgress(totalXP: number): {
  level: number
  currentLevelXP: number
  nextLevelXP: number
  progress: number
} {
  const level = calculateLevel(totalXP)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]

  const xpInLevel = totalXP - currentThreshold
  const xpNeededForLevel = nextThreshold - currentThreshold
  const progress = Math.min(xpInLevel / xpNeededForLevel, 1)

  return {
    level,
    currentLevelXP: xpInLevel,
    nextLevelXP: xpNeededForLevel,
    progress,
  }
}

/**
 * Get level title (if any)
 */
export function getLevelTitle(level: number): string | null {
  // Find the highest milestone at or below current level
  const milestones = Object.keys(LEVEL_TITLES)
    .map(Number)
    .filter((m) => m <= level)
    .sort((a, b) => b - a)

  return milestones.length > 0 ? LEVEL_TITLES[milestones[0]] : null
}

/**
 * Check if level up occurred
 */
export function checkLevelUp(oldXP: number, newXP: number): number | null {
  const oldLevel = calculateLevel(oldXP)
  const newLevel = calculateLevel(newXP)

  return newLevel > oldLevel ? newLevel : null
}
