/**
 * Check if a date is today or earlier
 */
export function isDueToday(date: Date): boolean {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date <= today
}

/**
 * Get start of today
 */
export function getStartOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Get end of today
 */
export function getEndOfToday(): Date {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return today
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Format date for display (German format)
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Get relative date description
 */
export function getRelativeDateLabel(date: Date): string {
  const today = getStartOfToday()
  const tomorrow = addDays(today, 1)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  if (targetDate.getTime() === today.getTime()) {
    return 'Heute'
  }
  if (targetDate.getTime() === tomorrow.getTime()) {
    return 'Morgen'
  }
  if (targetDate < today) {
    return 'Überfällig'
  }

  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 7) {
    return `In ${diffDays} Tagen`
  }

  return formatDate(date)
}
