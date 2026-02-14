# AGENTS.md - Vocabulary Trainer Project

## Project Overview

A Progressive Web App (PWA) for vocabulary learning, designed primarily for students at German Gymnasien learning their second foreign language. The app is offline-first, uses spaced repetition (SM-2), supports voice-based practice with AI analysis, and includes social/competitive features through networks (family, class, study group).

## Target Users

- **Primary**: 12-year-old student at a Gymnasium in Hamburg, Germany
- **Secondary**: Parents wanting to track their child's learning progress
- **Tertiary**: Teachers managing classroom vocabulary assignments

## Core Principles

### Simplicity First
- UI must be intuitive enough for a 12-year-old without parental assistance
- Keep interactions minimal and focused
- Avoid overwhelming with options

### Mobile-First PWA
- Primary interaction via mobile phone (photo capture, voice practice)
- All features must work well on mobile devices
- Installable as PWA — no app store required

### Offline-First
- App MUST work fully offline after initial load
- All vocabulary data stored locally in IndexedDB (Dexie)
- Learning sessions work without network connectivity
- OCR falls back to client-side Tesseract.js when offline
- Cloud sync is an optional enhancement, never required

### Pedagogically Sound
- SM-2 spaced repetition for effective long-term retention
- Multiple practice modes (flashcard, multiple choice, typed, voice)
- Gamification (XP, streaks, achievements) to sustain motivation

### Privacy-Conscious
- This is a child's learning data — handle with care
- Local-first storage; cloud sync is opt-in
- Minimize data sent to external services
- GDPR compliance required (German minor)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **UI** | React 19, TypeScript 5.7, Tailwind CSS 3.4 |
| **Animations** | Framer Motion 12 |
| **Component variants** | class-variance-authority (CVA) |
| **State management** | Zustand 5 (persisted stores) |
| **Client database** | Dexie 4 (IndexedDB) |
| **Server database** | PostgreSQL via Neon (serverless) |
| **ORM** | Drizzle ORM 0.38 |
| **Validation** | Zod 3.24 |
| **Auth** | JWT via jose (HS256, 14-day expiry) |
| **i18n** | next-intl 4.8 (German + English) |
| **PWA** | Serwist 9.5 (service worker) |
| **Icons** | lucide-react |
| **OCR** | Tesseract.js (offline) + Google Cloud Vision (optional) |
| **TTS** | Web Speech API + Google Cloud TTS (optional) |
| **AI** | Google Gemini API (voice analysis, OCR) |
| **Testing** | Vitest 3 (unit/integration), Playwright 1.50 (E2E) |
| **Deployment** | Vercel (serverless) |

### Code Style
- TypeScript strict mode enabled
- Functional components with React hooks
- Zod for runtime validation on all API inputs
- No semicolons, single quotes, 2-space indent, 100-char line width (Prettier)
- Path alias: `@/` maps to `src/`

## Project Structure

