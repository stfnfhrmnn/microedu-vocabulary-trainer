/**
 * User Blocks API Routes
 *
 * POST /api/blocks - Block a user
 * GET /api/blocks - List blocked users
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { z } from 'zod'

const BlockUserSchema = z.object({
  blockedId: z.string().uuid(),
  blockType: z.enum(['full', 'messages_only']).optional().default('full'),
})

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { blockedId, blockType } = BlockUserSchema.parse(body)

    // Can't block yourself
    if (blockedId === user.userId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Check if already blocked
    const existing = await serverDb.query.userBlocks.findFirst({
      where: (blocks, { eq, and }) =>
        and(eq(blocks.blockerId, user.userId), eq(blocks.blockedId, blockedId)),
    })

    if (existing) {
      return NextResponse.json({ error: 'User is already blocked' }, { status: 409 })
    }

    // Create block
    const [block] = await serverDb
      .insert(schema.userBlocks)
      .values({
        blockerId: user.userId,
        blockedId,
        blockType,
      })
      .returning()

    return NextResponse.json({ success: true, block })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Block user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get blocked users
    const blocks = await serverDb.query.userBlocks.findMany({
      where: (blocks, { eq }) => eq(blocks.blockerId, user.userId),
    })

    if (blocks.length === 0) {
      return NextResponse.json({ blocks: [] })
    }

    // Get user info for blocked users
    const blockedIds = blocks.map((b) => b.blockedId)
    const users = await serverDb.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, blockedIds),
      columns: { id: true, name: true, avatar: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    const result = blocks.map((block) => {
      const blockedUser = userMap.get(block.blockedId)
      return {
        id: block.id,
        blockedUser: {
          id: block.blockedId,
          name: blockedUser?.name || 'Anonym',
          avatar: blockedUser?.avatar || '👤',
        },
        blockType: block.blockType,
        createdAt: block.createdAt,
      }
    })

    return NextResponse.json({ blocks: result })
  } catch (error) {
    console.error('Get blocks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
