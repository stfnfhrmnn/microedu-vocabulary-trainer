# UX Best Practices

Guidelines for maintaining a fast, intuitive user experience in the vocabulary trainer.

---

## Core Principles

### 1. Remember User Context

**The app should never forget what the user was doing.**

- Store the last-used location (section, book, chapter) and restore it on return
- Track recent items (last 5) for quick access
- Save configuration choices so users don't repeat themselves

**Implementation pattern:**
```typescript
// In settings store
lastUsedSectionId: string | null
recentSectionIds: string[]  // Max 5, most recent first
lastPracticeConfig: { exerciseType, direction, dueOnly, sectionIds }
```

### 2. Primary Actions Above the Fold

**Users should never scroll to find the main action.**

- Start buttons, submit buttons, and primary CTAs must be visible on load
- Use fixed positioning for critical actions if content scrolls
- On mobile, assume ~600px viewport height

**Pattern:**
```tsx
// Fixed footer for primary action
<div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-gray-50">
  <Button fullWidth onClick={handlePrimaryAction}>
    Action Label
  </Button>
</div>

// Add padding to scrollable content
<div className="pb-32">
  {/* Content that scrolls above the fixed button */}
</div>
```

### 3. Configuration is Optional

**Smart defaults should let users skip configuration entirely.**

- Offer "Quick Start" that uses last/default settings
- Make configuration expandable/collapsible, not mandatory
- Show current settings as a summary when collapsed

**Pattern:**
```
┌─────────────────────────────────┐
│ [PRIMARY ACTION BUTTON]         │  ← Always visible
├─────────────────────────────────┤
│ Settings: Karten · DE→FS  [▼]   │  ← Collapsed summary
└─────────────────────────────────┘
```

### 4. Reduce Navigation Depth

**Every extra tap is friction.**

- Allow inline creation (e.g., create section without leaving add page)
- Provide quick-access pills/chips for recent items
- Avoid forcing users through configuration screens for common tasks

### 5. Show Current Context

**Users should always know where they are and what they're affecting.**

- Display the current selection prominently (not just in a dropdown)
- Use visual hierarchy: highlighted cards, breadcrumb-style paths
- Confirm actions with brief, non-blocking feedback (toast notifications)

**Pattern:**
```tsx
// Context display card
<Card className="bg-primary-50 border-primary-200">
  <p className="text-xs text-primary-600">Adding to:</p>
  <p className="font-semibold">{book} › {chapter} › {section}</p>
  <Button size="sm">Change</Button>
</Card>
```

---

## UI Patterns

### Collapsible Sections

Use for secondary content that most users won't need to change.

```tsx
<Card>
  <button onClick={toggle} className="w-full flex justify-between p-4">
    <span className="font-semibold">Section Title</span>
    <span className="text-gray-500">{summary}</span>
    {expanded ? <ChevronUp /> : <ChevronDown />}
  </button>
  <AnimatePresence>
    {expanded && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
      >
        {/* Expanded content */}
      </motion.div>
    )}
  </AnimatePresence>
</Card>
```

### Quick-Access Pills

Use for recent items or saved presets.

```tsx
<div className="flex flex-wrap gap-2">
  {recentItems.map((item) => (
    <button
      key={item.id}
      onClick={() => select(item.id)}
      className={`px-3 py-1.5 rounded-full text-sm ${
        selected === item.id
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {item.name}
    </button>
  ))}
</div>
```

### Hierarchical Pickers

Use for nested data (book → chapter → section) instead of flat dropdowns.

```tsx
// Tree structure with expand/collapse per level
{groups.map((book) => (
  <div key={book.id}>
    <button onClick={() => toggleBook(book.id)}>
      {expanded ? <ChevronDown /> : <ChevronRight />}
      {book.name}
    </button>
    {expandedBooks.has(book.id) && (
      // Nested chapters and sections
    )}
  </div>
))}
```

### Fixed Action Footers

Use when the primary action might scroll out of view.

- Position above the bottom navigation (bottom-20 = 80px)
- Use gradient fade to indicate content continues above
- Include the key metric in the button text ("15 Vokabeln üben")

---

## Anti-Patterns to Avoid

### Don't Make Users Re-Select

❌ Dropdown resets to placeholder after each action
✅ Remember and pre-select the last used option

### Don't Hide Primary Actions

❌ Start button at the bottom of a long form
✅ Fixed button always visible, form scrolls above

### Don't Force Configuration

❌ Must configure settings before every practice session
✅ "Quick Start" with smart defaults, optional "Configure"

### Don't Use Flat Lists for Hierarchical Data

❌ Dropdown showing "Book › Chapter › Section" for all items
✅ Collapsible tree with visual hierarchy

### Don't Forget Mobile Viewports

❌ Assuming desktop screen heights
✅ Test with 600-700px viewport, ensure CTA visible

---

## Settings Store Patterns

### Tracking Recent Items

```typescript
addRecentSection: (id) => set((state) => {
  const filtered = state.recentSectionIds.filter((s) => s !== id)
  return { recentSectionIds: [id, ...filtered].slice(0, 5) }
})
```

### Saving User Preferences

```typescript
// Save on successful action
setLastPracticeConfig({
  exerciseType,
  direction,
  dueOnly,
  sectionIds,
})

// Restore on page load
const config = lastPracticeConfig || {
  exerciseType: defaultExerciseType,
  direction: defaultDirection,
  dueOnly: true,
  sectionIds: allSectionIds,
}
```

### Named Presets

```typescript
interface Preset {
  id: string
  name: string
  // ... configuration fields
}

practicePresets: Preset[]
addPracticePreset: (preset) => set((state) => ({
  practicePresets: [...state.practicePresets, preset]
}))
removePracticePreset: (id) => set((state) => ({
  practicePresets: state.practicePresets.filter((p) => p.id !== id)
}))
```

---

## Checklist for New Features

Before shipping a new feature, verify:

- [ ] Primary action visible without scrolling on mobile
- [ ] User's last choice remembered and restored
- [ ] Configuration optional (smart defaults work)
- [ ] Current context clearly displayed
- [ ] No unnecessary navigation steps
- [ ] Recent items accessible with one tap
- [ ] Feedback on actions (toast, animation)