```
/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (i18n, providers, fonts)
│   │   ├── page.tsx                # Home / dashboard
│   │   ├── achievements/           # Achievements page
│   │   ├── add/                    # Add vocabulary (manual)
│   │   │   └── scan/               # OCR photo scanning
│   │   ├── library/                # Book library
│   │   │   └── [...slug]/          # Dynamic book/chapter/section navigation
│   │   ├── login/                  # Code-based login
│   │   ├── networks/               # Network list
│   │   │   └── [id]/               # Individual network detail
│   │   ├── onboarding/             # First-time setup wizard
│   │   ├── practice/               # Practice mode selection
│   │   │   ├── group/              # Group voice session
│   │   │   ├── parent-quiz/        # Screen-free parent quiz mode
│   │   │   ├── session/            # Active practice session
│   │   │   ├── summary/            # Session results
│   │   │   └── voice/              # Voice practice
│   │   ├── progress/               # Learning statistics
│   │   ├── settings/               # User preferences
│   │   ├── transfer/               # Device-to-device account transfer
│   │   └── api/                    # API routes (REST)
│   │       ├── auth/               # Register, login, device transfer
│   │       ├── sync/               # Push, pull, full sync
│   │       ├── networks/           # Network CRUD, members, leaderboard
│   │       ├── shared-books/       # Book sharing
│   │       ├── stats/              # Competition stats submission
│   │       ├── blocks/             # User blocking
│   │       ├── reports/            # Content reporting
│   │       ├── deletion-requests/  # Protected content deletion
│   │       ├── google/             # Proxy for Google Cloud APIs (TTS, Vision, Gemini)
│   │       └── users/              # User lookup
│   │
│   ├── components/                 # React components (feature-organized)
│   │   ├── ui/                     # Reusable primitives (Button, Input, Modal, Card, etc.)
│   │   ├── layout/                 # Header, BottomNav, PageContainer
│   │   ├── practice/               # FlashCard, MultipleChoice, TypedAnswer, VoiceSession
│   │   ├── library/                # Book browser, vocabulary lists
│   │   ├── network/                # Network creation, joining, member management
│   │   ├── competition/            # Leaderboard displays
│   │   ├── gamification/           # XP, levels, streaks, achievements UI
│   │   ├── onboarding/             # Profile setup, welcome slides
│   │   ├── ocr/                    # Photo scanning interface
│   │   ├── profile/                # User settings, code awareness
│   │   ├── safety/                 # Blocking, reporting UIs
│   │   ├── sharing/                # Book sharing controls
│   │   ├── progress/               # Statistics views
│   │   ├── recommendations/        # Study suggestions
│   │   ├── vocabulary/             # Vocabulary item displays
│   │   ├── feedback/               # Toast, offline banner
│   │   ├── error/                  # Error boundaries
│   │   ├── migration/              # Device transfer UI
│   │   ├── providers/              # Context providers (sync, global)
│   │   ├── user/                   # User identity UI
│   │   └── widgets/                # Reusable widget components
│   │
│   ├── stores/                     # Zustand state stores
│   │   ├── user-session.ts         # User profiles, auth state
│   │   ├── practice-session.ts     # Active practice session
│   │   ├── voice-session.ts        # Voice practice state
│   │   ├── group-voice-session.ts  # Multi-user voice sessions
│   │   ├── gamification.ts         # XP, levels, streaks
│   │   ├── achievements.ts         # Badge/achievement state
│   │   ├── competition.ts          # Leaderboard data
│   │   ├── settings.ts             # User preferences
│   │   ├── network.ts              # Current network context
│   │   ├── sync.ts                 # Sync status
│   │   ├── onboarding.ts           # First-time user flow
│   │   └── toast.ts                # Notification queue
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── usePractice.ts          # Main practice logic
│   │   ├── useAsyncAction.ts       # Generic async with loading/error/toast
│   │   ├── useTTS.ts               # Text-to-speech
│   │   ├── useSpeechRecognition.ts # Voice input
│   │   ├── useOCR.ts               # Image processing
│   │   ├── useCamera.ts            # Camera access
│   │   ├── useNetwork.ts           # Network operations
│   │   ├── useFamilySharing.ts     # Family network features
│   │   ├── useCompetitionSync.ts   # Leaderboard sync
│   │   ├── useOnline.ts            # Connectivity detection
│   │   ├── useSound.ts             # Audio playback
│   │   ├── useHaptics.ts           # Vibration feedback
│   │   ├── useReducedMotion.ts     # Motion preference
│   │   ├── useAnalytics.ts         # Event tracking
│   │   ├── useGoogleApiStatus.ts   # Google API availability
│   │   ├── useImageProcessing.ts   # Image optimization
│   │   └── useStudyRecommendations.ts
│   │
│   ├── lib/                        # Core business logic & utilities
│   │   ├── db/
│   │   │   ├── db.ts               # Dexie database class + CRUD operations
│   │   │   ├── schema.ts           # TypeScript types + Zod validation schemas
│   │   │   ├── server-schema.ts    # Drizzle ORM server schema (PostgreSQL)
│   │   │   └── postgres.ts         # Neon database connection
│   │   ├── sync/
│   │   │   ├── sync-service.ts     # Push/pull/full sync orchestration
│   │   │   ├── sync-queue.ts       # Change queue (IndexedDB)
│   │   │   ├── apply-changes.ts    # Apply server changes to local DB
│   │   │   └── useSync.ts          # Sync React hook
│   │   ├── learning/
│   │   │   ├── sm2.ts              # SM-2 spaced repetition algorithm
│   │   │   ├── fuzzy-match.ts      # Levenshtein-based answer matching
│   │   │   ├── phonetic-match.ts   # Phonetic similarity
│   │   │   ├── answer-extractor.ts # Parse answers from voice input
│   │   │   └── study-recommendations.ts
│   │   ├── services/
│   │   │   ├── network-service.ts  # Network CRUD, leaderboards
│   │   │   ├── family-sharing.ts   # Family network features
│   │   │   ├── voice-tutor.ts      # Voice practice orchestration
│   │   │   ├── voice-analyzer.ts   # AI-powered answer analysis
│   │   │   ├── group-conversation.ts
│   │   │   ├── unified-tts.ts      # TTS provider abstraction
│   │   │   ├── google-tts.ts       # Google Cloud TTS
│   │   │   ├── text-to-speech.ts   # Web Speech API TTS
│   │   │   ├── speech-recognition.ts
│   │   │   ├── content-protection.ts
│   │   │   ├── duplicate-detection.ts
│   │   │   ├── image-processing.ts
│   │   │   └── analytics.ts
│   │   ├── gamification/
│   │   │   ├── xp.ts               # XP calculation + levels
│   │   │   └── achievements.ts     # Achievement definitions + checking
│   │   ├── ocr/
│   │   │   ├── ocr-service.ts      # OCR provider orchestration
│   │   │   ├── parser.ts           # Text → vocabulary candidate parsing
│   │   │   ├── name-extractor.ts
│   │   │   └── types.ts
│   │   ├── auth/
│   │   │   └── jwt.ts              # JWT sign/verify (jose)
│   │   ├── api/
│   │   │   ├── csrf.ts             # CSRF/CORS protection middleware
│   │   │   ├── rate-limit.ts       # Rate limiting
│   │   │   └── pagination.ts
│   │   ├── audio/
│   │   │   └── sounds.ts           # Sound effects
│   │   ├── haptics/
│   │   │   └── haptics.ts          # Vibration API wrapper
│   │   └── utils/
│   │       ├── cn.ts               # Tailwind class merge (clsx + twMerge)
│   │       ├── id.ts               # UUID generation
│   │       ├── user-id.ts          # XXXX-XXXX user code generation
│   │       ├── messages.ts         # Encouraging feedback messages
│   │       ├── language-codes.ts   # ISO language code mappings
│   │       ├── accent-helpers.ts   # Diacritic processing
│   │       ├── date.ts             # Date formatting
│   │       └── validation.ts       # Shared validation helpers
│   │
│   ├── i18n/                       # Internationalization config
│   └── styles/
│       └── globals.css             # Tailwind directives, safe areas, animations
│
├── messages/                       # i18n translation files
│   ├── de.json                     # German (default)
│   └── en.json                     # English
│
├── drizzle/                        # Generated database migrations (SQL)
├── tests/
│   ├── setup.ts                    # Global test setup (mocks)
│   ├── unit/                       # Vitest unit tests
│   ├── integration/                # Vitest integration tests
│   └── e2e/                        # Playwright E2E tests
│
├── scripts/
│   └── db-migrate.js               # Migration runner for deployments
│
├── docs/                           # Documentation
│   ├── REQUIREMENTS_AND_ARCHITECTURE.md
│   ├── PROJECT_LESSONS.md
│   ├── UX-UI-IMPROVEMENT-PLAN.md
│   └── GOOGLE_CLOUD_SETUP.md
│
├── public/                         # Static assets (icons, manifest)
│
└── Config files:
    ├── package.json
    ├── tsconfig.json               # strict: true
    ├── next.config.js              # Security headers, PWA config
    ├── tailwind.config.js          # Custom theme (colors, touch targets)
    ├── drizzle.config.ts           # Drizzle ORM config
    ├── vitest.config.ts
    ├── playwright.config.ts        # Chromium, Mobile Chrome, Mobile Safari
    ├── postcss.config.js
    └── .prettierrc                 # No semi, single quotes, 100 width
```

