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
11. [Profile & Network System](#profile--network-system)

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

#### US-1.4: Bulk Language Fix for Vocabulary
> As a student or parent, I want to fix wrongly reversed source/target pairs in bulk so that cleanup is fast and safe.

**Acceptance Criteria:**
- Can select multiple vocabulary items from library views
- Can apply one action to swap source and target text for all selected items
- App asks for confirmation before changing all selected items
- Updated entries remain editable individually afterward

#### US-1.5: Voice-Assisted Vocabulary Entry
> As a student, I want to dictate vocabulary into the input fields so that adding words is faster on mobile.

**Acceptance Criteria:**
- Source and target input fields each provide a microphone option
- Speech recognition uses the expected language for each field
- Recognized text is inserted into the input field and can be edited before save
- Manual typing remains available as fallback

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

#### US-2.5: Practice Beyond Daily Goal
> As a student, I want to keep practicing after my due words or daily goal are completed so that I can study more when I want.

**Acceptance Criteria:**
- Home screen offers a clear "free practice" action even when due words are 0
- Student can choose to practice all words (not only due words)
- Student can restart practice from the summary screen ("Nochmal üben")
- Student can return to setup and pick a different section/mode for a new session

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

### Epic 4: Parent/Guardian Features

#### US-4.1: Family Network
> As a parent, I want to create a family network so that I can see my children's learning activity.

**Acceptance Criteria:**
- Can create a family network and receive an invite code
- Children join the family using the invite code
- Parent sees children's XP, streak, and accuracy in a leaderboard
- Parent is listed as "supporter" (unranked) in the family leaderboard

#### US-4.2: Parent-Led Quiz
> As a parent, I want to quiz my child verbally without needing to look at a screen so that we can practice together.

**Acceptance Criteria:**
- Screen-free voice mode where the app reads questions aloud
- Child answers verbally; app evaluates via speech recognition + AI
- Parent can focus on interaction, not on the device
- Session summary shown at the end

#### US-4.3: Parent Dashboard *(planned)*
> As a parent, I want a dedicated view of each child's progress so that I can support them specifically where they struggle.

**Acceptance Criteria:**
- Child-centric cards showing: words mastered this week, accuracy, streak, XP
- Weak words list per child (words frequently answered wrong)
- Weekly trend: improving, stable, or declining
- Per-book progress breakdown
- Privacy controls: child can opt in/out of sharing weak words

### Epic 5: Voice & Speech Practice

#### US-5.1: Voice Practice
> As a student, I want to practice vocabulary by speaking so that I improve pronunciation and recall.

**Acceptance Criteria:**
- App reads the question aloud (via TTS)
- Student speaks the answer
- AI analyzes the spoken answer for correctness (via Gemini)
- Feedback shown: correct, almost correct, or incorrect with the right answer
- Affects spaced repetition scheduling

#### US-5.2: Group Voice Session
> As a student, I want to practice with friends in a voice session so that studying is more social.

**Acceptance Criteria:**
- Multi-user voice session with shared question pool
- Each participant answers in turn
- Results compared at the end

### Epic 6: Gamification & Motivation

#### US-6.1: XP and Levels
> As a student, I want to earn experience points so that I feel rewarded for studying.

**Acceptance Criteria:**
- XP awarded for correct answers (bonus for streaks, accuracy, difficulty)
- Level progression with increasing XP thresholds
- Level-up celebration animation
- XP visible on home screen and in network leaderboards

#### US-6.2: Achievement Badges
> As a student, I want to unlock achievements so that I have goals to work toward.

**Acceptance Criteria:**
- Achievements across categories: consistency, volume, accuracy, special
- Popup notification when a new achievement is unlocked
- Achievements page showing all badges (earned and locked)
- At least 18 distinct achievements

#### US-6.3: Daily Streak
> As a student, I want to track my daily practice streak so that I stay motivated to practice every day.

**Acceptance Criteria:**
- Streak increments for each day with at least one practice session
- Streak visible on home screen
- Streak milestone celebrations (7, 14, 30 days)
- Streak displayed in network leaderboards

### Epic 7: Cloud Sync & Multi-Device

#### US-7.1: Cloud Registration
> As a student, I want to register for cloud sync so that my data is backed up and accessible from other devices.

**Acceptance Criteria:**
- Unique user code (XXXX-XXXX) generated at registration
- Code awareness prompt ensures user saves their code
- All local data synced to server after registration
- Sync happens transparently in the background

#### US-7.2: Device Transfer
> As a student, I want to transfer my account to a new device so that I don't lose my progress.

**Acceptance Criteria:**
- Request a one-time transfer token + 4-digit PIN
- Enter token + PIN on new device to pull all data
- Token expires after 15 minutes
- Previous unused tokens are invalidated

#### US-7.3: Offline-First Sync
> As a student, I want to study offline and have my progress sync when I'm back online.

**Acceptance Criteria:**
- All changes queued locally when offline
- Changes pushed to server automatically when connectivity returns
- Server changes pulled to local device
- Sync status indicator visible to user
- Sync failures never block the learning flow

### Epic 8: Safety & Moderation

#### US-8.1: User Blocking
> As a student, I want to block another user so that I don't see their content or activity.

**Acceptance Criteria:**
- Can block any user from network member list
- Blocked user's activity hidden from leaderboards
- Can view and manage blocked users list
- Can unblock previously blocked users

#### US-8.2: Content Reporting
> As a user, I want to report inappropriate content or behavior so that the community stays safe.

**Acceptance Criteria:**
- Can report a user or a shared book
- Report includes type (inappropriate content, spam, bullying, other)
- Optional description field
- Report submitted to server for moderation

#### US-8.3: Content Protection
> As a student, I want a safeguard against accidentally deleting well-practiced vocabulary so that I don't lose progress.

**Acceptance Criteria:**
- Items with 0-9 reviews: deleted immediately
- Items with 10-49 reviews: confirmation dialog required
- Items with 50+ reviews: must type "LÖSCHEN" to confirm
- Deletion request tracked for audit

### Epic 9: Book Sharing

#### Simple Access Rules (MVP)

1. Every book has exactly one owner and the owner is visible.
2. Only the owner can edit book content, sharing settings, or delete the book.
3. In family networks, parents automatically see their children’s books as read-only.
4. Read-only users can run practice sessions but cannot change vocabulary content.
5. Any read-only book can be copied into the user’s own library; copies get a new owner.
6. Owner can revoke network sharing at any time.

#### US-9.1: Share Books in Networks
> As a teacher, I want to share vocabulary books with my class so that students don't need to enter vocabulary manually.

**Acceptance Criteria:**
- Can share any book to a network the user belongs to
- Network members can see shared books in a gallery
- Members can copy a shared book to their own library
- Copy count tracked for the sharer
- Original attribution preserved on copies

#### US-9.2: Visible Book Ownership
> As a user, I want to see who owns a book so that editing responsibility is clear.

**Acceptance Criteria:**
- Book list and book detail show owner name (and avatar if available)
- Owner label is shown consistently for personal and shared books

#### US-9.3: Owner-Only Editing
> As a book owner, I want exclusive edit rights so that the source book stays consistent.

**Acceptance Criteria:**
- Only owner can edit book metadata, chapter/section structure, and vocabulary content
- Non-owners only see read-only actions (view, practice, copy)
- Delete and sharing controls are hidden/disabled for non-owners
- Network admins/teachers may stop sharing in their network, but still cannot edit book content unless they are the owner

#### US-9.4: Parent Access to Child Books
> As a parent in a family network, I want automatic read-only access to my child’s books so that I can support practice without setup overhead.

**Acceptance Criteria:**
- Parent can see child books by default after family link exists
- Child books are clearly marked read-only in parent account
- Parent cannot modify child-owned content directly
- Parent can copy child books into own library for adaptation

#### US-9.5: Parent-Led Practice from Parent Account
> As a parent, I want to start practice from my account using my child’s books so that we can practice together.

**Acceptance Criteria:**
- Parent can start a practice session from child-owned read-only books
- Session allows choosing the learner context (for example, child profile)
- Practice results are stored for the selected learner, not the parent

#### US-9.6: Copy Shared or Family-Visible Books
> As a student or parent, I want to copy a read-only book so that I can customize my own version.

**Acceptance Criteria:**
- `Copy to my library` is available on read-only books
- Copied book gets the copier as owner
- Changes to the copy do not affect the original

#### US-9.7: Revoke Sharing
> As a book owner, I want to stop sharing quickly so that outdated or incorrect content can be withdrawn.

**Acceptance Criteria:**
- Owner can revoke network sharing in one action
- Revocation removes read-only access for non-owners in that network
- Existing private copies owned by others remain intact

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
| FR-1.10 | System shall support bulk swapping source/target text for selected vocabulary entries | Should |
| FR-1.11 | System shall support microphone dictation in manual vocabulary input fields | Should |

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
| FR-3.10 | System shall allow learners to continue practicing beyond due words/daily goals via free-practice and restart flows | Should |

### FR-4: Progress & Statistics

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | System shall track total words in system | Must |
| FR-4.2 | System shall track words per mastery level | Must |
| FR-4.3 | System shall track practice streak | Should |
| FR-4.4 | System shall track time spent practicing | Could |
| FR-4.5 | System shall show progress per section | Must |
| FR-4.6 | System shall export progress data | Could |

### FR-5: Voice & Speech

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | System shall provide text-to-speech for vocabulary (Web Speech API + Google Cloud TTS) | Must |
| FR-5.2 | System shall accept spoken answers via speech recognition | Must |
| FR-5.3 | System shall analyze spoken answers for correctness using AI (Gemini) | Should |
| FR-5.4 | System shall provide a screen-free parent quiz mode | Should |
| FR-5.5 | System shall support group voice practice sessions | Could |
| FR-5.6 | System shall provide pronunciation quality controls (voice type and test playback) | Should |
| FR-5.7 | System shall support pronunciation language override with clear user feedback | Should |

### FR-6: Gamification

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | System shall award XP for practice sessions with bonuses for streaks/accuracy | Must |
| FR-6.2 | System shall track user level based on cumulative XP | Must |
| FR-6.3 | System shall track daily practice streak | Must |
| FR-6.4 | System shall define and award achievement badges | Must |
| FR-6.5 | System shall display celebratory animations for milestones | Should |
| FR-6.6 | System shall provide sound effects and haptic feedback | Should |

### FR-7: Cloud Sync & Multi-Device

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | System shall sync local changes to server in background | Must |
| FR-7.2 | System shall pull server changes to local device | Must |
| FR-7.3 | System shall support full sync for new device setup | Must |
| FR-7.4 | System shall queue changes while offline and sync when online | Must |
| FR-7.5 | System shall support device-to-device account transfer via token + PIN | Must |
| FR-7.6 | System shall detect sync conflicts and preserve both versions | Should |
| FR-7.7 | System shall never lose data during sync (soft deletes, idempotent operations) | Must |

### FR-8: Networks & Competition

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | System shall support creating networks (family, class, study group) | Must |
| FR-8.2 | System shall support joining networks via invite code | Must |
| FR-8.3 | System shall support role-based access (child, parent, teacher, admin) | Must |
| FR-8.4 | System shall display leaderboards (daily, weekly, monthly, all-time) | Must |
| FR-8.5 | System shall allow sharing books within networks | Must |
| FR-8.6 | System shall allow copying shared books to own library | Must |
| FR-8.7 | System shall separate supporters (parents/teachers) from competitors in leaderboards | Should |
| FR-8.8 | System shall store and display a single visible owner for each book | Must |
| FR-8.9 | System shall restrict editing, deletion, and share-setting changes to the book owner | Must |
| FR-8.10 | System shall provide automatic read-only parent visibility of child-owned books within family networks | Should |
| FR-8.11 | System shall allow read-only users to run practice sessions from visible books without edit rights | Should |
| FR-8.12 | System shall allow users to copy read-only books into their own editable library | Must |
| FR-8.13 | System shall allow owners to revoke network sharing at any time | Must |
| FR-8.14 | System shall automatically surface child-owned books as read-only to parent members in family networks | Should |
| FR-8.15 | System shall allow network admins/teachers to revoke sharing for moderation while preserving owner-only content editing | Should |

### FR-9: Safety & Moderation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9.1 | System shall allow blocking users | Must |
| FR-9.2 | System shall allow reporting users or content | Must |
| FR-9.3 | System shall implement tiered deletion protection based on review count | Must |
| FR-9.4 | System shall allow members to hide from leaderboards (visibility toggle) | Should |

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

The architecture is **offline-first** — the app works fully without network after initial load. Cloud sync and social features are opt-in enhancements.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Client (PWA) - OFFLINE-FIRST                     │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │   React UI  │  │  Zustand    │  │  Service Worker (Serwist)    │  │
│  │  (Next.js   │  │  Stores     │  │  - Asset caching             │  │
│  │   App       │  │  (12 stores)│  │  - Background sync           │  │
│  │   Router)   │  │             │  │  - Offline support            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
│         │                │                       │                    │
│  ┌──────┴────────────────┴───────────────────────┴──────────────┐   │
│  │              Dexie (IndexedDB) — Primary Data Store           │   │
│  │  - Books, Chapters, Sections, VocabularyItems                 │   │
│  │  - LearningProgress (SM-2 state)                              │   │
│  │  - Sync change queue (pending changes)                        │   │
│  │  - User settings, gamification, achievements                  │   │
│  │  - Networks, competition stats, shared books                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│         │                                                            │
│  ┌──────┴──────────────────────────────────────────────────────┐    │
│  │                    Sync Layer                                │    │
│  │  - Change queue → push to server                             │    │
│  │  - Pull server changes → apply to IndexedDB                  │    │
│  │  - Full sync for new devices                                 │    │
│  │  - Background sync via Service Worker                        │    │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (when online)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Server (Next.js API Routes on Vercel)             │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Auth (JWT)      │  │  Sync API        │  │  Network API     │   │
│  │  - Register      │  │  - Push changes  │  │  - CRUD          │   │
│  │  - Login         │  │  - Pull changes  │  │  - Leaderboards  │   │
│  │  - Transfer      │  │  - Full sync     │  │  - Shared books  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Safety API      │  │  Stats API       │  │  Google Proxy    │   │
│  │  - Block/Report  │  │  - Submit stats  │  │  - TTS           │   │
│  │  - Deletion req  │  │                  │  │  - Vision OCR    │   │
│  └──────────────────┘  └──────────────────┘  │  - Gemini AI     │   │
│                                               └──────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Middleware: CSRF protection, Rate limiting, Zod validation  │    │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (Neon Serverless) — Server Data Store             │    │
│  │  - Users, user data (JSONB)                                   │    │
│  │  - All learning content (mirrored from client)                │    │
│  │  - Networks, members, competition stats                       │    │
│  │  - Safety: blocks, reports, deletion requests                 │    │
│  │  - Soft deletes (deletedAt) for data preservation             │    │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Server-side API key
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Google Cloud APIs (Optional)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Cloud TTS    │  │ Cloud Vision │  │ Gemini (Generative Lang) │   │
│  │ Pronunciation│  │ OCR          │  │ Voice analysis, OCR      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Offline Capability Matrix

| Feature | Offline Support | Notes |
|---------|-----------------|-------|
| View vocabulary | Full | All data in IndexedDB |
| Add vocabulary (manual) | Full | Stored locally, queued for sync |
| Practice (all modes) | Full | All logic client-side |
| Progress tracking | Full | SM-2 state in IndexedDB |
| Gamification (XP, streaks) | Full | Calculated locally |
| OCR (Tesseract) | Full | Client-side processing |
| OCR (Cloud Vision/Gemini) | Requires network | Falls back to Tesseract |
| Voice TTS (Web Speech) | Full | Browser-native |
| Voice TTS (Google Cloud) | Requires network | Falls back to Web Speech |
| Speech recognition | Full | Browser-native Web Speech API |
| Cloud sync | Requires network | Changes queued offline, pushed when online |
| Networks/Leaderboards | Requires network | Cached locally for viewing |
| Book sharing | Requires network | Copy stored locally after download |

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

### Phase 1: Foundation (MVP Core) — *Completed*

- [x] Project setup (Next.js 15, TypeScript, Tailwind CSS)
- [x] Dexie IndexedDB schema and CRUD operations
- [x] Home screen with bottom navigation
- [x] Book/Chapter/Section management (hierarchical)
- [x] Manual vocabulary entry form
- [x] Vocabulary list view
- [x] Basic flashcard exercise

### Phase 2: Learning Engine — *Completed*

- [x] SM-2 spaced repetition algorithm
- [x] Learning progress tracking per vocabulary item
- [x] Due words calculation and display
- [x] Practice session setup (select sections, mode, direction)
- [x] Multiple choice exercise with plausible distractors
- [x] Typed answer exercise with fuzzy matching (Levenshtein, accent-aware)
- [x] Session summary screen with stats

### Phase 3: Photo Import & OCR — *Completed*

- [x] Camera/gallery access
- [x] Tesseract.js integration (offline OCR)
- [x] Google Cloud Vision integration (optional, higher accuracy)
- [x] Pluggable OCR provider architecture
- [x] Text extraction and vocabulary candidate parsing
- [x] Review/edit UI for extracted words
- [x] Automatic offline fallback to Tesseract

### Phase 4: PWA & Offline-First — *Completed*

- [x] Service worker setup (Serwist)
- [x] PWA manifest with icons
- [x] Full offline capability
- [x] Progress dashboard
- [x] Safe area insets for notched devices
- [x] 48px touch targets
- [x] Mobile testing (Chromium, Mobile Chrome, Mobile Safari)

### Phase 5: Cloud Sync & Multi-Device — *Completed*

- [x] PostgreSQL backend (Neon serverless) with Drizzle ORM
- [x] JWT-based authentication (code-based, no email/password)
- [x] Push/pull incremental sync
- [x] Full sync for new device setup
- [x] Offline change queue with background sync
- [x] Device-to-device account transfer (token + PIN)
- [x] CSRF protection and rate limiting
- [x] Security headers

### Phase 6: Gamification & Engagement — *Completed*

- [x] XP system with bonuses (streak, accuracy, difficulty)
- [x] Level progression with celebration animations
- [x] Daily streak tracking
- [x] 18 achievement badges across 4 categories
- [x] Achievement popup notifications
- [x] Sound effects and haptic feedback
- [x] Confetti animations for milestones
- [x] Onboarding wizard for new users

### Phase 7: Voice & Speech — *Completed*

- [x] Text-to-speech (Web Speech API + Google Cloud TTS)
- [x] Speech recognition for spoken answers
- [x] AI-powered answer analysis (Gemini)
- [x] Voice practice mode
- [x] Screen-free parent quiz mode
- [x] Group voice session
- [x] Unified TTS provider abstraction

### Phase 8: Networks & Social — *Completed*

- [x] Network creation (family, class, study group)
- [x] Invite code system (join via XXX-XXX code)
- [x] Role-based membership (child, parent, teacher, admin)
- [x] Leaderboards (daily, weekly, monthly, all-time)
- [x] Book sharing within networks
- [x] Book copying with attribution
- [x] Competition stats aggregation
- [x] User blocking and content reporting
- [x] Tiered content deletion protection
- [x] Family setup wizard
- [x] Internationalization (German + English)

### Phase 9: Hardening & Quality — *In Progress*

- [x] Unit tests for core algorithms (SM-2, fuzzy match, XP, achievements)
- [x] Integration tests for database operations
- [x] E2E tests for family network flow
- [ ] API route integration tests
- [ ] Additional E2E test flows (onboarding, practice, OCR)
- [ ] CI/CD pipeline (lint + test + build on PR)
- [ ] Error tracking service (Sentry)
- [ ] Structured logging / observability
- [ ] Test coverage reporting

### Phase 10: Future Enhancements — *Planned*

- [ ] Parent dashboard (child-centric progress cards, weak words, trends)
- [ ] Sync conflict detection and resolution UI
- [ ] GDPR data export endpoint
- [ ] Push notifications for due words / streak reminders
- [ ] Content Security Policy header
- [ ] API versioning
- [ ] Re-engagement flow for returning users
- [ ] Dark mode

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

## Profile & Network System

### User Profile Architecture

The app uses a **local-first profile system** where users don't need to create an account initially. Profiles are created locally and can optionally sync to the cloud.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Profile & Network Model                          │
│                                                                     │
│  Local Device                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Profile 1 (Max)          Profile 2 (Lisa)                  │   │
│  │  ├─ Name, Avatar          ├─ Name, Avatar                   │   │
│  │  ├─ Vocabulary Data       ├─ Vocabulary Data                │   │
│  │  └─ Learning Progress     └─ Learning Progress              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                    │                                                │
│         [Optional Cloud Sync with XXXX-XXXX code]                  │
│                    ↓                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Cloud Backend                             │   │
│  │  User Account (code: AB12-XY34)                             │   │
│  │  ├─ Can join multiple Networks                               │   │
│  │  └─ Synced vocabulary & progress                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                    │                                                │
│                    ↓                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Networks (Class, Family, Study Group)                       │   │
│  │  ├─ Members with Roles (child, parent, teacher, admin)      │   │
│  │  ├─ Shared Books                                             │   │
│  │  └─ Leaderboards                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Profile Schema

```typescript
interface UserProfile {
  id: string;              // UUID for local identification
  name: string;            // User-chosen display name
  avatar: string;          // Emoji avatar
  isActive: boolean;       // Currently selected profile
  createdAt: number;       // Timestamp
}
```

### Network Types

| Type | Purpose | Use Case |
|------|---------|----------|
| `family` | Parents tracking children's progress | Home learning with parental oversight |
| `class` | Teacher-managed classroom | School environment with formal tracking |
| `study_group` | Peer learning groups | Friends studying together |

### User Roles

Roles are **per-network**, meaning the same user can have different roles in different networks.

| Role | Permissions | Typical User |
|------|-------------|--------------|
| `child` | View own progress, access shared books, see leaderboard | Students |
| `parent` | View all family members' progress, share books, invite members | Parents/Guardians |
| `teacher` | Manage class roster, share books, view all students | Teachers |
| `admin` | Full network management (auto-assigned to creator) | Network creator |

### Book Access Model

| Context | Visibility | Can Practice | Can Edit | Can Copy |
|---------|------------|--------------|----------|----------|
| Owner account | Full | Yes | Yes | N/A |
| Family parent (child-owned book) | Auto-visible | Yes | No | Yes |
| Class/study group member (shared book) | Visible when shared | Yes | No | Yes |

### Authentication Flow

The app uses a **code-based authentication** system (no email/password):

1. **Local-only phase**: User creates profile with name/avatar, gets unique XXXX-XXXX code
2. **Cloud registration**: When cloud features are enabled, the code becomes the login credential
3. **Multi-device**: User enters their code on new devices to access synced data

### Code Types (to reduce confusion)

| Code | Format | Purpose | Example |
|------|--------|---------|---------|
| Account code | `XXXX-XXXX` (8 chars) | Same user account on another device (login/restore) | `AB12-XY34` |
| Network invite code | `XXX-XXX` (6 chars) | Join a family/class/study-group with a different account | `A1B-2C3` |

```
First Launch → Name/Avatar Prompt → Local Profile Created
                                           │
                                           ↓
                               [Enable Cloud Sync]
                                           │
                                           ↓
                              Code Awareness Prompt
                           "Save your code: AB12-XY34"
                                           │
                                           ↓
                              [Join/Create Network]
```

### UX Guidelines for Profiles & Networks

1. **Never auto-create profiles silently** - always prompt for name
2. **Warn before creating new profiles** - explain data isolation
3. **Show profile context** - display code and stats in profile switcher
4. **Guide network setup** - provide wizard flows for families
5. **Explain roles clearly** - show what each role can do
6. **Emphasize code importance** - prompt users to save their code

### Key Components

| Feature | Component | Location |
|---------|-----------|----------|
| First launch setup | `ProfileSetup` | `src/components/onboarding/ProfileSetup.tsx` |
| Profile switching | `UserMenu` | `src/components/user/UserMenu.tsx` |
| Network discovery | Settings page | `src/app/settings/page.tsx` |
| Family setup | `FamilySetupWizard` | `src/components/network/FamilySetupWizard.tsx` |
| Network management | Networks page | `src/app/networks/page.tsx` |
| Code awareness | `CodeAwarenessPrompt` | `src/components/profile/CodeAwarenessPrompt.tsx` |

---

## Sync Conflict Detection & Resolution

### Problem Statement

The current sync implementation uses **implicit last-write-wins** — when two devices edit the same record offline, the last push to the server silently overwrites the other. There is no conflict detection, no version tracking, and no user-facing feedback when data is lost.

This is acceptable for low-conflict data (e.g., creating new vocabulary), but problematic for:
- **Vocabulary edits** (student fixes a word on phone, parent fixes same word on tablet)
- **Learning progress** (student practices on two devices with different results)
- **Delete vs. edit races** (one device deletes a book while another adds vocabulary to it)

### Current Sync Flow (Simplified)

```
Device A (offline)          Server              Device B (offline)
    │                         │                        │
    │── edit vocab "apple" ──>│                        │
    │   (push)                │                        │
    │                         │<── edit vocab "apple" ─│
    │                         │    (push — OVERWRITES) │
    │                         │                        │
    │<── pull ────────────────│                        │
    │   (gets B's version,                             │
    │    A's edit LOST)                                │
```

### Proposed Design: Version-Based Conflict Detection

#### 1. Add version tracking to server records

Each syncable record gets a `version` column (monotonically incrementing integer):

```typescript
// Server schema additions
version: integer('version').notNull().default(1),
```

On every server-side update, `version` is incremented:
```sql
UPDATE vocabulary_items SET ..., version = version + 1 WHERE ...
```

#### 2. Client sends `expectedVersion` with updates

The sync change record is extended:

```typescript
interface SyncChange {
  // ... existing fields
  expectedVersion?: number  // Version the client last saw (for updates only)
}
```

When the client edits a record that has been pulled from the server, it includes the `version` it currently has. New records (creates) don't need a version.

#### 3. Server detects conflicts on push

```
Push handler logic:

IF operation == 'update':
  currentVersion = SELECT version FROM table WHERE localId = ? AND userId = ?

  IF change.expectedVersion IS NULL:
    // Legacy client or first sync — accept (last-write-wins fallback)
    UPDATE ... SET version = version + 1

  ELSE IF change.expectedVersion == currentVersion:
    // No conflict — client had the latest version
    UPDATE ... SET version = version + 1

  ELSE IF change.expectedVersion < currentVersion:
    // CONFLICT — record was modified since client last pulled
    → Return conflict instead of applying change
```

#### 4. Conflict response format

```typescript
interface PushResponse {
  success: boolean
  processed: number
  conflicts: ConflictRecord[]   // NEW
  errors: ErrorRecord[]
}

interface ConflictRecord {
  changeId: string              // Client's change ID
  table: string
  localId: string
  clientVersion: number         // What the client had
  serverVersion: number         // What the server has now
  serverData: Record<string, unknown>  // Current server state
  clientData: Record<string, unknown>  // What the client tried to write
}
```

#### 5. Client-side conflict resolution

Conflicts are stored locally and surfaced to the user:

```typescript
// New IndexedDB table
interface SyncConflict {
  id: string
  table: string
  localId: string
  clientData: Record<string, unknown>
  serverData: Record<string, unknown>
  detectedAt: number
  resolvedAt?: number
  resolution?: 'keep-mine' | 'keep-theirs' | 'merged'
}
```

**Resolution strategies by data type:**

| Data Type | Default Strategy | User Intervention |
|-----------|-----------------|-------------------|
| Vocabulary text edits | Show diff, let user pick | Yes — modal with both versions |
| Learning progress | Merge: keep highest repetitions, latest review date | No — automatic |
| Book/chapter metadata | Last-write-wins with notification | Optional |
| Deletes vs. edits | Preserve the edit, notify about attempted delete | Yes — confirmation |

#### 6. Conflict resolution UI

For vocabulary conflicts (the most user-visible case):

```
┌────────────────────────────────────────────┐
│  ⚠️  Sync Conflict                         │
│                                            │
│  "apple" was edited on two devices:        │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ This device:    "la pomme (f.)"      │  │
│  │ Other device:   "la pomme (fem.)"    │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────┐  ┌──────────┐               │
│  │ Keep Mine │  │Keep Other│               │
│  └──────────┘  └──────────┘               │
│                                            │
└────────────────────────────────────────────┘
```

For learning progress (automatic merge):
```
Merge rule:
  easeFactor    = average of both
  interval      = max of both
  repetitions   = max of both
  totalReviews  = sum of both (deduplicated by date)
  correctReviews = sum of both (deduplicated by date)
  nextReviewDate = recalculate from merged state
```

#### 7. Migration path

The version column can be added without breaking existing clients:
- Server adds `version` column with default `1`
- Old clients send no `expectedVersion` → server accepts (last-write-wins fallback)
- New clients start sending `expectedVersion` → server detects conflicts
- Gradual rollout with no breaking changes

#### 8. Implementation scope

| Component | Changes |
|-----------|---------|
| `server-schema.ts` | Add `version` column to all syncable tables |
| `push/route.ts` | Add version check before updates, return conflicts |
| `sync-queue.ts` | Store `expectedVersion` in change records |
| `apply-changes.ts` | Track record versions locally after pull |
| `sync-service.ts` | Handle conflict responses, store in conflict table |
| New: `SyncConflictModal` | UI for resolving vocabulary conflicts |
| New: `conflict-resolver.ts` | Auto-merge logic for learning progress |
| `db.ts` | Add `syncConflicts` table to Dexie schema |

---

## Parent Dashboard Design

### Problem Statement

Parents can join family networks and see a leaderboard, but the experience is network-centric, not child-centric. A parent with two children sees a ranked list — not a dashboard showing each child's progress, struggles, and trends. The data to power a richer parent experience already exists in competition stats, learning progress, and network membership, but is not surfaced.

### Current Parent Experience

```
Parent opens app → Networks → Family Network → Leaderboard tab
                                              → Members tab
                                              → Books tab
```

**What parents see today:**
- Leaderboard with children ranked by XP (parent shown as unranked "supporter")
- Per-child: XP, accuracy %, streak days, words mastered (in leaderboard row)
- Member list with visibility toggles
- Shared books gallery

**What parents DON'T see:**
- Which words a child struggles with
- Whether a child is improving or declining over time
- Per-book/chapter progress breakdown
- How often a child practices (session count)
- Comparison across time periods (this week vs. last week)

### Proposed Design

#### Route: `/networks/[id]/dashboard`

A new tab "Dashboard" in the network detail view, visible only to `parent`, `teacher`, and `admin` roles. This tab replaces the leaderboard as the default view for supporters.

#### Data Sources (already available)

| Data | Source | Currently Used? |
|------|--------|----------------|
| Words reviewed per period | `competitionStats.wordsReviewed` | In leaderboard only |
| Words mastered per period | `competitionStats.wordsMastered` | Icon in leaderboard |
| Accuracy percentage | `competitionStats.accuracyPercentage` | Tiny text in leaderboard |
| Streak days | `competitionStats.streakDays` | In leaderboard |
| XP earned | `competitionStats.xpEarned` | In leaderboard |
| Sessions completed | `competitionStats.sessionsCompleted` | NOT displayed |
| Weak words | `learningProgress` where `correctReviews/totalReviews < 0.5` | NOT shared |
| Per-book progress | `vocabularyItems` + `learningProgress` by book | NOT aggregated |

#### New API Endpoint

```
GET /api/networks/[id]/children/[userId]/progress
```

Returns aggregated progress data for a specific child, accessible only by parent/teacher/admin role members. Respects the child's privacy settings (`shareProgress`, `shareStreak`, `shareWeakWords` from `ProgressShareSettings`).

```typescript
interface ChildProgress {
  userId: string
  name: string
  avatar: string

  // Current stats
  currentStreak: number
  totalWordsLearned: number
  totalWordsMastered: number  // interval >= 21 days

  // This week vs. last week
  thisWeek: PeriodStats
  lastWeek: PeriodStats
  trend: 'improving' | 'stable' | 'declining'

  // Per-book breakdown
  books: BookProgress[]

  // Weak words (if child has opted in)
  weakWords?: WeakWord[]
}

interface PeriodStats {
  wordsReviewed: number
  wordsMastered: number
  accuracy: number
  sessionsCompleted: number
  xpEarned: number
}

interface BookProgress {
  bookId: string
  bookName: string
  language: string
  totalWords: number
  wordsMastered: number
  percentComplete: number
}

interface WeakWord {
  sourceText: string
  targetText: string
  accuracy: number        // correctReviews / totalReviews
  totalAttempts: number
  bookName: string
}
```

#### UI Components

##### ChildProgressCard

One card per child in the family, showing at-a-glance status:

```
┌────────────────────────────────────────────┐
│  🦊 Max                                    │
│                                            │
│  🔥 12-day streak    ⭐ Level 8 (2,450 XP) │
│                                            │
│  This week                                 │
│  ┌────────────────────────────────────┐    │
│  │  42 words reviewed   92% accuracy  │    │
│  │  8 words mastered    5 sessions    │    │
│  └────────────────────────────────────┘    │
│                                            │
│  📈 Improving vs. last week (+15 words)    │
│                                            │
│  [View Details]                            │
└────────────────────────────────────────────┘
```

##### ChildDetailView

Expanded view when parent taps "View Details":

```
┌────────────────────────────────────────────┐
│  ← Max's Progress                          │
│                                            │
│  ── Books ──────────────────────────────── │
│                                            │
│  📕 Découvertes 2                          │
│  ████████████░░░░░░░░  58% (87/150 words) │
│                                            │
│  📗 Latein Grundwortschatz                 │
│  ██████░░░░░░░░░░░░░░  32% (48/150 words) │
│                                            │
│  ── Weak Words ─────────────────────────── │
│  (Words Max finds difficult)               │
│                                            │
│  la bibliothèque → die Bibliothek   30%    │
│  le professeur → der Lehrer         40%    │
│  la géographie → die Erdkunde       45%    │
│                                            │
│  ── Weekly Activity ────────────────────── │
│  Mo  Tu  We  Th  Fr  Sa  Su               │
│  ██  ██  ██  ░░  ██  ██  ░░               │
│  12  18  8       15  9                     │
│                                            │
└────────────────────────────────────────────┘
```

#### Privacy Controls

Children's data sharing is opt-in, controlled by `ProgressShareSettings`:

| Setting | Default | What it controls |
|---------|---------|-----------------|
| `shareProgress` | `true` | XP, streak, words mastered, accuracy visible to parents |
| `shareStreak` | `true` | Streak visible in parent dashboard |
| `shareWeakWords` | `false` | Weak words list visible to parents |

The child can toggle these in Settings → Privacy. If `shareWeakWords` is off, the parent dashboard shows a message: *"Max hasn't enabled sharing difficult words. Ask them to turn it on in Settings → Privacy."*

#### Implementation Scope

| Component | Type | Description |
|-----------|------|-------------|
| `GET /api/networks/[id]/children/[userId]/progress` | API route | Aggregates child data with privacy checks |
| `ChildProgressCard.tsx` | Component | Summary card per child |
| `ChildDetailView.tsx` | Component | Expanded per-child progress view |
| `WeakWordsList.tsx` | Component | Weak words with accuracy indicators |
| `BookProgressBar.tsx` | Component | Per-book mastery progress bar |
| `WeeklyActivityGrid.tsx` | Component | Daily activity heatmap |
| `ParentDashboard.tsx` | Component | Container for all child cards |
| `PrivacySettings.tsx` | Update | Surface `shareWeakWords` toggle for children |
| `NetworkDetail.tsx` | Update | Add "Dashboard" tab for parent/teacher roles |

#### Design Principles

1. **Child-centric, not metric-centric** — lead with the child's name and avatar, not numbers
2. **Encouraging tone** — show "improving" trends prominently; don't highlight failures
3. **Respect privacy** — weak words are opt-in; never expose individual answers or session transcripts
4. **Actionable** — if a child struggles with specific words, a parent can suggest extra practice or help
5. **Lightweight** — aggregated stats only; no real-time tracking or surveillance features
6. **Age-appropriate** — designed for parents of ~12-year-olds, not helicopter monitoring

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
| 1.2 | 2026-01-26 | Update | Added Profile & Network System section documenting user profiles, network types, roles, and authentication flow |
| 2.0 | 2026-02-08 | Update | Major update: Added user stories for all implemented features (Epics 5-9: Voice, Gamification, Cloud Sync, Safety, Book Sharing); Added functional requirements FR-5 through FR-9; Updated architecture diagram to reflect current server/client/sync topology; Replaced implementation phases with completed/in-progress/planned status; Added Sync Conflict Detection & Resolution design; Added Parent Dashboard UX design |
| 2.1 | 2026-02-14 | Update | Added simplified book ownership/access model, expanded Epic 9 user stories for owner/parent/read-only flows, clarified account vs network code formats, and documented bulk language swap plus voice-assisted manual entry requirements |
| 2.2 | 2026-02-14 | Update | Added US-2.5 and FR-3.10 to explicitly cover practice beyond daily goals (free-practice and restart flows) |
| 2.3 | 2026-02-14 | Update | Added detailed implementation plan for all open story gaps in `docs/OPEN_STORIES_IMPLEMENTATION_PLAN.md` |
| 2.4 | 2026-02-14 | Update | Documented governance exception for sharing revocation, parent auto-visibility of child books in family networks, and new voice requirements for quality controls + language override |
| 2.5 | 2026-02-14 | Update | Added explicit difficult-word practice scope in setup flow and documented network-type decision guidance in network onboarding screens |
| 2.6 | 2026-02-14 | Update | Extended language-assurance implementation notes with STT language override support in voice and add-vocabulary flows |
| 2.7 | 2026-02-14 | Update | Added deterministic learner-default behavior and remembered learner selection for parent-quiz setup flows |
| 2.8 | 2026-02-14 | Update | Clarified family invitation handoff text with explicit parent-create to child-join menu path steps |
