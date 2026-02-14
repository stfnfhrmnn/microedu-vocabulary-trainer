/**
 * Network Members API Routes
 *
 * GET /api/networks/:id/members - List network members
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { parsePaginationParams, paginateArray } from '@/lib/api/pagination'
import { eq, and } from 'drizzle-orm'

let hasLoggedMissingUserBlocksTable = false

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
    let blockedByMe = new Set<string>()
    let blockedMe = new Set<string>()

    try {
      const myBlocks = await serverDb.query.userBlocks.findMany({
        where: (blocks, { eq }) => eq(blocks.blockerId, user.userId),
      })
      blockedByMe = new Set(myBlocks.map((b) => b.blockedId))

      const blocksAgainstMe = await serverDb.query.userBlocks.findMany({
        where: (blocks, { eq }) => eq(blocks.blockedId, user.userId),
      })
      blockedMe = new Set(blocksAgainstMe.map((b) => b.blockerId))
    } catch (blockError) {
      const maybeCode =
        typeof blockError === 'object' && blockError && 'code' in blockError
          ? String((blockError as { code?: unknown }).code)
          : null

      if (maybeCode === '42P01') {
        if (!hasLoggedMissingUserBlocksTable) {
          hasLoggedMissingUserBlocksTable = true
          console.warn('Skipping member block filtering: optional table "user_blocks" is missing.')
        }
      } else {
        console.warn('Skipping member block filtering:', blockError)
      }
    }

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

    // Apply pagination
    const url = new URL(request.url)
    const paginationParams = parsePaginationParams(url)
    const paginatedMembers = paginateArray(memberList, paginationParams)

    return NextResponse.json({
      members: paginatedMembers.data,
      competitors: competitors.slice(0, paginationParams.limit),
      supporters: supporters.slice(0, paginationParams.limit),
      total: memberList.length,
      pagination: paginatedMembers.pagination,
    })
  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
