# Technical Roadmap

**Created:** January 2026
**Status:** Active planning document

---

## Completed Short-Term Fixes

These items from the application review have been addressed:

| Item | Status |
|------|--------|
| XSS vulnerability in TypedAnswer.tsx | Fixed - `highlightDifferences` now returns structured data |
| Move Google API calls to server-side proxy | Fixed - All Google APIs proxied through `/api/google/*` |
| Add error boundaries and toast notifications | Fixed - Global error boundary and toast system added |
| CSRF protection on API routes | Fixed - Origin validation on state-changing requests |
| Rate limiting on auth endpoints | Fixed - 10 requests per 15 minutes |
| Reduce JWT expiration | Fixed - Changed from 30 days to 14 days |
| API pagination | Fixed - Leaderboard and members endpoints paginated |
| Environment variable security | Fixed - `GOOGLE_API_KEY` is server-only |

---

## Medium-Term Improvements (1-3 months)

### 1. Sync Handler Refactoring

**Problem:** The sync handler (`sync-handler.ts`) is 800+ lines and handles multiple concerns.

**Solution:**
- Split into separate modules:
  - `sync/strategies/vocabulary.ts` - Vocabulary-specific merge logic
  - `sync/strategies/books.ts` - Book/chapter/section merge logic
  - `sync/strategies/progress.ts` - Progress and gamification merge
  - `sync/conflict-resolver.ts` - Generic conflict resolution
  - `sync/queue-processor.ts` - Queue processing logic

**Files to modify:**
- `src/lib/sync/sync-handler.ts` → split into above modules
- `src/lib/sync/sync-service.ts` → update imports

### 2. Conflict Resolution UI

**Problem:** Sync conflicts are auto-resolved without user awareness.

**Solution:**
- Add conflict tracking in sync store
- Create conflict resolution modal
- Allow user to choose "keep local" or "keep server" for conflicts
- Show conflict history in profile/settings

**New files:**
- `src/components/sync/ConflictModal.tsx`
- `src/stores/conflict.ts`

### 3. Security Headers

**Problem:** Missing security headers on all responses.

**Solution:**
Add Next.js middleware or `next.config.js` headers:

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; ..." },
]
```

### 4. Practice Session Context

**Problem:** Practice components pass many props through multiple levels.

**Solution:**
- Create `PracticeSessionContext` with React Context
- Move session state to context provider
- Simplify component props

**Files:**
- New: `src/contexts/PracticeSessionContext.tsx`
- Modify: `src/app/practice/page.tsx`, all practice components

### 5. Input Validation Improvements

**Problem:** Some form inputs lack proper validation/sanitization.

**Solution:**
- Add `zod` schemas for all user inputs on client side
- Add input length limits on database columns
- Sanitize text inputs before storage

**Files to audit:**
- `src/app/add/page.tsx`
- `src/components/ui/EditNameModal.tsx`
- All forms accepting user text

### 6. Database Index Optimization

**Problem:** Some queries may be slow without proper indexes.

**Solution:**
- Add index on `vocabulary.nextReviewAt` for due card queries
- Add index on `vocabulary.bookId` for book filtering
- Add composite index on `progressHistory(userId, date)` for stats

**File:** `src/lib/db/schema.ts` - add index definitions

---

## Long-Term Improvements (3-6 months)

### 1. Internationalization (i18n)

**Problem:** All UI text is hardcoded in German.

**Solution:**
- Add i18n library (next-intl or react-i18next)
- Extract all UI strings to translation files
- Add language selector in settings
- Support: German (default), English, French

**Scope:**
- ~200 translation keys estimated
- All component files need string extraction
- Settings page for language selection

### 2. Achievement UI Enhancement

**Problem:** Achievements exist in code but UI is minimal.

**Solution:**
- Create dedicated achievements page
- Add achievement detail modals with progress bars
- Add achievement sharing to networks
- Create badge display in profile

**New files:**
- `src/app/achievements/page.tsx`
- `src/components/achievements/AchievementCard.tsx`
- `src/components/achievements/AchievementDetail.tsx`

### 3. Deletion Confirmations

**Problem:** Some destructive actions lack confirmation.

**Solution:**
- Create reusable `ConfirmationModal` component
- Add confirmation for: delete vocabulary, delete book, leave network
- Add "undo" capability for accidental deletions (soft delete with 24h grace period)

**Files:**
- New: `src/components/ui/ConfirmationModal.tsx`
- Modify: Delete actions throughout app

### 4. Progressive Web App Enhancements

**Problem:** PWA could be more robust.

**Solution:**
- Improve service worker caching strategy
- Add background sync for offline changes
- Add push notifications for practice reminders
- Improve install prompt UX

**Files:**
- `public/sw.js` or Next.js PWA plugin config
- Add notification permission UI

### 5. Testing Infrastructure

**Problem:** Limited test coverage.

**Solution:**
- Add unit tests for critical business logic (spaced repetition, fuzzy matching)
- Add integration tests for API routes
- Add E2E tests for critical user flows (add vocabulary, practice session)
- Set up CI/CD with test requirements

**New structure:**
```
tests/
  unit/
    spaced-repetition.test.ts
    fuzzy-match.test.ts
  integration/
    api/auth.test.ts
    api/sync.test.ts
  e2e/
    add-vocabulary.spec.ts
    practice-session.spec.ts
```

### 6. Performance Monitoring

**Problem:** No visibility into production performance.

**Solution:**
- Add Vercel Analytics or similar
- Add error tracking (Sentry)
- Add custom metrics for practice sessions
- Create performance dashboard

---

## Architecture Improvements

### Move to Server Components

**Current:** Many pages are client components that could be server components.

**Improvement:**
- Convert static pages to server components
- Keep interactive parts as client islands
- Reduce JavaScript bundle size

**Candidates:**
- `src/app/library/page.tsx` - server with client sections
- `src/app/settings/page.tsx` - partial server rendering

### API Route Consolidation

**Current:** Many similar API routes with duplicated auth/error handling.

**Improvement:**
- Create `withAuth` higher-order function
- Create `withValidation(schema)` wrapper
- Standardize error response format

```typescript
// Example refactored route
export const POST = withAuth(withValidation(CreateVocabSchema, async (req, user, data) => {
  // Just the business logic
}))
```

---

## Priority Matrix

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Sync handler refactoring | Medium | High | P2 |
| Conflict resolution UI | Medium | Medium | P2 |
| Security headers | High | Low | P1 |
| Practice session context | Medium | Medium | P2 |
| Input validation | High | Medium | P1 |
| Database indexes | Medium | Low | P1 |
| i18n | High | High | P3 |
| Achievement UI | Medium | Medium | P3 |
| Deletion confirmations | Medium | Low | P2 |
| PWA enhancements | Medium | Medium | P3 |
| Testing infrastructure | High | High | P2 |
| Performance monitoring | Medium | Low | P1 |

---

## Next Actions

1. **This week:** Add security headers to `next.config.js`
2. **This week:** Add database indexes for common queries
3. **Next sprint:** Input validation audit and improvements
4. **Next sprint:** Performance monitoring setup
5. **Following month:** Testing infrastructure buildout
