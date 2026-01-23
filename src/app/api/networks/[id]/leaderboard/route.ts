/**
 * Leaderboard API Route
 *
 * GET /api/networks/:id/leaderboard - Get network leaderboard
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: networkId } = await params
    const url = new URL(request.url)
    const periodType = url.searchParams.get('period') || 'weekly'

    // Validate period type
    if (!['daily', 'weekly', 'monthly', 'all_time'].includes(periodType)) {
      return NextResponse.json({ error: 'Invalid period type' }, { status: 400 })
    }

    // Check membership
    const myMembership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.userId, user.userId), eq(members.joinStatus, 'active')),
    })

    if (!myMembership) {
      return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
    }

    // Get all active members
    const members = await serverDb.query.networkMembers.findMany({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.joinStatus, 'active')),
    })

    // Calculate period start
    const now = new Date()
    let periodStart: Date
    switch (periodType) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        periodStart = new Date(now.getFullYear(), now.getMonth(), diff)
        break
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'all_time':
        periodStart = new Date(0)
        break
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    }

    // Get stats for all members
    const userIds = members.map((m) => m.userId)
    const stats = await serverDb.query.competitionStats.findMany({
      where: (stats, { inArray, eq, and, gte }) =>
        and(
          inArray(stats.userId, userIds),
          eq(stats.periodType, periodType)
        ),
    })

    // Get user info
    const users = await serverDb.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, userIds),
      columns: {
        id: true,
        name: true,
        avatar: true,
      },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    // Check blocks
    const myBlocks = await serverDb.query.userBlocks.findMany({
      where: (blocks, { eq }) => eq(blocks.blockerId, user.userId),
    })
    const blockedByMe = new Set(myBlocks.map((b) => b.blockedId))

    const blocksAgainstMe = await serverDb.query.userBlocks.findMany({
      where: (blocks, { eq }) => eq(blocks.blockedId, user.userId),
    })
    const blockedMe = new Set(blocksAgainstMe.map((b) => b.blockerId))

    // Build leaderboard entries
    type LeaderboardEntry = {
      userId: string
      nickname: string
      avatar: string
      role: string
      xpEarned: number
      wordsReviewed: number
      wordsMastered: number
      accuracyPercentage: number
      streakDays: number
      rank: number
      isMe: boolean
    }

    const entries: LeaderboardEntry[] = members
      .filter((m) => m.visibility === 'visible' && !blockedByMe.has(m.userId) && !blockedMe.has(m.userId))
      .map((m) => {
        const userInfo = userMap.get(m.userId)
        const stat = stats.find((s) => s.userId === m.userId)
        return {
          userId: m.userId,
          nickname: m.nickname || userInfo?.name || 'Anonym',
          avatar: userInfo?.avatar || '👤',
          role: m.role,
          xpEarned: stat?.xpEarned || 0,
          wordsReviewed: stat?.wordsReviewed || 0,
          wordsMastered: stat?.wordsMastered || 0,
          accuracyPercentage: Number(stat?.accuracyPercentage) || 0,
          streakDays: stat?.streakDays || 0,
          rank: 0,
          isMe: m.userId === user.userId,
        }
      })

    // Sort by XP and assign ranks (only for kids)
    const kids = entries.filter((e) => e.role === 'child')
    const supporters = entries.filter((e) => e.role !== 'child')

    kids.sort((a, b) => b.xpEarned - a.xpEarned)
    kids.forEach((entry, index) => {
      entry.rank = index + 1
    })

    // Find user's rank
    const myEntry = kids.find((e) => e.isMe) || supporters.find((e) => e.isMe)

    return NextResponse.json({
      leaderboard: [...kids, ...supporters],
      competitors: kids,
      supporters,
      myRank: myEntry?.rank || null,
      period: periodType,
      periodStart: periodStart.toISOString(),
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
