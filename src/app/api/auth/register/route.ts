import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { signToken } from '@/lib/auth/jwt'
import { z } from 'zod'

// Generate XXXX-XXXX user code
function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusable chars (0,O,1,I)
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const RegisterSchema = z.object({
  name: z.string().min(1).max(100).optional().default('Benutzer'),
  avatar: z.string().min(1).max(10).optional().default('🦊'),
  // Optional: existing local user code to migrate
  existingUserCode: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, avatar, existingUserCode } = RegisterSchema.parse(body)

    // Use existing code if provided (for migration), otherwise generate new
    let userCode = existingUserCode || generateUserCode()

    // Ensure code is unique (retry if collision)
    let attempts = 0
    while (attempts < 10) {
      const existing = await serverDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.userCode, userCode),
      })

      if (!existing) break

      // If existingUserCode was provided and exists, user already registered
      if (existingUserCode) {
        return NextResponse.json(
          { error: 'User code already registered. Please use /api/auth/login instead.' },
          { status: 409 }
        )
      }

      // Generate new code and retry
      userCode = generateUserCode()
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Failed to generate unique user code' },
        { status: 500 }
      )
    }

    // Create user
    const [user] = await serverDb
      .insert(schema.users)
      .values({
        userCode,
        name,
        avatar,
      })
      .returning()

    // Create empty user data record
    await serverDb.insert(schema.userData).values({
      userId: user.id,
      gamification: {},
      achievements: {},
      settings: {},
    })

    // Generate JWT
    const token = await signToken({
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
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
