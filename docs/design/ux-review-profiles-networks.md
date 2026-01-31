# UX Review: Profiles, Accounts & Networks

A deep review of the profile creation, account management, and network/study group system.

> **Status:** All P0, P1, and P2 items implemented. See implementation details at the end.

---

## Executive Summary

The current system has a solid technical foundation but suffers from **invisible complexity** - powerful features exist but users can't discover or understand them. The local-first approach with optional cloud sync is smart, but the UX doesn't communicate what's happening.

**Critical Issues:**
1. Profile creation is silent and confusing
2. Data loss risk when creating profiles without understanding
3. Network setup is unclear - no guided flow
4. Role distinctions (parent/teacher/admin) exist but aren't explained
5. Account recovery relies solely on remembering a code

---

## 1. Profile Creation - Current State

### What Happens Now

1. User opens app for the first time
2. Profile auto-created with name "Benutzer" and random emoji
3. No welcome, no explanation, no choice
4. User starts using app, adds vocabulary
5. Later, user might tap profile icon, see "New Profile" button
6. Tapping "New Profile" instantly creates another profile
7. **All previous data "disappears"** (it's actually in the other profile)

### Problems

| Issue | Severity | Impact |
|-------|----------|--------|
| No name prompt on first launch | Medium | Impersonal, missed personalization |
| Silent profile creation | High | Users don't understand what a "profile" is |
| No confirmation for new profile | Critical | Accidental data "loss" |
| No explanation of profile isolation | Critical | Users think they lost data |
| Default name "Benutzer" persists | Low | Feels generic |

### User Confusion Scenarios

**Scenario 1: Accidental Profile Switch**
> User taps profile icon out of curiosity, sees "New Profile", taps it.
> All their vocabulary is gone. Panic. They close app.
> Next time, they're still in the empty new profile.

**Scenario 2: Shared Device**
> Parent creates profile, adds vocabulary.
> Child opens app, sees parent's data, creates "their own" profile.
> Now there are two profiles - but who owns which?

**Scenario 3: Lost Code**
> User gets their XXXX-XXXX code after cloud sync.
> Doesn't understand its importance, doesn't save it.
> Reinstalls app. Code lost. Data gone.

---

## 2. Network System - Current State

### What Exists

The system supports:
- **Network types:** Class, Study Group, Family
- **Roles:** Child, Parent, Teacher, Admin
- **Invite codes:** XXX-XXX format
- **Nicknames:** Privacy-preserving display names
- **Shared books:** Copy-based sharing model
- **Leaderboards:** Per-network competition

### How It Works (Hidden Behind Code)

```
Create Network:
1. Tap "Lernkreis" on home page (if visible)
2. Tap "Create Network"
3. Enter name, select type, choose your role
4. Get invite code
5. Share code with others

Join Network:
1. Get invite code from someone
2. Find the join option (unclear where)
3. Enter code, select your role
4. Done
```

### Problems

| Issue | Severity | Impact |
|-------|----------|--------|
| No discovery of network features | High | Users don't know it exists |
| No explanation of roles | High | What's the difference? |
| No guided setup for families | High | "How do I set up for my kids?" |
| Can't see all networks in one place | Medium | Hard to manage multiple |
| Can't change role after joining | Medium | Mistakes are permanent |
| No pending invitation concept | Low | Surprising instant joins |

### Missing Guided Flows

**"I'm a parent setting this up for my kids"**
- No onboarding asks this question
- No wizard to create family network
- No explanation of how to link accounts

**"I'm a teacher setting up for my class"**
- Same problem
- No bulk invitation system
- No class management dashboard

---

## 3. Account Types - Current State

### Defined Roles

| Role | Intended Use | How to Get It |
|------|--------------|---------------|
| `child` | Students/learners | Select when joining network |
| `parent` | Parents/guardians | Select when creating/joining |
| `teacher` | Teachers | Select when creating/joining |
| `admin` | Network administrators | Auto-assigned to network creator |

### Problems

| Issue | Description |
|-------|-------------|
| Roles are per-network, not per-account | Same user could be "child" in one network, "teacher" in another |
| No global "account type" | The app doesn't know if you're a parent or student overall |
| No permissions differentiation | All roles can do the same things locally |
| No parent-child linking | Parents can't see their specific child's progress |

### What Users Expect vs. Reality

**Expectation:** "I create a parent account, then create accounts for my kids, and I can see their progress"

**Reality:**
1. Everyone creates their own profile (or it auto-creates)
2. Everyone joins a network
3. Parents select "parent" role
4. Kids select "child" role
5. Leaderboard shows aggregated stats (not detailed progress)
6. No explicit parent-child link exists

---

## 4. Recommendations

### P0: Critical - Fix Immediately

#### 4.1 First Launch Experience

Replace silent auto-creation with a minimal welcome flow:

```
Screen 1: Welcome
┌─────────────────────────────────────┐
│                                     │
│              📚                     │
│                                     │
│     Willkommen beim                 │
│     Vokabeltrainer!                 │
│                                     │
│   Wie heißt du?                     │
│   ┌─────────────────────────────┐   │
│   │ [Name eingeben]             │   │
│   └─────────────────────────────┘   │
│                                     │
│   Wähle deinen Avatar:              │
│   🦊 🐻 🐼 🐨 🦁 🐯 🐸 🦉          │
│                                     │
│        [Los geht's →]               │
│                                     │
└─────────────────────────────────────┘
```

- Name field required (min 2 characters)
- Avatar selection with visual feedback
- Single screen, not multi-step

#### 4.2 Profile Creation Confirmation

When tapping "New Profile", show a warning:

```
┌─────────────────────────────────────┐
│      Neues Profil erstellen?        │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ Das aktuelle Profil und seine   │
│  Daten bleiben erhalten, aber du    │
│  wechselst zu einem leeren Profil.  │
│                                     │
│  Profile sind getrennt - jedes hat  │
│  eigene Vokabeln und Fortschritte.  │
│                                     │
│  Wofür ist das neue Profil?         │
│  ○ Für eine andere Person           │
│  ○ Ich möchte neu anfangen          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Name: ___________________  │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Abbrechen]    [Profil erstellen]  │
│                                     │
└─────────────────────────────────────┘
```

#### 4.3 Profile Switcher Clarity

Current: Just shows profiles with names
Better: Show context

```
┌─────────────────────────────────────┐
│ Profil wechseln                     │
├─────────────────────────────────────┤
│                                     │
│ Aktuell:                            │
│ ┌─────────────────────────────────┐ │
│ │ 🦊 Max          ✓               │ │
│ │ 127 Vokabeln · Code: AB12-XY34  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Andere Profile:                     │
│ ┌─────────────────────────────────┐ │
│ │ 🐼 Lisa                         │ │
│ │ 45 Vokabeln                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Neues Profil]                    │
│                                     │
└─────────────────────────────────────┘
```

- Show vocab count per profile (helps identify which is which)
- Show code if registered (helps with recovery awareness)
- "Current" section clearly separated

---

### P1: High Priority - Network Setup Guidance

#### 4.4 Network Discovery

Add a section to settings or onboarding:

```
┌─────────────────────────────────────┐
│ Gemeinsam lernen                    │
├─────────────────────────────────────┤
│                                     │
│ Verbinde dich mit Familie, Freunden │
│ oder deiner Klasse.                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👨‍👩‍👧‍👦  Familie einrichten        │ │
│ │ Für Eltern und Kinder           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏫  Klasse beitreten            │ │
│ │ Mit Einladungscode              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📚  Lerngruppe erstellen        │ │
│ │ Mit Freunden lernen             │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

#### 4.5 Family Setup Wizard

New guided flow for parents:

```
Step 1: Your Role
┌─────────────────────────────────────┐
│ Familie einrichten                  │
├─────────────────────────────────────┤
│                                     │
│ Wer bist du?                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👨‍👩‍👧 Ich bin ein Elternteil      │ │
│ │ Ich richte dies für mein Kind   │ │
│ │ ein und möchte den Fortschritt  │ │
│ │ sehen können.                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎒 Ich bin das Kind             │ │
│ │ Meine Eltern haben mir einen    │ │
│ │ Code gegeben.                   │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

Step 2 (Parent): Create Family Network
┌─────────────────────────────────────┐
│ Familie erstellen                   │
├─────────────────────────────────────┤
│                                     │
│ Gib deiner Familie einen Namen:     │
│ ┌─────────────────────────────────┐ │
│ │ Familie Müller                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [Weiter →]                  │
│                                     │
└─────────────────────────────────────┘

Step 3 (Parent): Invite Kids
┌─────────────────────────────────────┐
│ Kinder einladen                     │
├─────────────────────────────────────┤
│                                     │
│ Teile diesen Code mit deinen        │
│ Kindern:                            │
│                                     │
│      ┌──────────────────────┐       │
│      │     AB12-XY34        │       │
│      │       [Kopieren]     │       │
│      └──────────────────────┘       │
│                                     │
│ Sie können den Code im              │
│ Vokabeltrainer eingeben unter:      │
│ Profil → Gemeinsam lernen →         │
│ Familie beitreten                   │
│                                     │
│      [Fertig]                       │
│                                     │
└─────────────────────────────────────┘
```

#### 4.6 Role Explanation

When selecting a role, show what it means:

```
┌─────────────────────────────────────┐
│ Deine Rolle in "Familie Müller"     │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎒 Schüler/Kind                 │ │
│ │                                 │ │
│ │ • Dein Fortschritt erscheint   │ │
│ │   in der Familien-Übersicht    │ │
│ │ • Du kannst Ranglisten sehen   │ │
│ │ • Du kannst geteilte Bücher    │ │
│ │   kopieren                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👨‍👩‍👧 Elternteil                  │ │
│ │                                 │ │
│ │ • Du siehst den Fortschritt    │ │
│ │   aller Familienmitglieder     │ │
│ │ • Du kannst Bücher für alle    │ │
│ │   teilen                       │ │
│ │ • Du kannst neue Mitglieder    │ │
│ │   einladen                     │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

### P2: Medium Priority - Visibility & Management

#### 4.7 Network Overview Page

Add a dedicated page for managing networks:

```
/settings/networks or /networks

┌─────────────────────────────────────┐
│ ← Meine Netzwerke                   │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👨‍👩‍👧‍👦 Familie Müller              │ │
│ │ Du: Elternteil · 3 Mitglieder   │ │
│ │ Code: AB12-XY34                 │ │
│ │                          [→]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏫 Klasse 5b Französisch        │ │
│ │ Du: Schüler · 24 Mitglieder     │ │
│ │                          [→]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Netzwerk erstellen/beitreten]    │
│                                     │
└─────────────────────────────────────┘
```

#### 4.8 Code Recovery Awareness

Prompt users to save their code:

```
After first successful cloud sync:

┌─────────────────────────────────────┐
│ Dein persönlicher Code              │
├─────────────────────────────────────┤
│                                     │
│       ┌──────────────────────┐      │
│       │     AB12-XY34        │      │
│       └──────────────────────┘      │
│                                     │
│ ⚠️ Wichtig: Speichere diesen Code!  │
│                                     │
│ Du brauchst ihn, um dich auf einem  │
│ anderen Gerät anzumelden oder wenn  │
│ du die App neu installierst.        │
│                                     │
│ [Code kopieren]  [Screenshot]       │
│                                     │
│        [✓ Ich habe ihn gesichert]   │
│                                     │
└─────────────────────────────────────┘
```

---

### P3: Future Considerations

#### 4.9 Parent-Child Direct Linking

Consider a more explicit parent-child relationship:
- Parent creates account for child from their device
- Child's code auto-copied to parent's account
- Parent can see child's detailed progress, not just leaderboard

#### 4.10 Account Recovery Options

Current: Code only
Future considerations:
- Optional email for recovery
- QR code scanning between devices
- Export/import profile backup

#### 4.11 Profile Merging

If user accidentally creates multiple profiles:
- Option to merge vocabulary from one profile into another
- Would need conflict resolution for duplicates

---

## 5. Simplified Mental Model

### For Users

```
Profile = Your personal vocabulary & progress
         (Can have multiple per device)
             ↓
Code = Your identity for cloud sync & login
       (One per profile, after registration)
             ↓
Network = A group you learn with
          (Can join multiple networks)
             ↓
Role = What you can do in that network
       (Child sees own progress,
        Parent sees everyone's)
```

### For the App

```
Local Profile ──[register]──> User Account (has code)
                                    │
                                    ├── Join Network A (as Child)
                                    │
                                    └── Join Network B (as Parent)
```

---

## 6. Implementation Priority

| Item | Effort | Impact | Priority |
|------|--------|--------|----------|
| 4.1 First launch name/avatar prompt | Small | High | P0 |
| 4.2 New profile confirmation dialog | Small | Critical | P0 |
| 4.3 Profile switcher with context | Small | Medium | P0 |
| 4.4 Network discovery section | Medium | High | P1 |
| 4.5 Family setup wizard | Medium | High | P1 |
| 4.6 Role explanation tooltips | Small | Medium | P1 |
| 4.7 Network overview page | Medium | Medium | P2 |
| 4.8 Code recovery prompt | Small | Medium | P2 |
| 4.9 Parent-child linking | Large | Medium | P3 |
| 4.10 Additional recovery options | Large | Low | P3 |
| 4.11 Profile merging | Large | Low | P3 |

---

## 7. Key Files to Modify

| Feature | Primary Files |
|---------|---------------|
| First launch | `src/app/onboarding/page.tsx`, `src/stores/onboarding.ts` |
| Profile creation | `src/components/user/UserMenu.tsx`, `src/stores/user-session.ts` |
| Profile switcher | `src/components/user/UserMenu.tsx` |
| Network discovery | `src/app/settings/page.tsx` (new section) |
| Family wizard | New: `src/components/network/FamilySetupWizard.tsx` |
| Role explanation | `src/components/network/JoinNetworkModal.tsx` |
| Network overview | New: `src/app/networks/page.tsx` |
| Code awareness | `src/components/user/UserMenu.tsx` |

---

## 8. Summary

The current system is technically capable but needs **UX scaffolding** to make it usable:

1. **Don't auto-create profiles silently** - ask for name on first launch
2. **Warn before creating new profiles** - explain data isolation
3. **Guide network setup** - especially for families
4. **Explain roles clearly** - what does "parent" mean here?
5. **Make codes important** - users need to understand recovery

The goal is **progressive disclosure**: simple for solo learners, powerful for families and classes, but never confusing.

---

## 9. Implementation Summary (Completed)

All P0, P1, and P2 items have been implemented:

### P0 - Critical (Completed)

| Item | Files Modified |
|------|---------------|
| **4.1 First launch name/avatar prompt** | `src/app/onboarding/page.tsx`, `src/stores/onboarding.ts`, `src/components/onboarding/ProfileSetup.tsx` (new) |
| **4.2 New profile confirmation dialog** | `src/components/user/UserMenu.tsx` - Added modal with warning about data isolation, name/avatar input |
| **4.3 Profile switcher with context** | `src/components/user/UserMenu.tsx` - Shows full code, creation date, explanatory text |

### P1 - High Priority (Completed)

| Item | Files Modified |
|------|---------------|
| **4.4 Network discovery section** | `src/app/settings/page.tsx` - Added "Gemeinsam lernen" section with three options |
| **4.5 Family setup wizard** | `src/components/network/FamilySetupWizard.tsx` (new) - Step-by-step wizard for parent/child flows |
| **4.6 Role explanations** | `src/components/network/JoinNetworkModal.tsx`, `src/components/network/CreateNetworkModal.tsx` - Added descriptions for each role |

### P2 - Medium Priority (Completed)

| Item | Files Modified |
|------|---------------|
| **4.7 Network overview page** | `src/app/networks/page.tsx` (new), `src/app/networks/[id]/page.tsx` (new) |
| **4.8 Code recovery prompt** | `src/components/profile/CodeAwarenessPrompt.tsx` (new), `src/stores/sync.ts`, `src/app/page.tsx`|

### Key Changes Summary

1. **Onboarding now asks for name and avatar** before creating a profile
2. **Profile creation requires confirmation** with a warning about data isolation
3. **Profile switcher shows more context** (full code, creation date)
4. **Settings has a "Gemeinsam lernen" section** for network discovery
5. **Family setup wizard** guides parents through creating a family network
6. **Role selection shows descriptions** explaining what each role can do
7. **Networks page** lists all networks with management options
8. **Code awareness prompt** appears after first sync to remind users to save their code
