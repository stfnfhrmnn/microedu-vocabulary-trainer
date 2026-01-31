import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

// Require JWT_SECRET in production, allow fallback only in development
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
  }
  return new TextEncoder().encode(secret || 'development-secret-key-change-me')
}

const JWT_SECRET = getJwtSecret()

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
    .setExpirationTime('14d') // 14 days for mobile/PWA convenience (balanced with security)
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
