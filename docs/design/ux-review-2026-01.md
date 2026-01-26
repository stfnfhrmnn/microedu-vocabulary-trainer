# UX Review: Critical Flows (January 2026)

A harsh but specific review of two critical user flows that currently create friction.

---

## Executive Summary

| Flow | Verdict | Primary Issue |
|------|---------|---------------|
| Adding Vocabulary | **Poor** | No memory of last-used section; forces tedious re-selection every time |
| Starting Practice | **Mediocre** | Start button buried below 4 cards of configuration; requires scrolling on all mobile devices |

Both flows suffer from the same fundamental mistake: **prioritizing flexibility over the common case**.

---

## Flow 1: Adding Vocabulary

### Current State

**Path to add a single word:**
```
Home → "Vokabeln hinzufügen" card → /add page
→ Open dropdown → Scan through "Book › Chapter › Section" list
→ Find and select correct section → Fill German word → Fill target word
→ Submit → Form clears → REPEAT SECTION SELECTION
```

**Critical failure:** The dropdown resets conceptually for the user even though the value persists technically. There's no visual indication of "You're adding to: [Section Name]" outside of the collapsed dropdown.

### Problems (Ranked by Severity)

#### 1. No "Last Used" Memory (CRITICAL)

**What happens:** Every visit to `/add` requires the user to mentally locate where they were working.

