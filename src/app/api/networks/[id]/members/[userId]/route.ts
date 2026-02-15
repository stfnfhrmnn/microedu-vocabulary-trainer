/**
 * Individual Member API Routes
 *
 * PATCH /api/networks/:id/members/:userId - Update member
 * DELETE /api/networks/:id/members/:userId - Leave/remove member
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const UpdateMemberSchema = z.object({
  role: z.enum(['child', 'parent', 'teacher', 'admin']).optional(),
  nickname: z.string().max(50).optional(),
  visibility: z.enum(['visible', 'hidden']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: networkId, userId: targetUserId } = await params
    const body = await request.json()
    const updates = UpdateMemberSchema.parse(body)

    // Get requester's membership
    const myMembership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.userId, user.userId)),
    })

    if (!myMembership) {
      return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
    }

    // Get target membership
    const targetMembership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.userId, targetUserId)),
    })

    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Permission check
    const isSelf = user.userId === targetUserId
    const isAdmin = ['admin', 'teacher'].includes(myMembership.role)

    // Self can update own nickname and visibility
    // Admins can update any member's role, nickname, visibility
    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to update this member' }, { status: 403 })
    }

    // Non-admins can't change roles
    if (updates.role && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 })
    }

    // Update member
    const [updated] = await serverDb
      .update(schema.networkMembers)
      .set(updates)
      .where(eq(schema.networkMembers.id, targetMembership.id))
      .returning()

    return NextResponse.json({ success: true, member: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: networkId, userId: targetUserId } = await params

    // Get requester's membership
    const myMembership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.userId, user.userId)),
    })

    if (!myMembership) {
      return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
    }

    // Get target membership
    const targetMembership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, networkId), eq(members.userId, targetUserId)),
    })

    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const isSelf = user.userId === targetUserId
    const isAdmin = ['admin', 'teacher'].includes(myMembership.role)

    // Can leave self, or admins can remove others
    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to remove this member' }, { status: 403 })
    }

    // Check if removing owner
    const network = await serverDb.query.networks.findFirst({
      where: (networks, { eq }) => eq(networks.id, networkId),
    })

    if (network?.ownerId === targetUserId && !isSelf) {
      return NextResponse.json({ error: 'Cannot remove the network owner' }, { status: 403 })
    }

    // Soft delete (set status to blocked) or hard delete
    await serverDb
      .delete(schema.networkMembers)
      .where(eq(schema.networkMembers.id, targetMembership.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
