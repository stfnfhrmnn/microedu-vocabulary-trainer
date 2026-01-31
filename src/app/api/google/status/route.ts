import { NextResponse } from 'next/server'

/**
 * Check if Google API is configured on the server
 * Returns { available: boolean } without exposing the actual key
 */
export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY

  return NextResponse.json({
    available: !!apiKey,
  })
}
