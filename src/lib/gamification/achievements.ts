// Achievement definitions
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'consistency' | 'volume' | 'accuracy' | 'special'
  // Check function returns true if achievement is unlocked
  // Stats are passed to check if condition is met
}

export interface AchievementStats {
  // Streak stats
  currentStreak: number
  longestStreak: number
  // Volume stats
  totalWordsLearned: number
  totalReviews: number
  totalSessions: number
  // Accuracy stats
  currentCorrectStreak: number
  longestCorrectStreak: number
  perfectSessions: number
  // Time stats
  currentHour: number
  isWeekend: boolean
  // Mode stats
  parentQuizSessions: number
}

export const ACHIEVEMENTS: Achievement[] = [
  // === Consistency Achievements ===
  {
    id: 'first_steps',
    name: 'Erste Schritte',
    description: 'Schließe deine erste Übungsrunde ab',
    icon: '👣',
    category: 'consistency',
  },
  {
    id: 'getting_started',
    name: 'Guter Start',
    description: '3 Tage in Folge geübt',
    icon: '🌱',
    category: 'consistency',
  },
  {
    id: 'on_a_roll',
    name: 'Am Ball',
    description: '7 Tage in Folge geübt',
    icon: '🎯',
    category: 'consistency',
  },
  {
    id: 'two_weeks_strong',
    name: 'Zwei Wochen stark',
    description: '14 Tage in Folge geübt',
    icon: '💪',
    category: 'consistency',
  },
  {
    id: 'monthly_master',
    name: 'Monatsmeister',
    description: '30 Tage in Folge geübt',
    icon: '🏆',
    category: 'consistency',
  },
  {
    id: 'unstoppable',
    name: 'Unaufhaltsam',
    description: '100 Tage in Folge geübt',
    icon: '⚡',
    category: 'consistency',
  },

  // === Volume Achievements ===
  {
    id: 'word_collector',
    name: 'Wortsammler',
    description: '50 Vokabeln gelernt',
    icon: '📝',
    category: 'volume',
  },
  {
    id: 'vocabulary_builder',
    name: 'Wortschatz-Bauer',
    description: '100 Vokabeln gelernt',
    icon: '📖',
    category: 'volume',
  },
  {
    id: 'word_wizard',
    name: 'Wort-Magier',
    description: '500 Vokabeln gelernt',
    icon: '🧙',
    category: 'volume',
  },
  {
    id: 'dictionary_master',
    name: 'Wörterbuch-Meister',
    description: '1000 Vokabeln gelernt',
    icon: '📚',
    category: 'volume',
  },

  // === Accuracy Achievements ===
  {
    id: 'sharp_mind',
    name: 'Scharfer Verstand',
    description: '10 richtige Antworten in Folge',
    icon: '🎯',
    category: 'accuracy',
  },
  {
    id: 'perfect_memory',
    name: 'Perfektes Gedächtnis',
    description: '25 richtige Antworten in Folge',
    icon: '🧠',
    category: 'accuracy',
  },
  {
    id: 'genius_mode',
    name: 'Genie-Modus',
    description: '50 richtige Antworten in Folge',
    icon: '💡',
    category: 'accuracy',
  },
  {
    id: 'flawless',
    name: 'Makellos',
    description: '5 perfekte Übungsrunden',
    icon: '✨',
    category: 'accuracy',
  },

  // === Special Achievements ===
  {
    id: 'night_owl',
    name: 'Nachteule',
    description: 'Übe nach 22 Uhr',
    icon: '🦉',
    category: 'special',
  },
  {
    id: 'early_bird',
    name: 'Frühaufsteher',
    description: 'Übe vor 7 Uhr',
    icon: '🐦',
    category: 'special',
  },
  {
    id: 'weekend_warrior',
    name: 'Wochenend-Kämpfer',
    description: 'Übe am Wochenende',
    icon: '⚔️',
    category: 'special',
  },
  {
    id: 'family_time',
    name: 'Familienzeit',
    description: '10 Eltern-Quiz Runden',
    icon: '👨‍👩‍👧',
    category: 'special',
  },
]

// Map achievement IDs to their check functions
export function checkAchievement(id: string, stats: AchievementStats): boolean {
  switch (id) {
    // Consistency
    case 'first_steps':
      return stats.totalSessions >= 1
    case 'getting_started':
      return stats.longestStreak >= 3
    case 'on_a_roll':
      return stats.longestStreak >= 7
    case 'two_weeks_strong':
      return stats.longestStreak >= 14
    case 'monthly_master':
      return stats.longestStreak >= 30
    case 'unstoppable':
      return stats.longestStreak >= 100

    // Volume
    case 'word_collector':
      return stats.totalWordsLearned >= 50
    case 'vocabulary_builder':
      return stats.totalWordsLearned >= 100
    case 'word_wizard':
      return stats.totalWordsLearned >= 500
    case 'dictionary_master':
      return stats.totalWordsLearned >= 1000

    // Accuracy
    case 'sharp_mind':
      return stats.longestCorrectStreak >= 10
    case 'perfect_memory':
      return stats.longestCorrectStreak >= 25
    case 'genius_mode':
      return stats.longestCorrectStreak >= 50
    case 'flawless':
      return stats.perfectSessions >= 5

    // Special
    case 'night_owl':
      return stats.currentHour >= 22 || stats.currentHour < 5
    case 'early_bird':
      return stats.currentHour >= 5 && stats.currentHour < 7
    case 'weekend_warrior':
      return stats.isWeekend
    case 'family_time':
      return stats.parentQuizSessions >= 10

    default:
      return false
  }
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category)
}
