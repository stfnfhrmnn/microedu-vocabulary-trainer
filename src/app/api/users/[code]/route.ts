import { NextResponse } from 'next/server'
import { serverDb } from '@/lib/db/postgres'

interface RouteParams {
  params: Promise<{ code: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params
    const userCode = code.toUpperCase()

    // Validate format
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(userCode)) {
      return NextResponse.json(
        { error: 'Invalid user code format' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await serverDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.userCode, userCode),
      columns: {
        userCode: true,
        name: true,
        avatar: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { exists: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      exists: true,
      user: {
        userCode: user.userCode,
        name: user.name,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('User check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
