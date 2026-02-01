/**
 * Individual Network API Routes
 *
 * GET /api/networks/:id - Get network details
 * PATCH /api/networks/:id - Update network settings
 * DELETE /api/networks/:id - Archive network
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const UpdateNetworkSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z.object({
    allowChildInvites: z.boolean().optional(),
    leaderboardVisible: z.boolean().optional(),
    parentsSeeAllProgress: z.boolean().optional(),
  }).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check membership
    const membership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(
          eq(members.networkId, id),
          eq(members.userId, user.userId),
          eq(members.joinStatus, 'active')
        ),
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
    }

    // Get network
    const network = await serverDb.query.networks.findFirst({
      where: (networks, { eq }) => eq(networks.id, id),
    })

    if (!network) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 })
    }

    // Get active members
    const members = await serverDb.query.networkMembers.findMany({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, id), eq(members.joinStatus, 'active')),
    })

    const userIds = members.map((member) => member.userId)
    const users = userIds.length
      ? await serverDb.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, userIds),
          columns: { id: true, name: true, avatar: true },
        })
      : []

    const userMap = new Map(users.map((u) => [u.id, u]))

    const myBlocks = await serverDb.query.userBlocks.findMany({
      where: (blocks, { eq }) => eq(blocks.blockerId, user.userId),
    })
    const blockedByMe = new Set(myBlocks.map((b) => b.blockedId))

    const blocksAgainstMe = await serverDb.query.userBlocks.findMany({
      where: (blocks, { eq }) => eq(blocks.blockedId, user.userId),
    })
    const blockedMe = new Set(blocksAgainstMe.map((b) => b.blockerId))

    const memberList = members
      .filter((member) => !blockedByMe.has(member.userId) && !blockedMe.has(member.userId))
      .map((member) => {
        const userInfo = userMap.get(member.userId)
        return {
          userId: member.userId,
          role: member.role,
          nickname: member.nickname || userInfo?.name || 'Anonym',
          avatar: userInfo?.avatar || '👤',
        }
      })

    const sharedBooksCount = await serverDb.query.networkSharedBooks
      .findMany({
        where: (shared, { eq }) => eq(shared.networkId, id),
        columns: { id: true },
      })
      .then((rows) => rows.length)

    return NextResponse.json({
      network: {
        ...network,
        memberCount: members.length,
        myRole: membership.role,
        myNickname: membership.nickname,
        members: memberList,
        sharedBooksCount,
      },
    })
  } catch (error) {
    console.error('Get network error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const updates = UpdateNetworkSchema.parse(body)

    // Check admin permission
    const membership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, id), eq(members.userId, user.userId)),
    })

    if (!membership || !['admin', 'teacher'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only admins can update network settings' }, { status: 403 })
    }

    // Update network
    const [updated] = await serverDb
      .update(schema.networks)
      .set(updates)
      .where(eq(schema.networks.id, id))
      .returning()

    return NextResponse.json({ success: true, network: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Update network error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check owner
    const network = await serverDb.query.networks.findFirst({
      where: (networks, { eq }) => eq(networks.id, id),
    })

    if (!network) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 })
    }

    if (network.ownerId !== user.userId) {
      return NextResponse.json({ error: 'Only the owner can archive the network' }, { status: 403 })
    }

    // Archive (soft delete)
    await serverDb
      .update(schema.networks)
      .set({ archivedAt: new Date() })
      .where(eq(schema.networks.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete network error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
