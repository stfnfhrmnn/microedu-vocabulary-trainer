# Vocabulary Trainer - Requirements, Specifications & Architecture

## Table of Contents

1. [Project Vision](#project-vision)
2. [User Stories](#user-stories)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [Data Model](#data-model)
6. [System Architecture](#system-architecture)
7. [User Interface Design](#user-interface-design)
8. [Technical Specifications](#technical-specifications)
9. [Implementation Phases](#implementation-phases)
10. [Risk Analysis](#risk-analysis)

---

## Project Vision

### Problem Statement

Students learning foreign languages need to memorize vocabulary from their school textbooks. Current solutions either:
- Don't align with the specific textbook being used
- Don't allow focusing on specific chapters/sections
- Require tedious manual entry of all vocabulary
- Are designed for adults, not children

### Solution

A mobile-friendly vocabulary learning app that:
1. Allows easy ingestion of vocabulary from textbook photos
2. Tracks exactly which sections have been covered in class
3. Uses proven learning techniques (spaced repetition)
4. Is simple enough for a 12-year-old to use independently

### Success Metrics

- Student can add new vocabulary in under 2 minutes per page
- 80%+ vocabulary retention after spaced practice
- Student uses the app voluntarily (indicates good UX)
- Covers all vocabulary from school by end of school year

---

## User Stories

### Epic 1: Vocabulary Ingestion

#### US-1.1: Manual Vocabulary Entry
> As a student, I want to manually add vocabulary words so that I can build my learning list.

**Acceptance Criteria:**
- Can enter source word (German) and target word (foreign language)
- Can assign vocabulary to a textbook section
- Can add multiple words in sequence without returning to home
- Input is validated (not empty, reasonable length)

#### US-1.2: Photo-Based Vocabulary Import
> As a student, I want to take a photo of my textbook page so that vocabulary is automatically extracted.

**Acceptance Criteria:**
- Can take photo directly in app or select from gallery
- OCR extracts text from image
- App presents extracted vocabulary for review/correction
- Student confirms or edits each word pair before saving
- Original photo is stored for reference

#### US-1.3: Section Management
> As a student, I want to organize vocabulary by textbook section so that I can focus my studying.

**Acceptance Criteria:**
- Can create textbook structure (book → chapter → section)
- Can assign vocabulary to specific sections
- Can see how many words are in each section
- Can mark sections as "covered in class"

### Epic 2: Learning/Practice

#### US-2.1: Flashcard Practice
> As a student, I want to practice vocabulary with flashcards so that I can memorize the words.

**Acceptance Criteria:**
- Shows word in one language, tap to reveal translation
- Can mark as "knew it" or "didn't know it"
- Progress affects future scheduling (spaced repetition)
- Can practice in either direction (German→Foreign or Foreign→German)

#### US-2.2: Focused Practice
> As a student, I want to practice only specific sections so that I can prepare for upcoming tests.

**Acceptance Criteria:**
- Can select one or more sections to practice
- Can choose to practice "due" words or all words
- Can practice only "difficult" words (frequently wrong)

#### US-2.3: Multiple Choice Quiz
> As a student, I want to take multiple choice quizzes so that I have variety in practice.

**Acceptance Criteria:**
- Shows word with 4 translation options
- One correct answer, three plausible distractors
- Immediate feedback on answer
- Tracks correct/incorrect for spaced repetition

#### US-2.4: Typed Answer Practice
> As a student, I want to type the translation so that I practice spelling.

**Acceptance Criteria:**
- Shows word, student types translation
- Fuzzy matching for minor typos (configurable strictness)
- Shows correct answer if wrong
- Option to mark own answer as correct if meaning was right

### Epic 3: Progress Tracking

#### US-3.1: View Learning Progress
> As a student, I want to see my progress so that I stay motivated.

**Acceptance Criteria:**
- Dashboard shows total words learned
- Progress per section (percentage mastered)
- Streak tracking (days practiced in a row)
- Visual celebration when milestones reached

#### US-3.2: Due Words Indicator
> As a student, I want to know how many words are due for review so that I plan my study time.

**Acceptance Criteria:**
- Home screen shows number of words due today
- Can see words due this week
- Notification (optional) when words are due

### Epic 4: Parent/Guardian Features (Post-MVP)

#### US-4.1: Progress Reports
> As a parent, I want to see my child's learning progress so that I can support their studies.

**Acceptance Criteria:**
- Summary view of practice sessions
- Words learned over time graph
- Difficult words list
- Time spent practicing

---

## Functional Requirements

### FR-1: Vocabulary Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | System shall allow creating vocabulary entries with source and target text | Must |
| FR-1.2 | System shall support UTF-8 for all text (accents, umlauts, special chars) | Must |
| FR-1.3 | System shall allow associating vocabulary with textbook sections | Must |
| FR-1.4 | System shall allow editing existing vocabulary entries | Must |
| FR-1.5 | System shall allow deleting vocabulary entries | Must |
| FR-1.6 | System shall support bulk import from structured data (CSV) | Should |
| FR-1.7 | System shall extract vocabulary from photos using OCR (pluggable provider) | Should |
| FR-1.7a | OCR shall support Tesseract.js for offline processing | Should |
| FR-1.7b | OCR shall support Google Gemini as optional cloud provider | Should |
| FR-1.7c | OCR shall support other cloud providers via pluggable interface | Could |
| FR-1.7d | OCR shall automatically fall back to Tesseract when offline | Should |
| FR-1.8 | System shall allow adding example sentences to vocabulary | Could |
| FR-1.9 | System shall allow adding pronunciation hints | Could |

### FR-2: Textbook Structure

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | System shall support hierarchical book structure (book/chapter/section) | Must |
| FR-2.2 | System shall allow creating new books | Must |
| FR-2.3 | System shall allow creating chapters within books | Must |
| FR-2.4 | System shall allow creating sections within chapters | Must |
| FR-2.5 | System shall track which sections have been covered in class | Should |
| FR-2.6 | System shall allow reordering sections | Could |

### FR-3: Learning Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | System shall implement spaced repetition algorithm | Must |
| FR-3.2 | System shall track correct/incorrect answers per vocabulary | Must |
| FR-3.3 | System shall calculate next review date based on performance | Must |
| FR-3.4 | System shall provide flashcard exercise mode | Must |
| FR-3.5 | System shall provide multiple choice exercise mode | Must |
| FR-3.6 | System shall provide typed answer exercise mode | Should |
| FR-3.7 | System shall allow practicing specific sections | Must |
| FR-3.8 | System shall allow practicing in both language directions | Must |
| FR-3.9 | System shall implement fuzzy matching for typed answers | Should |

### FR-4: Progress & Statistics

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | System shall track total words in system | Must |
| FR-4.2 | System shall track words per mastery level | Must |
| FR-4.3 | System shall track practice streak | Should |
| FR-4.4 | System shall track time spent practicing | Could |
| FR-4.5 | System shall show progress per section | Must |
| FR-4.6 | System shall export progress data | Could |

---

## Non-Functional Requirements

### NFR-1: Usability

| ID | Requirement |
|----|-------------|
| NFR-1.1 | Interface shall be usable by a 12-year-old without training |
| NFR-1.2 | All text shall be readable on mobile devices (min 16px base font) |
| NFR-1.3 | Touch targets shall be at least 44x44 pixels |
| NFR-1.4 | App shall be fully functional offline (after initial load) - this is CRITICAL |
| NFR-1.5 | Primary actions shall require max 2 taps from home screen |

### NFR-2: Performance

| ID | Requirement |
|----|-------------|
| NFR-2.1 | App shall load in under 3 seconds on 4G connection |
| NFR-2.2 | Exercise transitions shall feel instant (<100ms) |
| NFR-2.3 | OCR processing shall complete in under 10 seconds |
| NFR-2.4 | App shall handle 10,000+ vocabulary items without degradation |

### NFR-3: Security & Privacy

| ID | Requirement |
|----|-------------|
| NFR-3.1 | No personal data shall be sent to third parties without consent |
| NFR-3.2 | Learning data shall be stored locally by default |
| NFR-3.3 | If cloud sync added: data shall be encrypted in transit and at rest |
| NFR-3.4 | GDPR compliance required (user is German minor) |

### NFR-4: Reliability

| ID | Requirement |
|----|-------------|
| NFR-4.1 | Learning progress shall never be lost (persist immediately) |
| NFR-4.2 | App shall recover gracefully from crashes |
| NFR-4.3 | Data shall be backed up locally (exportable) |

### NFR-5: Compatibility

| ID | Requirement |
|----|-------------|
| NFR-5.1 | App shall work on iOS Safari 15+ |
| NFR-5.2 | App shall work on Chrome for Android 90+ |
| NFR-5.3 | App shall work on desktop browsers (Chrome, Firefox, Safari) |
| NFR-5.4 | App shall be installable as PWA |

---

## Data Model

### Entity Relationship Diagram (Conceptual)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Book     │────<│   Chapter   │────<│   Section   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              │
                                              ▼
                                        ┌───────────┐
                                        │ Vocabulary│
                                        │   Item    │
                                        └───────────┘
                                              │
                                              │
                                              ▼
                                        ┌───────────┐
                                        │ Learning  │
                                        │ Progress  │
                                        └───────────┘
                                              │
                                              │
                                              ▼
                                        ┌───────────┐
                                        │  Review   │
                                        │  Session  │
                                        └───────────┘
```

### Schema Definition

#### Book
```typescript
interface Book {
  id: string;
  title: string;
  language: string;        // ISO 639-1 code (e.g., 'fr', 'es', 'la')
  sourceLanguage: string;  // Usually 'de' for German
  edition?: string;
  publisher?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Chapter
```typescript
interface Chapter {
  id: string;
  bookId: string;
  number: number;          // Display order
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Section
```typescript
interface Section {
  id: string;
  chapterId: string;
  number: number;          // Display order within chapter
  title: string;
  pageStart?: number;
  pageEnd?: number;
  coveredInClass: boolean;
  coveredDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### VocabularyItem
```typescript
interface VocabularyItem {
  id: string;
  sectionId: string;
  sourceText: string;      // German word/phrase
  targetText: string;      // Foreign language word/phrase
  sourceExample?: string;  // Example sentence in German
  targetExample?: string;  // Example sentence in foreign language
  notes?: string;          // Grammatical notes, hints, etc.
  imageUrl?: string;       // Reference to source image (OCR)
  createdAt: Date;
  updatedAt: Date;
}
```

#### LearningProgress
```typescript
interface LearningProgress {
  id: string;
  vocabularyItemId: string;
  direction: 'source_to_target' | 'target_to_source';

  // SM-2 Algorithm fields
  easeFactor: number;      // Default 2.5, min 1.3
  interval: number;        // Days until next review
  repetitions: number;     // Consecutive correct answers

  // Stats
  totalReviews: number;
  correctReviews: number;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

#### ReviewSession
```typescript
interface ReviewSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  exerciseType: 'flashcard' | 'multiple_choice' | 'typed';
  direction: 'source_to_target' | 'target_to_source';

  // Filter criteria used
  sectionIds?: string[];
  onlyDue: boolean;

  totalItems: number;
  correctItems: number;
}
```

#### ReviewAttempt
```typescript
interface ReviewAttempt {
  id: string;
  sessionId: string;
  vocabularyItemId: string;
  correct: boolean;
  userAnswer?: string;     // For typed exercises
  responseTimeMs?: number;
  createdAt: Date;
}
```

---

## System Architecture

### High-Level Architecture

The architecture is **offline-first** - the app works fully without network after initial load.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Client (PWA) - OFFLINE-FIRST                     │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │   React UI  │  │  State Mgmt │  │  Service Worker              │  │
│  │  Components │  │   (Zustand) │  │  (Offline + Asset Caching)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────┴──────────────────────────────────────┐  │
│  │                  IndexedDB (Primary Storage)                   │  │
│  │   - Vocabulary data        - Learning progress                │  │
│  │   - Book structure         - Review sessions                  │  │
│  │   - Captured images        - User settings                    │  │
│  └────────────────────────────────────────────────────────────────┘ │
│                           │                                          │
│  ┌────────────────────────┴──────────────────────────────────────┐  │
│  │              OCR Service (Pluggable Providers)                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │
│  │  │ Tesseract.js │  │ Gemini       │  │ Cloud Vision/OpenAI  │ │  │
│  │  │ (Default,    │  │ (Optional,   │  │ (Optional,           │ │  │
│  │  │  Offline)    │  │  Cloud)      │  │  Cloud)              │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (Only when using cloud OCR
                              │        or optional sync features)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              External Services (OPTIONAL - not required)             │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Google Gemini   │  │  Cloud Vision    │  │  OpenAI Vision   │   │
│  │  API             │  │  API             │  │  API             │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Future: Cloud Sync Backend (PostgreSQL, Auth)               │   │
│  │  - Cross-device sync       - Family sharing                  │   │
│  │  - Backup/restore          - Parent dashboard                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Offline Capability Matrix

| Feature | Offline Support | Notes |
|---------|-----------------|-------|
| View vocabulary | Full | All data in IndexedDB |
| Add vocabulary (manual) | Full | Stored locally |
| Practice/flashcards | Full | All logic client-side |
| Progress tracking | Full | Stored locally |
| OCR (Tesseract) | Full | Client-side processing |
| OCR (Cloud providers) | Requires network | Falls back to Tesseract |
| Cloud sync | Requires network | Future feature, queues offline changes |

### Component Architecture

```
App
├── Layout
│   ├── Header (navigation, settings)
│   └── BottomNav (mobile navigation)
│
├── Pages
│   ├── Home (dashboard)
│   │   ├── DueWordsCard
│   │   ├── StreakCard
│   │   └── QuickActions
│   │
│   ├── Library
│   │   ├── BookList
│   │   ├── ChapterList
│   │   ├── SectionList
│   │   └── VocabularyList
│   │
│   ├── AddVocabulary
│   │   ├── ManualEntryForm
│   │   ├── PhotoCapture
│   │   └── OCRReviewList
│   │
│   ├── Practice
│   │   ├── SessionSetup (select sections, mode)
│   │   ├── FlashcardExercise
│   │   ├── MultipleChoiceExercise
│   │   ├── TypedAnswerExercise
│   │   └── SessionSummary
│   │
│   └── Progress
│       ├── OverviewStats
│       ├── SectionProgress
│       └── DifficultWords
│
└── Shared Components
    ├── Button
    ├── Card
    ├── Modal
    ├── Input
    └── ProgressBar
```

### Spaced Repetition Algorithm (SM-2 Variant)

```typescript
interface SM2Response {
  quality: 0 | 1 | 2 | 3 | 4 | 5;
  // 0: Complete blackout
  // 1: Wrong, but recognized after seeing answer
  // 2: Wrong, but answer was easy to recall
  // 3: Correct with serious difficulty
  // 4: Correct with some hesitation
  // 5: Perfect response
}

function calculateNextReview(
  progress: LearningProgress,
  response: SM2Response
): LearningProgress {
  let { easeFactor, interval, repetitions } = progress;

  if (response.quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - response.quality) * (0.08 + (5 - response.quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  const nextReviewAt = addDays(new Date(), interval);

  return {
    ...progress,
    easeFactor,
    interval,
    repetitions,
    nextReviewAt,
    lastReviewedAt: new Date(),
    totalReviews: progress.totalReviews + 1,
    correctReviews: progress.correctReviews + (response.quality >= 3 ? 1 : 0),
  };
}
```

### Simplified Response Mapping for Child User

Since a 12-year-old won't understand the 0-5 scale, map to simple choices:

```typescript
// Flashcard mode
"Didn't know" → quality 1
"Almost"      → quality 3
"Knew it!"    → quality 5

// Multiple choice / Typed
Wrong answer  → quality 1
Correct       → quality 4
```

---

## User Interface Design

### Design Principles

1. **Large touch targets** - Minimum 48x48px, ideally larger
2. **High contrast** - Easy to read in various lighting
3. **Minimal text** - Icons where possible, short labels
4. **Encouraging tone** - Celebrate progress, no harsh failure states
5. **No dark patterns** - No streaks that punish missing days harshly

### Color Palette (Suggestion)

```css
:root {
  /* Primary - friendly blue */
  --primary-500: #3B82F6;
  --primary-600: #2563EB;

  /* Success - green for correct */
  --success-500: #22C55E;

  /* Warning - orange for almost */
  --warning-500: #F59E0B;

  /* Error - soft red for incorrect */
  --error-500: #EF4444;

  /* Neutrals */
  --gray-50: #F9FAFB;
  --gray-900: #111827;
}
```

### Key Screens (Wireframe Descriptions)

#### Home Screen
```
┌────────────────────────────┐
│  Vocabulary Trainer    ⚙️  │
├────────────────────────────┤
│                            │
│   ┌────────────────────┐   │
│   │  📚 23 words due   │   │
│   │    Start Review    │   │
│   └────────────────────┘   │
│                            │
│   ┌────────────────────┐   │
│   │  🔥 5 day streak   │   │
│   └────────────────────┘   │
│                            │
│   ┌─────────┐ ┌─────────┐  │
│   │ + Add   │ │ 📖 Book │  │
│   │  Words  │ │ Library │  │
│   └─────────┘ └─────────┘  │
│                            │
├────────────────────────────┤
│  🏠    📚    ➕    📊     │
└────────────────────────────┘
```

#### Flashcard Practice
```
┌────────────────────────────┐
│  ←  Practice      12/50   │
├────────────────────────────┤
│                            │
│                            │
│                            │
│        "la maison"         │
│                            │
│       [Tap to reveal]      │
│                            │
│                            │
│                            │
├────────────────────────────┤
│  ❌        😐        ✅   │
│ Didn't   Almost    Knew    │
│  know               it!    │
└────────────────────────────┘
```

#### Add Vocabulary (Manual)
```
┌────────────────────────────┐
│  ←  Add Vocabulary         │
├────────────────────────────┤
│                            │
│  German                    │
│  ┌────────────────────┐   │
│  │ das Haus           │   │
│  └────────────────────┘   │
│                            │
│  French                    │
│  ┌────────────────────┐   │
│  │ la maison          │   │
│  └────────────────────┘   │
│                            │
│  Section                   │
│  ┌────────────────────┐   │
│  │ Unit 3 - La ville  │ ▼ │
│  └────────────────────┘   │
│                            │
│  ┌────────────────────┐   │
│  │   Save & Add More  │   │
│  └────────────────────┘   │
│                            │
│  [📷 Scan from Photo]      │
│                            │
└────────────────────────────┘
```

---

## Technical Specifications

### OCR Pipeline (Photo Import)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Photo Input │────>│ Preprocess  │────>│ OCR Engine  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    ▼
                           │            ┌─────────────┐
                           │            │ Raw Text    │
                           │            └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Image Store │     │ Text Parser │
                    └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Vocabulary  │
                                        │ Candidates  │
                                        └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ User Review │
                                        │ & Confirm   │
                                        └─────────────┘
```

#### OCR Provider Architecture

The OCR system uses a **pluggable provider pattern** to support multiple backends. All providers implement the same interface:

```typescript
interface OCRProvider {
  name: string;
  requiresNetwork: boolean;

  extractText(image: Blob): Promise<OCRResult>;
  extractVocabulary(image: Blob, hints?: ExtractionHints): Promise<VocabularyCandidate[]>;
}

interface OCRResult {
  rawText: string;
  confidence: number;
  blocks: TextBlock[];
}

interface VocabularyCandidate {
  sourceText: string;
  targetText: string;
  confidence: number;
  boundingBox?: BoundingBox;
}
```

#### Available Providers

| Provider | Type | Accuracy | Cost | Offline | Best For |
|----------|------|----------|------|---------|----------|
| Tesseract.js | Client-side | Medium | Free | Yes | Default/fallback, privacy-conscious |
| Google Gemini | Cloud API | Excellent | Pay-per-use | No | Intelligent vocab extraction with context |
| Google Cloud Vision | Cloud API | High | Pay-per-use | No | High-volume, multi-language |
| OpenAI GPT-4 Vision | Cloud API | Excellent | Pay-per-use | No | Complex layouts, context understanding |

#### Provider Selection Strategy

```typescript
class OCRService {
  private providers: Map<string, OCRProvider>;
  private defaultProvider: string = 'tesseract';

  async extractVocabulary(image: Blob, preferredProvider?: string): Promise<VocabularyCandidate[]> {
    const providerName = preferredProvider ?? this.getConfiguredProvider();
    const provider = this.providers.get(providerName);

    // Fall back to Tesseract if preferred provider unavailable or offline
    if (!provider || (provider.requiresNetwork && !navigator.onLine)) {
      return this.providers.get('tesseract')!.extractVocabulary(image);
    }

    return provider.extractVocabulary(image);
  }
}
```

**Default Strategy**:
1. Use Tesseract.js by default (free, offline-capable)
2. User can configure preferred cloud provider in settings
3. Automatic fallback to Tesseract when offline
4. Cloud providers offer better accuracy for complex layouts

### Fuzzy Matching for Typed Answers

Use Levenshtein distance with configurable threshold:

```typescript
function checkAnswer(
  expected: string,
  actual: string,
  strictness: 'strict' | 'normal' | 'lenient' = 'normal'
): { correct: boolean; distance: number } {
  const normalizedExpected = normalize(expected);
  const normalizedActual = normalize(actual);

  const distance = levenshteinDistance(normalizedExpected, normalizedActual);
  const maxLength = Math.max(normalizedExpected.length, normalizedActual.length);
  const similarity = 1 - (distance / maxLength);

  const thresholds = {
    strict: 1.0,    // Must be exact
    normal: 0.85,   // Allow minor typos
    lenient: 0.7,   // Allow more mistakes
  };

  return {
    correct: similarity >= thresholds[strictness],
    distance,
  };
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics for comparison
}
```

### Local Storage Strategy

Using IndexedDB via Dexie.js:

```typescript
import Dexie from 'dexie';

class VocabDatabase extends Dexie {
  books: Dexie.Table<Book, string>;
  chapters: Dexie.Table<Chapter, string>;
  sections: Dexie.Table<Section, string>;
  vocabularyItems: Dexie.Table<VocabularyItem, string>;
  learningProgress: Dexie.Table<LearningProgress, string>;
  reviewSessions: Dexie.Table<ReviewSession, string>;
  reviewAttempts: Dexie.Table<ReviewAttempt, string>;

  constructor() {
    super('VocabTrainer');
    this.version(1).stores({
      books: 'id, language, createdAt',
      chapters: 'id, bookId, number',
      sections: 'id, chapterId, number, coveredInClass',
      vocabularyItems: 'id, sectionId, sourceText, targetText',
      learningProgress: 'id, vocabularyItemId, direction, nextReviewAt',
      reviewSessions: 'id, startedAt',
      reviewAttempts: 'id, sessionId, vocabularyItemId',
    });
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (MVP Core)

**Duration estimate**: First milestone

**Goals**:
- Basic app shell with navigation
- Manual vocabulary entry
- Book/Chapter/Section management
- Basic flashcard practice
- Local storage with IndexedDB

**Deliverables**:
- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] Database schema and Dexie setup
- [ ] Home screen with navigation
- [ ] Book management (create, list, edit)
- [ ] Chapter/Section management
- [ ] Manual vocabulary entry form
- [ ] Vocabulary list view
- [ ] Basic flashcard exercise (no spaced repetition yet)

### Phase 2: Learning Engine

**Goals**:
- Implement SM-2 spaced repetition
- Add learning progress tracking
- Section-based practice filtering
- Multiple exercise types

**Deliverables**:
- [ ] SM-2 algorithm implementation
- [ ] Learning progress tracking
- [ ] Due words calculation
- [ ] Practice session setup (select sections)
- [ ] Multiple choice exercise
- [ ] Typed answer exercise
- [ ] Session summary screen

### Phase 3: Photo Import

**Goals**:
- Camera integration
- OCR processing
- Vocabulary extraction and review UI

**Deliverables**:
- [ ] Camera/gallery access
- [ ] Tesseract.js integration
- [ ] Text extraction pipeline
- [ ] Vocabulary candidate parsing
- [ ] Review/edit UI for extracted words
- [ ] Image storage

### Phase 4: Polish & PWA

**Goals**:
- Installable PWA
- Offline support
- Progress visualization
- Performance optimization

**Deliverables**:
- [ ] Service worker setup
- [ ] PWA manifest
- [ ] Offline mode testing
- [ ] Progress dashboard
- [ ] Streak tracking
- [ ] Difficult words view
- [ ] Performance audit and fixes
- [ ] Mobile testing and fixes

### Phase 5: Future Enhancements (Post-MVP)

- Cloud sync and backup
- Parent dashboard
- Audio pronunciation (TTS)
- Listening exercises
- Speaking exercises with speech recognition
- Gamification (achievements, points)
- Multiple user profiles
- Export/import vocabulary sets

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OCR accuracy insufficient | High | Medium | Allow manual correction; use better OCR service |
| IndexedDB data loss | High | Low | Regular export prompts; cloud backup option |
| PWA not installable on all devices | Medium | Low | Fallback to browser bookmark |
| Performance issues with large vocab | Medium | Low | Pagination; virtual lists |

### User Experience Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Too complex for 12-year-old | High | Medium | User testing with target user; simplify |
| Student loses motivation | High | Medium | Encourage don't punish; celebrate progress |
| Textbook format not supported | Medium | High | Manual entry fallback; flexible parsing |

### Project Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Scope creep | Medium | High | Strict MVP definition; phase-based approach |
| Privacy/GDPR issues | High | Low | Local-first; no unnecessary data collection |

---

## Appendix A: Supported Languages

Initial support for common German Gymnasium second foreign languages:

| Language | ISO Code | Typical Starting Grade |
|----------|----------|----------------------|
| French | fr | 6th grade |
| Latin | la | 6th grade |
| Spanish | es | 6th or 8th grade |

## Appendix B: Example Textbook Formats

### Format 1: Two-Column Vocabulary List
```
das Haus        la maison
der Garten      le jardin
die Tür         la porte
```

### Format 2: Vocabulary Box
```
┌─────────────────────────────────┐
│ Vocabulaire                     │
│ la maison (f.) - das Haus      │
│ le jardin (m.) - der Garten    │
│ la porte (f.) - die Tür        │
└─────────────────────────────────┘
```

### Format 3: Inline with Text
```
Marie habite dans une grande maison (das Haus).
```

The OCR pipeline should be designed to handle all these formats, with manual entry as fallback.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Initial | Initial requirements and architecture |
| 1.1 | 2026-01-20 | Update | Added pluggable OCR provider architecture (Gemini, Cloud Vision, OpenAI, Tesseract); Reinforced offline-first design; Added offline capability matrix |
