/**
 * Join Network API Route
 *
 * POST /api/networks/join - Join a network via invite code (XXX-XXX format)
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { isValidNetworkInviteCode } from '@/lib/utils/user-id'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'

const JoinNetworkSchema = z.object({
  inviteCode: z.string().min(1).max(7),
  role: z.enum(['child', 'parent', 'teacher']),
  nickname: z.string().max(50).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { inviteCode, role, nickname } = JoinNetworkSchema.parse(body)

    // Normalize code (remove dashes, uppercase) - only accept XXX-XXX format (6 chars)
    const normalizedCode = inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (normalizedCode.length !== 6) {
      return NextResponse.json(
        { error: 'Ungültiges Code-Format. Bitte verwende das Format XXX-XXX.' },
        { status: 400 }
      )
    }

    const formattedCode = `${normalizedCode.slice(0, 3)}-${normalizedCode.slice(3)}`

    // Validate code format
    if (!isValidNetworkInviteCode(formattedCode)) {
      return NextResponse.json(
        { error: 'Ungültiges Code-Format. Bitte verwende das Format XXX-XXX.' },
        { status: 400 }
      )
    }

    // Find network by invite code
    const network = await serverDb.query.networks.findFirst({
      where: (networks, { eq, isNull, and }) =>
        and(eq(networks.inviteCode, formattedCode), isNull(networks.archivedAt)),
    })

    if (!network) {
      return NextResponse.json({ error: 'Ungültiger Einladungscode' }, { status: 404 })
    }

    // Check if already a member
    const existingMembership = await serverDb.query.networkMembers.findFirst({
      where: (members, { eq, and }) =>
        and(eq(members.networkId, network.id), eq(members.userId, user.userId)),
    })

    if (existingMembership) {
      if (existingMembership.joinStatus === 'active') {
        return NextResponse.json({ error: 'Du bist bereits Mitglied dieses Netzwerks' }, { status: 409 })
      }
      // Reactivate membership
      await serverDb
        .update(schema.networkMembers)
        .set({ joinStatus: 'active', role, nickname })
        .where(eq(schema.networkMembers.id, existingMembership.id))

      return NextResponse.json({
        success: true,
        network: {
          id: network.id,
          name: network.name,
          type: network.type,
        },
        membership: {
          id: existingMembership.id,
          role,
          nickname,
        },
      })
    }

    // Create membership
    const [membership] = await serverDb
      .insert(schema.networkMembers)
      .values({
        networkId: network.id,
        userId: user.userId,
        role,
        nickname,
        visibility: 'visible',
        joinStatus: 'active',
      })
      .returning()

    return NextResponse.json({
      success: true,
      network: {
        id: network.id,
        name: network.name,
        type: network.type,
      },
      membership: {
        id: membership.id,
        role: membership.role,
        nickname: membership.nickname,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Join network error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
