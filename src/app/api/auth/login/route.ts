import { NextResponse } from 'next/server'
import { serverDb } from '@/lib/db/postgres'
import { signToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const LoginSchema = z.object({
  userCode: z
    .string()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid user code format (expected XXXX-XXXX)'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userCode } = LoginSchema.parse(body)

    // Find user by code
    const user = await serverDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.userCode, userCode.toUpperCase()),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Check your code or register first.' },
        { status: 404 }
      )
    }

    // Generate new JWT
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