## Key Domain Concepts

### Vocabulary Item
A single word or phrase to learn:
- Source text (German) and target text (foreign language)
- Optional: notes, hints (per-language), word type, gender, examples, conjugations, image
- Belongs to a book, optionally to a chapter and section

### Learning Progress (SM-2)
Per vocabulary item per user:
- `easeFactor` (default 2.5, min 1.3), `interval` (days), `repetitions` (consecutive correct)
- `nextReviewDate`, `totalReviews`, `correctReviews`, `lastReviewDate`

### Textbook Structure
Hierarchical: Book → Chapter → Section
- Books have a language and cover color
- Sections can be marked "covered in class"
- Vocabulary can be assigned at book, chapter, or section level

### Exercise Types
1. **Flashcard** — show one side, tap to reveal, self-rate
2. **Multiple Choice** — 4 options, instant feedback
3. **Typed Answer** — type translation, fuzzy matching with configurable strictness
4. **Voice Practice** — speak answer, AI analysis via Gemini
5. **Parent Quiz** — screen-free voice mode for parent-led practice
6. **Group Voice** — multi-user voice session

### Networks
Social groups for competition and sharing:
- Types: `family`, `class`, `study_group`
- Roles (per-network): `child`, `parent`, `teacher`, `admin`
- Features: leaderboards (daily/weekly/monthly/all-time), shared books, invite codes

