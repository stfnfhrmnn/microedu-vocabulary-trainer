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

// ============================================================================
// Network Invite Codes (XXX-XXX format - shorter, distinct from user codes)
// ============================================================================

/**
 * Generate a network invite code in XXX-XXX format
 * ~1 billion combinations (32^6)
 */
export function generateNetworkInviteCode(): string {
  const part1 = generateRandomPart(3)
  const part2 = generateRandomPart(3)
  return `${part1}-${part2}`
}

/**
 * Validate a network invite code format
 */
export function isValidNetworkInviteCode(code: string): boolean {
  if (typeof code !== 'string') return false
  const pattern = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}$/
  return pattern.test(code)
}

// ============================================================================
// Device Transfer (secure token + PIN for account transfer between devices)
// ============================================================================

/**
 * Generate a secure transfer token (256-bit / 64 hex chars)
 */
export function generateTransferToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a 4-digit PIN for transfer verification
 */
export function generateTransferPin(): string {
  const array = new Uint8Array(2)
  crypto.getRandomValues(array)
  return (((array[0] << 8) | array[1]) % 10000).toString().padStart(4, '0')
}
