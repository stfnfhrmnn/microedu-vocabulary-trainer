import { NextRequest, NextResponse } from 'next/server'

/**
 * CSRF protection for API routes
 * Validates that the request origin matches the allowed origins
 */

const allowedOrigins = new Set<string>()

// Build allowed origins from environment
function getOriginPattern(): RegExp | null {
  const vercelUrl = process.env.VERCEL_URL
  const nodeEnv = process.env.NODE_ENV

  // In development, allow localhost
  if (nodeEnv === 'development') {
    allowedOrigins.add('http://localhost:3000')
    allowedOrigins.add('http://127.0.0.1:3000')
  }

  // Allow Vercel preview deployments
  if (vercelUrl) {
    allowedOrigins.add(`https://${vercelUrl}`)
  }

  // Add explicit allowed origin if configured
  const explicitOrigin = process.env.ALLOWED_ORIGIN
  if (explicitOrigin) {
    allowedOrigins.add(explicitOrigin)
  }

  // Return pattern for Vercel preview URLs
  return /^https:\/\/[\w-]+\.vercel\.app$/
}

const vercelPattern = getOriginPattern()

export function isValidOrigin(origin: string | null): boolean {
  if (!origin) {
    // No origin header - could be same-origin request or non-browser client
    // Be permissive here, other checks will validate
    return true
  }

  // Check explicit allowed list
  if (allowedOrigins.has(origin)) {
    return true
  }

  // Check Vercel preview pattern
  if (vercelPattern && vercelPattern.test(origin)) {
    return true
  }

  return false
}

/**
 * Validates CSRF for state-changing requests
 * Returns error response if invalid, null if valid
 */
export function validateCSRF(request: NextRequest): NextResponse | null {
  // Only check POST, PUT, DELETE, PATCH requests
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return null
  }

  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Validate origin
  if (!isValidOrigin(origin)) {
    console.warn(`CSRF: Invalid origin: ${origin}`)
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    )
  }

  // If we have a referer, validate it too
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      if (!isValidOrigin(refererOrigin)) {
        console.warn(`CSRF: Invalid referer: ${referer}`)
        return NextResponse.json(
          { error: 'Invalid request referer' },
          { status: 403 }
        )
      }
    } catch {
      // Invalid referer URL
      console.warn(`CSRF: Malformed referer: ${referer}`)
      return NextResponse.json(
        { error: 'Invalid request referer' },
        { status: 403 }
      )
    }
  }

  return null
}
