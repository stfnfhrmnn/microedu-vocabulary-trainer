/**
 * Unblock User API Route
 *
 * DELETE /api/blocks/:blockedId - Unblock a user
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { eq } from 'drizzle-orm'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ blockedId: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { blockedId } = await params

    // Find the block
    const block = await serverDb.query.userBlocks.findFirst({
      where: (blocks, { eq, and }) =>
        and(eq(blocks.blockerId, user.userId), eq(blocks.blockedId, blockedId)),
    })

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    // Delete the block
    await serverDb
      .delete(schema.userBlocks)
      .where(eq(schema.userBlocks.id, block.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unblock user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
