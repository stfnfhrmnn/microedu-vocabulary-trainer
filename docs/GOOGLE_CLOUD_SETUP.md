# Google Cloud Setup Guide

This guide explains how to configure Google Cloud APIs for the Vocabulary Trainer app.

## Required APIs

The app uses three Google Cloud APIs:

| API | Purpose |
|-----|---------|
| **Cloud Text-to-Speech API** | High-quality voice output for vocabulary pronunciation |
| **Cloud Vision API** | OCR for scanning vocabulary from photos |
| **Generative Language API** | AI-powered answer analysis (Gemini) |

## Step-by-Step Setup

### 1. Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top of the page
4. Either:
   - Select an existing project, OR
   - Click "New Project", enter a name (e.g., "Vocabulary Trainer"), and click "Create"

### 2. Enable Billing (Required for APIs)

Most Google Cloud APIs require a billing account, even if usage stays within free tier limits.

1. Go to [Billing](https://console.cloud.google.com/billing)
2. Click "Link a billing account" or "Create account"
3. Follow the prompts to set up billing

> **Note:** All three APIs have generous free tiers. For typical educational use, you're unlikely to incur charges.

### 3. Enable the Required APIs

#### Option A: Quick Links (Recommended)

Click each link and click "Enable":

1. [Cloud Text-to-Speech API](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com)
2. [Cloud Vision API](https://console.cloud.google.com/apis/library/vision.googleapis.com)
3. [Generative Language API (Gemini)](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)

#### Option B: Manual Search

1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Search for and enable each API:
   - Search "Text-to-Speech" → Click "Cloud Text-to-Speech API" → Click "Enable"
   - Search "Vision" → Click "Cloud Vision API" → Click "Enable"
   - Search "Generative Language" → Click "Generative Language API" → Click "Enable"

### 4. Create an API Key

1. Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "+ CREATE CREDENTIALS" at the top
3. Select "API key"
4. Your new API key will be displayed - **copy it now**

### 5. (Recommended) Restrict Your API Key

For security, restrict what your API key can access:

1. Click on your newly created API key to edit it
2. Under "API restrictions":
   - Select "Restrict key"
   - Check the three APIs:
     - Cloud Text-to-Speech API
     - Cloud Vision API
     - Generative Language API
3. Under "Application restrictions" (optional):
   - For web apps: Select "HTTP referrers" and add your domain(s)
   - For development: You can leave it as "None" temporarily
4. Click "Save"

### 6. Configure the App

Add your API key to the app's environment:

#### For Local Development

Create or edit `.env.local` in the project root:

```bash
GOOGLE_API_KEY="your-api-key-here"
```

> **Security Note:** The key is stored server-side only and never exposed to the browser. All Google API calls are proxied through the server.

#### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - Name: `GOOGLE_API_KEY`
   - Value: Your API key
   - Environment: Production (and Preview if desired)

#### For Production (Other Hosts)

Set the environment variable `GOOGLE_API_KEY` according to your hosting platform's documentation.

## Free Tier Limits

As of 2024, approximate free tier limits:

| API | Free Tier |
|-----|-----------|
| Text-to-Speech | 1 million characters/month (WaveNet: 1M, Standard: 4M) |
| Cloud Vision | 1,000 units/month |
| Generative Language | Varies by model; check [AI Studio](https://aistudio.google.com/) |

For a classroom or family use case, these limits are typically sufficient.

## Troubleshooting

### "API key not valid" error
- Verify the key is copied correctly (no extra spaces)
- Check that all three APIs are enabled
- Ensure billing is set up on the project

### "Permission denied" error
- The API key may be restricted to different APIs
- Edit the key and verify the correct APIs are selected

### Features show "not available" in settings
- Restart the app after adding the environment variable
- For local development: restart the dev server (`npm run dev`)
- Verify `.env.local` is in the project root (not in `/src`)

## Security Notes

- Never commit your API key to version control
- The `.env.local` file is already in `.gitignore`
- For production, always use environment variables from your hosting platform
- Consider setting up API key restrictions to limit potential misuse
