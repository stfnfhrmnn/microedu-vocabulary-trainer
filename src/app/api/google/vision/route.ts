import { NextRequest, NextResponse } from 'next/server'

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate'

/**
 * Server-side proxy for Google Cloud Vision API
 * Keeps API key secure on the server
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google API not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()

    // Validate request structure
    if (!body.image?.content) {
      return NextResponse.json(
        { error: 'Missing image content' },
        { status: 400 }
      )
    }

    // Forward request to Google Vision API
    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: body.image.content,
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message || response.statusText
      return NextResponse.json(
        { error: `Vision API error: ${errorMessage}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Vision proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
