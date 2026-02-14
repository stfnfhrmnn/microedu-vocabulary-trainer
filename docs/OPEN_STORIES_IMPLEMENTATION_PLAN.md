# Open Stories Implementation Plan

Date: 2026-02-14
Owner: Product + Engineering

## Scope

This plan covers all currently open user-story gaps:

- Stories that exist but are missing acceptance details
- Stories that are missing entirely
- Newly added `US-2.5` (practice beyond daily goal)

Goal: close these gaps with simple, predictable behavior and minimal complexity.

## Open Story Backlog

| Story ID | Type | Current Gap | Target Outcome |
|---|---|---|---|
| `US-1.5` | Partial | STT happy-path only in spec | Permission-denied/unsupported/error fallback fully specified and implemented |
| `US-2.2` / `US-2.4` | Partial | Not explicitly tied to "Heute wiederholen" flow | Due-card mode selection and typed-mode entry are explicit and test-covered |
| `US-2.5` | New | Newly documented, partially implemented | End-to-end flow verified: free practice, restart, new session selection |
| `US-4.1` | Partial | Invite handoff path ambiguous | Parent create -> child join path clear in UX copy and flow |
| `US-5.1` | Partial | No explicit language mismatch handling | TTS/STT language assurance, warnings, and manual override |
| `US-9.3` | Partial | Governance exceptions unclear | Admin/teacher exception rules documented and enforced |
| `US-9.4` / `US-9.6` | Partial | Parent contribution loop only implicit via copy | Explicit "copy and adapt" contribution flow |
| `US-9.5` | Partial | Multi-child learner selection edge cases undefined | Deterministic learner selection defaults and switching |
| `US-4.4` (new) | Missing | "Fehler beim Laden" retry/recovery story missing | Actionable load failure UI with retry/offline behavior |
| `US-7.4` (new) | Missing | Code confusion prevention not formalized | Consistent 6-char vs 8-char code guidance in all relevant forms |
| `US-8.4` (new) | Missing | No simple guidance for selecting network type | Lightweight decision helper (family/class/study_group) |
| `US-5.6` (new) | Missing | TTS quality controls not formalized | User-facing voice quality settings + preview/test |
| `US-5.7` (new) | Missing | Language assurance story not formalized | Force/confirm language for pronunciation + speech recognition |

## Implementation Milestones

## Milestone 1: Practice Beyond Goal (High Priority)

Stories: `US-2.5`, `US-2.2`, `US-2.4`

1. Confirm and lock the "beyond goal" flow:
- Home due card: due practice actions + free-practice action always visible when library has content
- Summary page: clear distinction between "Nochmal üben" (same setup) and "Neue Übung wählen" (back to setup)

2. Tighten practice setup behavior:
- Preselect last used setup for fast restart
- Preserve selected sections/mode/direction between summary -> setup transitions

3. Add acceptance tests:
- E2E: due words complete -> free practice still possible
- E2E: summary -> restart works
- E2E: summary -> new setup -> different section/mode starts correctly

Primary files:
- `src/app/page.tsx`
- `src/app/practice/page.tsx`
- `src/app/practice/summary/page.tsx`
- `src/stores/practice-session.ts`
- `tests/e2e/*practice*.spec.ts`

Exit criteria:
- Learner can always continue practicing after daily goal completion without dead ends.

## Milestone 2: Network Clarity + Load Recovery (High Priority)

Stories: `US-4.1`, `US-4.4`, `US-7.4`, `US-8.4`

1. Standardize code guidance:
- Reusable helper text component for all join/login/create flows:
  - `XXXX-XXXX` = account on another device
  - `XXX-XXX` = join network with another account

2. Add error-recovery pattern for network pages:
- Friendly error classification (auth/network/not-found/server)
- Retry button with backoff
- Offline hint when navigator is offline

3. Add simple network type chooser guidance:
- One decision screen with 3 options and short "when to use" text
- Default recommendation for parent flow: `family`

Primary files:
- `src/components/network/JoinNetworkModal.tsx`
- `src/components/network/FamilySetupWizard.tsx`
- `src/components/network/CreateNetworkModal.tsx`
- `src/app/networks/page.tsx`
- `src/app/networks/[id]/page.tsx`
- `src/components/network/NetworkList.tsx`
- `tests/e2e/*network*.spec.ts`

