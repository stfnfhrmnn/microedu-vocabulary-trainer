import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Support both Gemini models
const GEMINI_MODELS = {
  'gemini-1.5-flash': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  'gemini-2.0-flash': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
} as const

const GeminiRequestSchema = z.object({
  model: z.enum(['gemini-1.5-flash', 'gemini-2.0-flash']).optional().default('gemini-1.5-flash'),
  contents: z.array(z.object({
    role: z.string().optional(),
    parts: z.array(z.object({
      text: z.string(),
    })),
  })),
  systemInstruction: z.object({
    parts: z.array(z.object({
      text: z.string(),
    })),
  }).optional(),
  generationConfig: z.object({
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    maxOutputTokens: z.number().min(1).max(8192).optional(),
  }).optional(),
})

/**
 * Server-side proxy for Google Generative Language API (Gemini)
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
    const parseResult = GeminiRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { model, contents, systemInstruction, generationConfig } = parseResult.data
    const apiUrl = GEMINI_MODELS[model]

    // Build request body
    const requestBody: Record<string, unknown> = {
      contents,
    }

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction
    }

    if (generationConfig) {
      requestBody.generationConfig = generationConfig
    }

    // Forward request to Gemini API
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    console.error('Gemini proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
