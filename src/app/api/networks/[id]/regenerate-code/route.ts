/**
 * Regenerate Invite Code API Route
 *
 * POST /api/networks/:id/regenerate-code - Generate new invite code
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq } from 'drizzle-orm'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: networkId } = await params

    // Check admin permission
    const membership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.userId, user.userId)),
    })

    if (!membership || !['admin', 'teacher'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only admins can regenerate invite codes' }, { status: 403 })
    }

    // Generate unique code
    let newCode = generateInviteCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await serverDb.query.networks.findFirst({
        where: (networks, { eq }) => eq(networks.inviteCode, newCode),
      })
      if (!existing) break
      newCode = generateInviteCode()
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 })
    }

    // Update network
    await serverDb
      .update(schema.networks)
      .set({ inviteCode: newCode })
      .where(eq(schema.networks.id, networkId))

    return NextResponse.json({ success: true, inviteCode: newCode })
  } catch (error) {
    console.error('Regenerate code error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
