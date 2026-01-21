import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'development-secret-key-change-me')

export interface TokenPayload extends JWTPayload {
  userId: string
  userCode: string
}

/**
 * Sign a JWT token for a user
 */
export async function signToken(payload: { userId: string; userCode: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Long-lived for mobile/PWA convenience
    .sign(JWT_SECRET)
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as TokenPayload
  } catch {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

/**
 * Helper to get user from request headers
 */
export async function getUserFromRequest(request: Request): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('Authorization')
  const token = extractToken(authHeader)
  if (!token) return null
  return verifyToken(token)
}
