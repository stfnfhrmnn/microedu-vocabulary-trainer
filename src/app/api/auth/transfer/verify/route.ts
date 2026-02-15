/**
 * Device Transfer Verify API
 *
 * POST /api/auth/transfer/verify - Verify transfer token and PIN
 *
 * Validates the token exists, is not used, not expired, and PIN matches.
 * Returns JWT and user info on success.
 */

import { NextRequest, NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { signToken } from '@/lib/auth/jwt'
import { authRateLimiter } from '@/lib/api/rate-limit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const VerifySchema = z.object({
  token: z.string().length(64),
  pin: z.string().length(4).regex(/^\d{4}$/),
})

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitError = authRateLimiter(request)
  if (rateLimitError) return rateLimitError

  try {
    const body = await request.json()
    const { token, pin } = VerifySchema.parse(body)

    // Find the transfer token
    const transferToken = await serverDb.query.deviceTransferTokens.findFirst({
      where: (tokens, { eq, and, isNull, gt }) =>
        and(
          eq(tokens.token, token),
          isNull(tokens.usedAt),
          gt(tokens.expiresAt, new Date())
        ),
    })

    if (!transferToken) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Übertragungslink' },
        { status: 400 }
      )
    }

    // Verify PIN (constant-time comparison to prevent timing attacks)
    const pinValid = transferToken.pin.length === pin.length &&
      transferToken.pin.split('').every((char, i) => char === pin[i])

    if (!pinValid) {
      return NextResponse.json(
        { error: 'Ungültige PIN' },
        { status: 400 }
      )
    }

    // Mark token as used immediately
    await serverDb
      .update(schema.deviceTransferTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.deviceTransferTokens.id, transferToken.id))

    // Get user data
    const user = await serverDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, transferToken.userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Generate JWT
    const jwtToken = await signToken({
      userId: user.id,
      userCode: user.userCode,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        userCode: user.userCode,
        name: user.name,
        avatar: user.avatar,
      },
      token: jwtToken,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Anfrage', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Transfer verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