**Why it's broken:**
- The app knows which sections exist
- The app knows which section was last used (it's in the query param)
- But the app forgets this the moment you navigate away

**Real-world impact:** A student adding 20 words from their French textbook Chapter 3 must:
1. Navigate to add page
2. Open dropdown
3. Scroll/search through potentially dozens of sections
4. Select "French Book › Chapter 3 › Section 2"
5. Add word
6. If they leave the page for any reason, repeat steps 1-4

**Evidence:** `src/app/add/page.tsx` line 20:
```typescript
const initialSectionId = searchParams.get('sectionId')
```
The app only reads from URL params. There's no `useSettings` or `useLastUsed` store integration.

#### 2. Dropdown Shows Too Much Hierarchy (HIGH)

**What happens:** Every section displays as "Book › Chapter › Section" in a flat list.

**Why it's broken:**
- If you have 3 books with 4 chapters each with 3 sections = 36 identical-looking options
- No grouping, no visual hierarchy
- User must read full path every time

**Better pattern:** Grouped dropdown with headers, or a two-step picker (select book, then section).

#### 3. No Current Context Display (MEDIUM)

**What happens:** After selecting a section, the only indication of where you're adding is the collapsed dropdown showing a truncated path.

**Why it's broken:**
- User adding multiple words loses context
- The dropdown is below the fold on small screens after scrolling
- No breadcrumb, no sticky header showing current location

#### 4. Empty State Kicks Users Out (MEDIUM)

**What happens:** If no sections exist, user sees "Keine Abschnitte vorhanden" with a link to `/library`.

**Why it's broken:**
- User loses their intent ("I wanted to add a word")
- Must navigate Library → Book → Chapter → Create Section → Navigate back
- No inline section creation

---

### Recommended Changes

#### Immediate (1-2 hours)

**A. Add `lastUsedSectionId` to settings store**

```typescript
// src/stores/settings.ts
interface SettingsState {
  // ... existing
  lastUsedSectionId: string | null
  setLastUsedSectionId: (id: string | null) => void
}
```

On successful vocabulary save, call `setLastUsedSectionId(sectionId)`.

On `/add` page load, if no `?sectionId` param, read from store.

**B. Show current section as persistent context**

Above the form, add a non-collapsible display:
```
┌─────────────────────────────────┐
│ Hinzufügen zu:                  │
│ French Book › Chapitre 3 › 3.2  │  [Ändern]
└─────────────────────────────────┘
```

This makes the current location always visible without opening the dropdown.

#### Short-term (1 day)

**C. Implement "Recent Sections" quick-picker**

Show last 3-5 used sections as pills/chips above the dropdown:
```
┌─────────────────────────────────────┐
│ Zuletzt verwendet:                  │
│ [3.2 Tiere] [2.1 Familie] [Verben]  │
└─────────────────────────────────────┘
```

One tap to switch. No dropdown navigation needed.

**D. Group dropdown by book → chapter**

```
French Book
  ├─ Chapitre 1
  │   ├─ 1.1 Begrüßung
  │   └─ 1.2 Zahlen
  ├─ Chapitre 2
  │   └─ 2.1 Familie
```

Use `<optgroup>` or a custom grouped select component.

#### Medium-term (1 week)

**E. Allow inline section creation**

If user is in the add flow and no sections exist (or they want a new one):
1. Show "Create new section" option in dropdown
2. Open modal to create section without leaving `/add`
3. Auto-select new section after creation

---

## Flow 2: Starting Practice

### Current State

**Layout order on `/practice`:**
```
1. Header (56px)
2. Section Selection Card (~240px)
3. Exercise Type Card (~140px)
4. Direction Card (~150px)
5. Due Only Toggle (~80px)
6. ─── SCROLL REQUIRED ───
7. Word Count Display (~60px)
8. START BUTTON (~50px)
```

**Total height before button: ~736px**

On an iPhone SE (667px viewport): User must scroll **~70px minimum** to see the start button.

On iPhone 14 (844px viewport): Button is barely visible at bottom.

**This is unacceptable for a primary action.**

### Problems (Ranked by Severity)

#### 1. Start Button Below the Fold (CRITICAL)

**What happens:** The thing users came to do (start practicing) requires scrolling past configuration they may not care about.

**Why it's broken:**
- Violates "above the fold" principle for primary CTAs
- Configuration is optional (smart defaults exist)
- Users who just want to practice their due words must scroll every time

**Real-world impact:** A student who practiced yesterday with the same settings:
1. Taps "Today's Review" on home
2. Sees configuration they don't need
3. Scrolls down
4. Finally finds start button
5. Repeats this every single day

#### 2. Section Selection Card is Too Tall (HIGH)

**What happens:** The section list has `max-h-48` (192px) which, combined with header and padding, consumes ~240px.

**Why it's broken:**
- Most users have 3-8 sections; this space is often wasted
- Scroll-within-scroll is confusing (page scrolls, then list scrolls)
- Deselecting sections is rare; most users practice everything

**Evidence:** `src/app/practice/page.tsx` lines 91-92:
```typescript
className={`space-y-2 overflow-y-auto pr-2 ${
  totalSections > 4 ? 'max-h-48' : ''
}`}
```

#### 3. Four Configuration Cards When One Would Suffice (HIGH)

**Current layout:**
- Card 1: Section Selection (checkboxes)
- Card 2: Exercise Type (3 buttons)
- Card 3: Direction (3 buttons)
- Card 4: Due Only (toggle)

**Why it's broken:**
- Each card has its own padding, margins, headers
- Visual noise distracts from the action
- Settings are rarely changed after initial setup

**Better pattern:** Collapse into expandable "Settings" section, or show inline beneath a prominent start area.

#### 4. No "Quick Start" Option (MEDIUM)

**What happens:** Even users who want to practice "whatever is due, with my usual settings" must navigate through the configuration screen.

**Why it's broken:**
- The home page card could link directly to a session start
- Configuration should be optional, not mandatory
- Power users need settings; casual users need speed

---

### Recommended Changes

#### Immediate (1-2 hours)

**A. Move Start Button to Fixed Bottom Position**

```tsx
// Sticky footer with start button
<div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white border-t">
  <Button fullWidth onClick={handleStart}>
    {wordCount} Vokabeln üben
  </Button>
</div>
```

The button should be visible at all times. Configuration scrolls above it.

**B. Reduce Section Card Height**

- For ≤4 sections: show all, no scroll
- For 5-8 sections: show 4, subtle scroll indicator
- For >8 sections: collapse into expandable "Select sections" with badge showing count

```tsx
const collapsedSectionCount = selectedSectionIds.length
// Show: "Abschnitte (5 von 12 ausgewählt)" [Expand button]
```

#### Short-term (1 day)

**C. Implement "Quick Practice" from Home**

On the home page "Due Words" card, add secondary action:

```
┌─────────────────────────────────┐
│  Heute zu wiederholen           │
│  ████████  15 Vokabeln          │
│                                 │
│  [Schnell starten]  [Einrichten]│
└─────────────────────────────────┘
```

- "Schnell starten" → Uses last settings, goes directly to `/practice/session`
- "Einrichten" → Current behavior, opens `/practice` configuration

**D. Consolidate Configuration Cards**

Replace 4 cards with:

```
┌─────────────────────────────────────────────┐
│ 15 Vokabeln zum Üben           [Einstellungen ▼]
│ ═══════════════════════════════════════════ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  [  ÜBUNG STARTEN  ]                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ▼ Einstellungen (optional)                  │
│   Übungsart: 🎴 Flashcard                   │
│   Richtung: DE → FR                         │
│   Nur fällige: ✓                            │
│   Abschnitte: Alle (12)                     │
└─────────────────────────────────────────────┘
```

Primary action first. Settings collapsed by default.

#### Medium-term (1 week)

**E. Remember and Apply "Favorite" Configurations**

Store named presets:
- "Morning Review" = Due only, Flashcard, All sections
- "Chapter 3 Focus" = Specific sections, Typed, Both directions

Show as quick-access buttons on practice page.

---

## Summary of Recommendations

### Adding Vocabulary

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| P0 | Add `lastUsedSectionId` to settings store | 30 min | High |
| P0 | Show current section as visible context above form | 30 min | High |
| P1 | Recent sections quick-picker (pills) | 2 hr | High |
| P1 | Group dropdown by book → chapter | 2 hr | Medium |
| P2 | Inline section creation from add page | 4 hr | Medium |

### Starting Practice

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| P0 | Move start button to fixed bottom position | 30 min | Critical |
| P0 | Reduce section card height / make collapsible | 1 hr | High |
| P1 | Add "Quick Start" option from home page | 2 hr | High |
| P1 | Consolidate configuration into collapsible section | 3 hr | High |
| P2 | Named configuration presets | 4 hr | Medium |

---

## Design Principles Violated

1. **Fitts's Law**: Important targets (start button) should be large and easy to reach. Currently requires scrolling.

2. **Recognition over Recall**: Users shouldn't have to remember which section they were using. The app should remember.

3. **Progressive Disclosure**: Show essentials first, details on demand. Currently, all details shown first.

4. **Sensible Defaults**: Defaults exist but are hidden behind mandatory configuration screens.

5. **Respect User's Time**: Both flows add unnecessary steps to the most common use cases.

---

## Measuring Success

After implementing changes, track:

1. **Time to first vocabulary added** (should decrease)
2. **Time from home to practice session start** (should decrease)
3. **Section dropdown opens per session** (should decrease)
4. **Scroll events on practice page** (should decrease)
5. **Quick start usage rate** (new metric)
