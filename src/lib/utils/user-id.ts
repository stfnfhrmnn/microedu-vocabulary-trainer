// User ID generation utility
// Format: XXXX-XXXX (8 uppercase alphanumeric, excluding ambiguous chars)

// Charset: 32 characters (excludes 0/O, 1/I/L)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generate a random user ID in XXXX-XXXX format
 * ~1.1 trillion combinations (32^8)
 */
export function generateUserId(): string {
  const part1 = generateRandomPart(4)
  const part2 = generateRandomPart(4)
  return `${part1}-${part2}`
}

function generateRandomPart(length: number): string {
  let result = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  for (let i = 0; i < length; i++) {
    result += CHARSET[array[i] % CHARSET.length]
  }

  return result
}

/**
 * Validate a user ID format
 */
export function isValidUserId(id: string): boolean {
  if (typeof id !== 'string') return false
  const pattern = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/
  return pattern.test(id)
}

/**
 * Format a user ID for display (first 4 chars only)
 */
export function formatUserIdShort(id: string): string {
  return id.split('-')[0]
}