Exit criteria:
- Users no longer confuse code types and can recover from load failures in-network screens.

## Milestone 3: Voice Reliability + Language Assurance (High Priority)

Stories: `US-1.5`, `US-5.1`, `US-5.6`, `US-5.7`

1. STT robustness for manual entry:
- Handle microphone denied/unavailable/browser-not-supported states
- Keep manual typing as explicit fallback in all cases

2. TTS language assurance:
- Always derive default language from book/language context
- Show warning when selected voice language mismatches content language
- Allow explicit override when needed (advanced setting)

3. TTS quality controls:
- Voice quality choice (`standard` / `wavenet`) in settings
- "Test voice" action in settings page
- Persist preferences per user

4. Observability:
- Log provider fallback (Google -> Web Speech) and mismatch warnings

Primary files:
- `src/app/add/page.tsx`
- `src/hooks/useTTS.ts`
- `src/lib/services/unified-tts.ts`
- `src/lib/services/google-tts.ts`
- `src/app/api/google/tts/route.ts`
- `src/stores/settings.ts`
- `src/app/settings/page.tsx`
- `tests/unit/*tts*.test.ts`
- `tests/e2e/*voice*.spec.ts`

Exit criteria:
- Voice features behave predictably across devices and pronounce in the intended language by default.

## Milestone 4: Book Ownership + Parent Contribution (Medium Priority)

Stories: `US-9.3`, `US-9.4`, `US-9.5`, `US-9.6`

1. Enforce ownership rules consistently:
- Owner badge in all relevant book lists/details
- Owner-only controls hidden/disabled for non-owners

2. Clarify governance exceptions:
- Define and enforce whether `admin/teacher` can unshare only, or also edit metadata
- Apply same rule in API checks and UI control visibility

3. Parent contribution loop (simple model):
- Parents can copy child/shared book and edit their own copy
- Optional "suggest to owner" action (phase 2 of this milestone if needed)

4. Multi-child learner context:
- Parent practice start requires explicit learner selection if >1 child linked
- Remember last chosen learner for convenience

Primary files:
- `src/components/sharing/SharedBooksGallery.tsx`
- `src/components/sharing/ShareBookModal.tsx`
- `src/app/api/shared-books/route.ts`
- `src/app/api/shared-books/[id]/route.ts`
- `src/app/practice/page.tsx`
- `src/app/practice/session/page.tsx`
- `src/stores/practice-session.ts`
- `tests/e2e/*sharing*.spec.ts`

Exit criteria:
- Ownership/edit rights are obvious and parent workflows are useful without adding complex permissions.

## Milestone 5: Hardening, QA, and Rollout (Cross-cutting)

1. Add/extend tests for every story above:
- Unit tests for new branching logic
- Integration tests for API permission checks
- E2E for critical family/network/practice/voice paths

2. Add migration notes and docs updates:
- Update `docs/REQUIREMENTS_AND_ARCHITECTURE.md` for all new/expanded stories
- Record each shipped milestone in document history

3. Rollout strategy:
- Ship in small increments by milestone
- Include fallback behavior and feature flags where risk is higher (voice + sharing permissions)

Exit criteria:
- All open stories have explicit acceptance criteria and passing automated checks.

## Delivery Sequence and Estimates

| Milestone | Duration (est.) | Dependency |
|---|---|---|
| 1. Practice Beyond Goal | 2-3 dev days | none |
| 2. Network Clarity + Recovery | 3-4 dev days | none |
| 3. Voice Reliability + Language Assurance | 4-6 dev days | Google/Web Speech behavior verification |
| 4. Book Ownership + Parent Contribution | 4-6 dev days | sharing API/UI alignment |
| 5. Hardening + QA | 2-3 dev days | milestones 1-4 |

Total estimate: 15-22 dev days.

## Definition of Done (Per Story)

1. Story and acceptance criteria are explicit in requirements docs.
2. UI behavior matches acceptance criteria on mobile viewport.
3. API and permission checks are covered by tests.
4. Failure states have actionable user feedback (not generic errors only).
5. Build and E2E smoke tests pass before merge.
