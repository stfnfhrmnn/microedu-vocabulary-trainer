# Setup Guide

This guide covers optional API configuration to unlock premium features in the Vocabulary Trainer.

---

## Quick Links

- [Google Cloud API Key](#google-cloud-api-key) — Enables better TTS, AI analysis, and OCR
- [Where to Enter API Keys](#where-to-enter-api-keys) — In-app settings location
- [Feature Comparison](#feature-comparison) — What works with/without API keys

---

## Google Cloud API Key

A single Google Cloud API key unlocks multiple premium features:

| Feature | Without API Key | With API Key |
|---------|-----------------|--------------|
| **Voice TTS** | Web Speech API (quality varies by browser) | Google Cloud WaveNet voices (high quality) |
| **Voice Analysis** | Rule-based matching | Gemini AI (understands natural speech) |
| **Photo OCR** | Tesseract.js (offline, slower) | Google Vision (faster, more accurate) |

### Getting a Google Cloud API Key

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create a project** (or select an existing one)
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it something like "Vocabulary Trainer"

3. **Enable the required APIs**

   Go to **APIs & Services → Library** and enable:

   | API | Used For |
   |-----|----------|
   | Cloud Text-to-Speech API | Voice practice TTS |
   | Generative Language API | AI answer analysis (Gemini) |
   | Cloud Vision API | Photo scanning (optional) |

4. **Create an API key**
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → API Key**
   - Copy the key

5. **(Recommended) Restrict the API key**
   - Click on the newly created key
   - Under "API restrictions", select "Restrict key"
   - Select only the APIs you enabled above
   - This prevents misuse if your key is exposed

### Free Tier Limits

Google Cloud has generous free tiers that cover typical family use:

| Service | Free Tier | Typical Usage (50 words/day) |
|---------|-----------|------------------------------|
| Text-to-Speech | 4 million chars/month | ~225K chars/month |
| Gemini API | Very generous | ~1,500 requests/month |
| Vision API | 1,000 requests/month | Only if using photo scan |

**You likely won't pay anything** for normal family use.

---

## Where to Enter API Keys

API keys are entered in the app's **Settings** page:

### Steps

1. **Open the app**
2. **Go to Settings** (tap the gear icon or find it in the menu)
3. **Scroll to "OCR (Foto-Scan)"**
4. **Select "Google Vision (Online)"** as the provider
5. **Enter your API key** in the field that appears

The same API key is automatically used for all Google services (TTS, Gemini, Vision).

### Enable Voice Features

After entering the API key:

1. **Scroll to "Sprachübung" (Voice Practice)**
2. **Set "Sprachausgabe (TTS)"** to "Google Cloud TTS (Bessere Qualität)"
3. **Toggle "KI-Analyse"** on for AI-powered answer detection

---

## Feature Comparison

### Voice Practice

| Aspect | Web Speech API (Free) | Google Cloud (API Key) |
|--------|----------------------|------------------------|
| Voice Quality | Depends on device/browser | Consistent, high-quality WaveNet |
| Languages | de, fr, es (if browser supports) | de-DE, fr-FR, es-ES with native voices |
| Offline | Partial (some browsers) | No (requires internet) |
| Cost | Free | Free tier covers typical use |

### Voice Analysis

| Aspect | Rule-Based (Free) | Gemini AI (API Key) |
|--------|-------------------|---------------------|
| Filler word handling | Keyword removal | Semantic understanding |
| Answer extraction | Pattern matching | Context-aware extraction |
| Typo tolerance | Levenshtein distance | Understands intent |
| Synonyms | Not supported | Recognized as correct |
| Example | "um I think le chien" → "le chien" | Same, but also understands "the dog in French" |

### Photo OCR

| Aspect | Tesseract (Free) | Google Vision (API Key) |
|--------|------------------|------------------------|
| Speed | Slower (runs in browser) | Fast (cloud processing) |
| Accuracy | Good for clear text | Better for handwriting, angles |
| Offline | Yes | No |
| Languages | Most European | 100+ languages |

---

## Troubleshooting

### "API key not working"

1. **Check the key is entered correctly** (no extra spaces)
2. **Verify the APIs are enabled** in Google Cloud Console
3. **Check API restrictions** — if restricted, ensure the right APIs are allowed
4. **Check billing** — some APIs require a billing account even for free tier

### "TTS sounds robotic"

- Make sure you selected **"Google Cloud TTS"** in voice settings
- The API key must be valid
- Falls back to Web Speech API if Google fails

### "AI analysis not working"

- Ensure **"KI-Analyse"** is toggled on in settings
- The **Generative Language API** must be enabled in Google Cloud
- Check browser console for error messages

---

## Environment Variables (Development)

For local development, you can also set keys via environment variables:

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key-here
```

However, the in-app settings take precedence and are stored locally on each device.

---

## Security Notes

- API keys are stored **locally on your device** (in browser storage)
- Keys are **never sent to our servers** — only to Google's APIs directly
- Consider **restricting your API key** in Google Cloud Console
- If using a shared/family device, be aware others might see the key in settings
