import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'

const TTSRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  languageCode: z.string(),
  voiceName: z.string(),
  speakingRate: z.number().min(0.25).max(4.0).optional().default(1.0),
  pitch: z.number().min(-20).max(20).optional().default(0),
  volumeGainDb: z.number().min(-96).max(16).optional().default(0),
})

/**
 * Server-side proxy for Google Cloud Text-to-Speech API
 * Keeps API key secure on the server
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google API not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()

    // Validate request
    const parseResult = TTSRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { text, languageCode, voiceName, speakingRate, pitch, volumeGainDb } = parseResult.data

    // Forward request to Google TTS API
    const response = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch,
          volumeGainDb,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('TTS proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
