/**
 * Network Members API Routes
 *
 * GET /api/networks/:id/members - List network members
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq, and } from 'drizzle-orm'

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
    const myMembership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, id), eq(members.userId, user.userId), eq(members.joinStatus, 'active')),
    })

    if (!myMembership) {
      return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
    }

    // Get all active members
    const members = await serverDb.query.networkMembers.findMany({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, id), eq(members.joinStatus, 'active')),
    })

    // Get user details for each member
    const userIds = members.map((m) => m.userId)
    const users = await serverDb.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, userIds),
      columns: {
        id: true,
        name: true,
        avatar: true,
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    // Check for blocked users
    const myBlocks = await serverDb.query.userBlocks.findMany({
      where: (blocks, { eq }) => eq(blocks.blockerId, user.userId),
    })
    const blockedByMe = new Set(myBlocks.map((b) => b.blockedId))

    const blocksAgainstMe = await serverDb.query.userBlocks.findMany({
      where: (blocks, { eq }) => eq(blocks.blockedId, user.userId),
    })
    const blockedMe = new Set(blocksAgainstMe.map((b) => b.blockerId))

    // Build member list, filtering out blocked users
    const memberList = members
      .filter((m) => !blockedByMe.has(m.userId) && !blockedMe.has(m.userId))
      .map((m) => {
        const userInfo = userMap.get(m.userId)
        return {
          id: m.id,
          userId: m.userId,
          role: m.role,
          nickname: m.nickname || userInfo?.name || 'Anonym',
          avatar: userInfo?.avatar || '👤',
          visibility: m.visibility,
          joinedAt: m.joinedAt,
          isMe: m.userId === user.userId,
        }
      })

    // Separate into kids (competitors) and supporters (parents/teachers)
    const competitors = memberList.filter((m) => m.role === 'child')
    const supporters = memberList.filter((m) => m.role !== 'child')

    return NextResponse.json({
      members: memberList,
      competitors,
      supporters,
      total: memberList.length,
    })
  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
