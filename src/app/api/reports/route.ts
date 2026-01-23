/**
 * Content Reports API Routes
 *
 * POST /api/reports - Report content or user
 */

import { NextResponse } from 'next/server'
import { serverDb, schema } from '@/lib/db/postgres'
import { getUserFromRequest } from '@/lib/auth/jwt'
import { z } from 'zod'

const ReportContentSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  reportedBookId: z.string().uuid().optional(),
  networkId: z.string().uuid().optional(),
  reportType: z.enum(['inappropriate_content', 'spam', 'harassment', 'other']),
  description: z.string().max(1000).optional(),
}).refine(
  (data) => data.reportedUserId || data.reportedBookId,
  { message: 'Must report either a user or a book' }
)

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = ReportContentSchema.parse(body)

    // Can't report yourself
    if (data.reportedUserId === user.userId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
    }

    // If reporting in a network context, verify membership
    if (data.networkId) {
      const membership = await serverDb.query.networkMembers.findFirst({
        where: (members, { eq, and }) =>
          and(eq(members.networkId, data.networkId!), eq(members.userId, user.userId)),
      })

      if (!membership) {
        return NextResponse.json({ error: 'Not a member of this network' }, { status: 403 })
      }
    }

    // Create report
    const [report] = await serverDb
      .insert(schema.contentReports)
      .values({
        reporterId: user.userId,
        reportedUserId: data.reportedUserId,
        reportedBookId: data.reportedBookId,
        networkId: data.networkId,
        reportType: data.reportType,
        description: data.description,
        status: 'pending',
      })
      .returning()

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        createdAt: report.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Report content error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
