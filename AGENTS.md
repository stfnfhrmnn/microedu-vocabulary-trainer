# AGENTS.md - Vocabulary Trainer Project

## Project Overview

This is a vocabulary learning application designed for a 12-year-old student at a German Gymnasium learning their second foreign language. The application helps track, practice, and master vocabulary from school textbooks.

## Target User

- **Primary user**: 12-year-old student
- **School type**: Gymnasium in Hamburg, Germany
- **Use case**: Learning second foreign language vocabulary (typically French, Spanish, or Latin)

## Core Principles

### Simplicity First
- The UI must be intuitive enough for a 12-year-old to use without parental assistance
- Keep interactions minimal and focused
- Avoid overwhelming with options

### Mobile-First Design
- Primary interaction will be via mobile phone (for photo capture of textbook pages)
- All features must work well on mobile devices
- Consider PWA for cross-platform compatibility without app store hassles

### Pedagogically Sound
- Follow spaced repetition principles for effective learning
- Track learning progress per vocabulary item
- Allow focus on specific textbook sections for targeted studying

### Privacy-Conscious
- This is a child's learning data - handle with care
- Prefer local-first storage where possible
- Minimize data sent to external services

### Offline-First
- App MUST work fully offline after initial load
- All vocabulary data stored locally in IndexedDB
- Learning sessions work without network connectivity
- OCR can fall back to client-side processing (Tesseract.js)
- Cloud sync is optional enhancement, never required

## Tech Stack Guidance

### Recommended Stack
- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express or Next.js API routes
- **Database**: SQLite for simplicity (local-first) or PostgreSQL for cloud deployment
- **OCR**: Google Cloud Vision API or Tesseract.js for vocabulary extraction from photos
- **Deployment**: Vercel or Railway for simple deployment

### Code Style
- TypeScript strict mode enabled
- Functional components with React hooks
- Use Zod for runtime validation
- Keep components small and focused
- Write tests for business logic (spaced repetition algorithm, vocabulary matching)

## Project Structure

```
/
├── apps/
│   └── web/                 # Main web application (Next.js)
│       ├── app/             # Next.js app router
│       ├── components/      # React components
│       └── lib/             # Shared utilities
├── packages/
│   ├── core/                # Core business logic
│   │   ├── vocabulary/      # Vocabulary management
│   │   ├── learning/        # Spaced repetition, exercises
│   │   └── ingestion/       # OCR orchestration and text processing
│   │       ├── ocr-provider.ts      # OCR provider interface
│   │       ├── tesseract-provider.ts # Tesseract.js (offline)
│   │       ├── gemini-provider.ts    # Google Gemini
│   │       ├── vision-provider.ts    # Google Cloud Vision
│   │       └── openai-provider.ts    # OpenAI GPT-4 Vision
│   └── database/            # Database schema and queries
├── docs/                    # Documentation
└── tests/                   # Integration tests
```

## Key Domain Concepts

### Vocabulary Item
A single word or phrase to learn, consisting of:
- Source language text (German)
- Target language text (foreign language)
- Optional: pronunciation, example sentence, grammatical info
- Metadata: book, chapter, section, page number, date added

### Learning Progress
Per vocabulary item per user:
- Familiarity level (0-5 scale, similar to Anki)
- Last review date
- Next review date (calculated via spaced repetition)
- Number of correct/incorrect attempts

### Textbook Source
Metadata about where vocabulary comes from:
- Book title and edition
- Chapter/Unit number
- Section/Lesson within chapter
- Page range

### Exercise Types (MVP)
1. **Flashcard**: Show one side, reveal other
2. **Multiple Choice**: Pick correct translation from options
3. **Type Answer**: Type the translation (with fuzzy matching for typos)

## Development Guidelines

### When Adding Features
1. Always consider the 12-year-old user - would they understand this?
2. Keep the learning flow uninterrupted
3. Celebrate successes, be encouraging on mistakes
4. Test on mobile devices

### When Working with OCR/Ingestion
1. Textbook formats vary - build for flexibility
2. Always allow manual correction of OCR results
3. Save original images for debugging/reprocessing
4. Handle multiple columns, vocabulary boxes, etc.
5. **Use pluggable provider pattern** - all OCR providers implement `OCRProvider` interface
6. Default to offline-capable Tesseract.js; cloud providers are optional upgrades
7. Never hard-code a specific provider - use dependency injection

### When Working with Learning Algorithm
1. Start simple (Leitner system or SM-2)
2. Make algorithm parameters configurable for tuning
3. Log learning sessions for analysis
4. Never lose learning progress data

## MVP Scope

The MVP focuses exclusively on:
1. Manual vocabulary entry (with photo-assisted OCR as stretch goal)
2. Basic flashcard practice
3. Progress tracking
4. Section-based filtering

NOT in MVP:
- Listening exercises
- Speaking exercises
- Multi-user/family features
- Gamification beyond basic progress
- Social features

## Commands for Development

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run db:studio    # Open database GUI
```

## External Services

### OCR (for vocabulary ingestion)
The OCR system uses a **pluggable provider architecture** to support multiple backends:

| Provider | Type | Pros | Cons |
|----------|------|------|------|
| Tesseract.js | Client-side | Free, offline, no API keys | Lower accuracy, larger bundle |
| Google Gemini | Cloud API | Excellent accuracy, understands context, can extract structured vocab | Requires API key, needs internet |
| Google Cloud Vision | Cloud API | High accuracy, multi-language | Cost per request, needs internet |
| OpenAI GPT-4 Vision | Cloud API | Context-aware extraction | Higher cost, needs internet |

**Strategy**:
- Default to Tesseract.js (works offline, free)
- Allow user to configure cloud provider for better accuracy
- Cloud providers accessed via pluggable adapter pattern
- All providers implement same `OCRProvider` interface

### Text-to-Speech (future)
- Web Speech API (free, built into browsers)
- Google Cloud Text-to-Speech (higher quality)

## Testing Strategy

- Unit tests for spaced repetition algorithm
- Unit tests for vocabulary matching/fuzzy search
- Integration tests for OCR pipeline
- E2E tests for critical user flows (add vocab, practice session)
- Manual testing on actual textbook photos

## Security Considerations

- No authentication required for MVP (single-user, local device)
- If adding cloud sync: use proper auth, encrypt data at rest
- OCR images may contain copyrighted textbook content - don't store longer than necessary
- Follow GDPR guidelines (German user, child's data)
