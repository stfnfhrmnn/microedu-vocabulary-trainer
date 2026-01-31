import { describe, it, expect } from 'vitest'
import {
  generateUserId,
  isValidUserId,
  formatUserIdShort,
  generateNetworkInviteCode,
  isValidNetworkInviteCode,
  generateTransferToken,
  generateTransferPin,
} from '@/lib/utils/user-id'

describe('User ID utilities', () => {
  describe('generateUserId', () => {
    it('should generate XXXX-XXXX format', () => {
      const id = generateUserId()
      expect(id).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    })

    it('should generate unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateUserId())
      }
      expect(ids.size).toBe(100)
    })

    it('should not include ambiguous characters', () => {
      const ambiguousChars = /[0O1IL]/
      for (let i = 0; i < 50; i++) {
        const id = generateUserId()
        expect(id).not.toMatch(ambiguousChars)
      }
    })
  })

  describe('isValidUserId', () => {
    it('should validate correct format', () => {
      // CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' (no 0, O, 1, I, L)
      expect(isValidUserId('ABCD-2345')).toBe(true)
      expect(isValidUserId('WXYZ-5678')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidUserId('ABCD2345')).toBe(false) // no dash
      expect(isValidUserId('ABC-2345')).toBe(false) // too short
      expect(isValidUserId('ABCDE-2345')).toBe(false) // too long
      expect(isValidUserId('abcd-2345')).toBe(false) // lowercase
      expect(isValidUserId('')).toBe(false)
      expect(isValidUserId('ABCD-234O')).toBe(false) // contains O
      expect(isValidUserId('ABCD-1234')).toBe(false) // contains 1
    })
  })

  describe('formatUserIdShort', () => {
    it('should return first 4 characters', () => {
      expect(formatUserIdShort('ABCD-2345')).toBe('ABCD')
      expect(formatUserIdShort('WXYZ-5678')).toBe('WXYZ')
    })
  })
})

describe('Network Invite Code utilities', () => {
  describe('generateNetworkInviteCode', () => {
    it('should generate XXX-XXX format', () => {
      const code = generateNetworkInviteCode()
      expect(code).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/)
    })

    it('should generate unique codes', () => {
      const codes = new Set<string>()
      for (let i = 0; i < 100; i++) {
        codes.add(generateNetworkInviteCode())
      }
      expect(codes.size).toBe(100)
    })

    it('should not include ambiguous characters', () => {
      const ambiguousChars = /[0O1IL]/
      for (let i = 0; i < 50; i++) {
        const code = generateNetworkInviteCode()
        expect(code).not.toMatch(ambiguousChars)
      }
    })
  })

  describe('isValidNetworkInviteCode', () => {
    it('should validate correct format', () => {
      // CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' (no 0, O, 1, I, L)
      expect(isValidNetworkInviteCode('ABC-234')).toBe(true)
      expect(isValidNetworkInviteCode('XYZ-789')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidNetworkInviteCode('ABC234')).toBe(false) // no dash
      expect(isValidNetworkInviteCode('AB-234')).toBe(false) // too short
      expect(isValidNetworkInviteCode('ABCD-2345')).toBe(false) // too long (user code format)
      expect(isValidNetworkInviteCode('abc-234')).toBe(false) // lowercase
      expect(isValidNetworkInviteCode('')).toBe(false)
      expect(isValidNetworkInviteCode('ABC-23O')).toBe(false) // contains O
      expect(isValidNetworkInviteCode('ABC-123')).toBe(false) // contains 1
    })
  })
})

describe('Device Transfer utilities', () => {
  describe('generateTransferToken', () => {
    it('should generate 64 character hex string', () => {
      const token = generateTransferToken()
      expect(token).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateTransferToken())
      }
      expect(tokens.size).toBe(100)
    })

    it('should be 256 bits (32 bytes)', () => {
      const token = generateTransferToken()
      expect(token.length).toBe(64) // 32 bytes * 2 hex chars per byte
    })
  })

  describe('generateTransferPin', () => {
    it('should generate 4 digit string', () => {
      const pin = generateTransferPin()
      expect(pin).toMatch(/^\d{4}$/)
    })

    it('should pad with leading zeros', () => {
      // Generate many PINs and check format
      for (let i = 0; i < 100; i++) {
        const pin = generateTransferPin()
        expect(pin.length).toBe(4)
        expect(parseInt(pin, 10)).toBeLessThanOrEqual(9999)
        expect(parseInt(pin, 10)).toBeGreaterThanOrEqual(0)
      }
    })

    it('should generate varied PINs', () => {
      const pins = new Set<string>()
      for (let i = 0; i < 100; i++) {
        pins.add(generateTransferPin())
      }
      // With 100 samples from 10000 possibilities, we should get many unique
      expect(pins.size).toBeGreaterThan(80)
    })
  })
})
