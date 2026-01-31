/**
 * Device Transfer Request API
 *
 * POST /api/auth/transfer/request - Generate a transfer token and PIN
 *
 * Returns a one-time transfer URL and 4-digit PIN for secure device transfer.
 * The token expires after 15 minutes and can only be used once.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { authRateLimiter } from '@/lib/api/rate-limit'
import { generateTransferToken, generateTransferPin } from '@/lib/utils/user-id'
import { eq, and, isNull, gt } from 'drizzle-orm'

const TRANSFER_EXPIRY_MINUTES = 15

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitError = authRateLimiter(request)
  if (rateLimitError) return rateLimitError

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Invalidate any existing unused tokens for this user
    await serverDb
      .update(schema.deviceTransferTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(schema.deviceTransferTokens.userId, user.userId),
          isNull(schema.deviceTransferTokens.usedAt)
        )
      )

    // Generate new token and PIN
    const token = generateTransferToken()
    const pin = generateTransferPin()
    const expiresAt = new Date(Date.now() + TRANSFER_EXPIRY_MINUTES * 60 * 1000)

    // Store in database
    await serverDb.insert(schema.deviceTransferTokens).values({
      userId: user.userId,
      token,
      pin,
      expiresAt,
    })

    // Build transfer URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const transferUrl = `${baseUrl}/transfer?token=${token}`

    return NextResponse.json({
      success: true,
      pin,
      transferUrl,
      expiresInMinutes: TRANSFER_EXPIRY_MINUTES,
    })
  } catch (error) {
    console.error('Transfer request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
