import { NextResponse } from 'next/server'

/**
 * Check if Google API is configured on the server
 * Returns { available: boolean } without exposing the actual key
 */
export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_API_KEY
  const publicApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const url = new URL(request.url)
  const wantsDebug = url.searchParams.get('debug') === '1'
  const allowDebug = wantsDebug || process.env.NODE_ENV !== 'production'

  const available = !!apiKey || !!publicApiKey

  return NextResponse.json({
    available,
    ...(allowDebug
      ? {
          debug: {
            hasGoogleApiKey: !!apiKey,
            hasNextPublicGoogleApiKey: !!publicApiKey,
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
          },
        }
      : {}),
  })
}