### Data Sync
Offline-first with optional cloud sync:
- Local: Dexie (IndexedDB) is the source of truth
- Server: PostgreSQL (Neon) for cross-device sync and network features
- Changes queued locally, pushed/pulled in background
- Full sync available for new device setup

## Development Guidelines

### When Adding Features
1. Always consider the 12-year-old user — would they understand this?
2. Keep the learning flow uninterrupted
3. Celebrate successes, be encouraging on mistakes
4. Test on mobile devices (PWA)
5. Ensure offline functionality is preserved

### When Working with OCR/Ingestion
1. Textbook formats vary — build for flexibility
2. Always allow manual correction of OCR results
3. Use pluggable provider pattern — all providers implement `OCRProvider` interface
4. Default to offline-capable Tesseract.js; cloud providers are optional

### When Working with the Learning Algorithm
1. SM-2 is implemented — modify parameters, don't replace the algorithm
2. Never lose learning progress data
3. Test scheduling edge cases (long breaks, rapid reviews)

### When Working with Sync
1. Local database is the source of truth — server is secondary
2. All writes go to IndexedDB first, then queue for sync
3. Sync failures must not block the user
4. Test offline → online transitions

### When Working with the API
1. All inputs validated with Zod schemas (in `src/lib/db/schema.ts`)
2. All routes check JWT auth via `getUserFromRequest()`
3. CSRF protection on all state-changing requests
4. Return consistent JSON: `{ success, data }` or `{ error, details }`

## Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint (via Next.js)
npm run format           # Prettier auto-format

# Testing
npm test                 # Vitest unit/integration tests
npm run test:ui          # Vitest with browser UI
npm run test:e2e         # Playwright E2E tests

# Database
npm run db:generate      # Generate migrations from schema changes
npm run db:migrate       # Run pending migrations
npm run db:push          # Force push schema to DB (dev only)
npm run db:studio        # Open Drizzle Studio (visual DB explorer)

# Deployment
npm run vercel-build     # Vercel production build (runs migrations + next build)
```

## External Services

### Google Cloud APIs (optional, server-proxied)
All accessed through `/api/google/*` routes with server-side `GOOGLE_API_KEY`:
- **Cloud Text-to-Speech** — high-quality pronunciation
- **Cloud Vision** — OCR for vocabulary extraction
- **Gemini (Generative Language)** — AI-powered voice answer analysis, structured OCR

### Environment Variables
```
DATABASE_URL     # Neon PostgreSQL connection string
JWT_SECRET       # Secret for JWT signing (min 32 chars)
GOOGLE_API_KEY   # Google Cloud API key (optional, server-side only)
```

## Testing Strategy

- **Unit tests**: SM-2 algorithm, fuzzy matching, XP calculation, achievements, user ID generation, OCR parsing
- **Integration tests**: Database CRUD with cascade deletes, duplicate detection
- **E2E tests**: Family network flows (Playwright on Chromium + mobile viewports)
- Run `npm run build` after any substantial change to catch type errors early

## Security

- JWT auth with XXXX-XXXX user codes (no email/password)
- CSRF protection on all state-changing API requests
- Rate limiting on auth endpoints
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Drizzle ORM parameterized queries (no raw SQL)
- Soft deletes for learning data (never permanently lose progress)
- Content protection: tiered deletion confirmation based on review count
