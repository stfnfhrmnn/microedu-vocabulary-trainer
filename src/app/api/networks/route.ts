/**
 * Network API Routes
 *
 * POST /api/networks - Create a new network
 * GET /api/networks - List user's networks
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { generateNetworkInviteCode } from '@/lib/utils/user-id'
import { z } from 'zod'

const CreateNetworkSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['class', 'study_group', 'family']),
  role: z.enum(['child', 'parent', 'teacher', 'admin']).optional().default('teacher'),
  settings: z.object({
    allowChildInvites: z.boolean().optional(),
    leaderboardVisible: z.boolean().optional(),
    parentsSeeAllProgress: z.boolean().optional(),
  }).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, role, settings } = CreateNetworkSchema.parse(body)

    // Generate unique invite code (XXX-XXX format)
    let inviteCode = generateNetworkInviteCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await serverDb.query.networks.findFirst({
        where: (networks, { eq }) => eq(networks.inviteCode, inviteCode),
      })
      if (!existing) break
      inviteCode = generateNetworkInviteCode()
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Failed to generate unique invite code' }, { status: 500 })
    }

    // Create network
    const [network] = await serverDb
      .insert(schema.networks)
      .values({
        name,
        type,
        inviteCode,
        ownerId: user.userId,
        settings: settings || {},
      })
      .returning()

    // Add creator as first member
    await serverDb.insert(schema.networkMembers).values({
      networkId: network.id,
      userId: user.userId,
      role,
      visibility: 'visible',
      joinStatus: 'active',
    })

    return NextResponse.json({
      success: true,
      network: {
        id: network.id,
        name: network.name,
        type: network.type,
        inviteCode: network.inviteCode,
        settings: network.settings,
        createdAt: network.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Create network error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV !== 'production' || process.env.DEBUG_API_ERRORS === '1'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's memberships
    const memberships = await serverDb.query.networkMembers.findMany({
      where: (members, { eq, and }) =>
        and(eq(members.userId, user.userId), eq(members.joinStatus, 'active')),
    })

    if (memberships.length === 0) {
      return NextResponse.json({ networks: [] })
    }

    const networkIds = memberships.map((m) => m.networkId)

    // Get networks
    const networks = await serverDb.query.networks.findMany({
      where: (networks, { inArray, isNull, and }) =>
        and(inArray(networks.id, networkIds), isNull(networks.archivedAt)),
    })

    // Combine with membership info
    const networksWithRole = networks.map((network) => {
      const membership = memberships.find((m) => m.networkId === network.id)
      return {
        ...network,
        myRole: membership?.role,
        myNickname: membership?.nickname,
      }
    })

    return NextResponse.json({ networks: networksWithRole })
  } catch (error) {
    console.error('Get networks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
