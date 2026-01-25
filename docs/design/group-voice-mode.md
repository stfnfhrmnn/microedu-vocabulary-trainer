# Group Voice Mode - Design Document

A collaborative voice-based learning mode where 2-4 people learn together, guided by an LLM tutor.

## Overview

### Core Concept
- Multiple learners sit around a shared device
- LLM acts as tutor/moderator, speaking in the target language
- Turn-taking managed through gentle prompts, not strict enforcement
- Spectators can observe and optionally help
- Casual session - no login required for participants

### Target Scenarios
- Siblings practicing together before bed
- Study group at school
- Parent helping multiple children
- Friends learning together

---

## Participants

### Players
- 2-4 active participants
- Identified by name (voice-provided at session start)
- Receive questions, earn points
- Can help each other

### Spectators
- Observers who don't compete
- Can give hints when LLM invites
- See everything, hear everything
- Can transition to player mid-session
- Receive summary at end

---

## Content Sources

The session can draw vocabulary from:

| Source | Description |
|--------|-------------|
| **Specific sections** | "Découvertes Kapitel 4" - uses exact vocabulary |
| **Entire book** | Draws from all sections in a book |
| **Topic-based** | "Let's practice animals" - LLM generates/selects |
| **Mixed** | LLM combines library content with generated questions |

---

## Language Settings

### Instruction Language
- **Default:** Target language (French/Spanish/Latin)
- **Fallback:** German on request or when struggling

### Immersion Levels

| Level | Behavior |
|-------|----------|
| **Beginner** | German instructions, target language words only |
| **Intermediate** | Target language questions, German explanations |
| **Advanced** | Mostly target language, German only when requested |
| **Full Immersion** | Target language only |

### German Triggers
The LLM switches to German when it hears:
- "Auf Deutsch bitte"
- "Was heißt das?"
- "Ich verstehe nicht"
- "Nochmal?" (after failed comprehension)
- "Hilfe"
- Prolonged confused silence

After helping in German, LLM returns to target language.

---

## Turn-Taking Behavior

Since we cannot reliably identify individual speakers, the system uses a **soft turn-taking** approach with gentle nudges.

### Philosophy
- Trust the group to self-organize
- LLM suggests but doesn't enforce
- Allow natural conversation flow
- Nudge only when needed

### Turn Assignment Strategies

#### 1. Named Turns (Primary)
LLM explicitly names who should answer:
```
LLM: "Anna, comment dit-on 'der Hund'?"
```
- Used for most questions
- Ensures fairness over time
- LLM tracks who has answered least

#### 2. Open Questions (Secondary)
LLM opens to anyone:
```
LLM: "Wer weiß es? Qui sait?"
```
- Used occasionally for energy
- After a correct answer streak
- For "bonus" questions

#### 3. Help Invitations
When someone struggles:
```
LLM: "Hmm, schwierig. Möchte jemand helfen?"
```
- Specifically for stuck moments
- Spectators can also respond
- Helper gets acknowledgment, not points

### Timing & Patience

```
┌─────────────────────────────────────────────────────────────┐
│  QUESTION ASKED                                             │
│       │                                                     │
│       ▼                                                     │
│  [Wait 3-5 seconds] ─── Answer received ───► Process answer │
│       │                                                     │
│       ▼ (silence)                                          │
│  [Gentle encouragement]                                     │
│  "Nimm dir Zeit..." / "Prends ton temps..."                │
│       │                                                     │
│       ▼                                                     │
│  [Wait 4-6 more seconds]                                    │
│       │                                                     │
│       ├─── Answer received ───► Process answer              │
│       │                                                     │
│       ▼ (still silence)                                    │
│  [Offer help]                                               │
│  "Soll ich einen Tipp geben?" /                            │
│  "Möchte jemand helfen?"                                   │
│       │                                                     │
│       ▼                                                     │
│  [Wait 3-4 seconds for help offer response]                │
│       │                                                     │
│       ├─── Help given ───► Acknowledge, re-ask             │
│       │                                                     │
│       ▼ (no help)                                          │
│  [Provide answer kindly]                                    │
│  "Kein Problem! Die Antwort ist..."                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Timing Parameters (Mode-Dependent)

| Phase | Calm Mode | Challenge Mode |
|-------|-----------|----------------|
| Initial wait | 5 sec | 3 sec |
| Post-encouragement wait | 6 sec | 4 sec |
| Help offer wait | 4 sec | 3 sec |
| Between questions | 2 sec | 1 sec |

### Wrong Person Answers

If someone other than the named person answers:

**Approach: Graceful acceptance**
```
LLM: "Anna, comment dit-on 'le chat'?"
Luis: "Die Katze!"
LLM: "Oui Luis, c'est ça! Très bien.
      Anna, tu savais aussi? Pas grave.
      Question suivante pour toi, Anna..."
```

- Accept the answer (don't punish helpfulness)
- Acknowledge both players
- Give the skipped player the next turn
- Track participation to maintain fairness

### Detecting Confusion

LLM should notice and adapt to:

| Signal | Response |
|--------|----------|
| Multiple voices at once | "Einer nach dem anderen! Anna zuerst." |
| Wrong language answer | Gently redirect: "En français?" |
| Very quiet session | "Seid ihr noch da? Alles okay?" |
| Frustrated tones | "Das ist schwierig, ich weiß. Machen wir was leichteres?" |
| Laughter/fun | Join in: "Ha! Das war lustig. Okay, weiter..." |

---

## Session Flow

### 1. Setup Phase
```
LLM: "Bonjour! Willkommen zum Lernkreis.
      Wer spielt heute mit? Sagt mir eure Namen!"

[Players announce names]

LLM: "Super! Anna, Luis und Mia.
      Schaut noch jemand zu?"

[Spectators announce or silence]

LLM: "Was sollen wir üben? Ich kann aus eurem
      Vokabelheft nehmen, oder wir machen ein Thema."

[Content selection via voice or UI tap]

LLM: "Alles klar! Ich spreche hauptsächlich Französisch.
      Sagt 'auf Deutsch' wenn ihr Hilfe braucht.
      C'est parti!"
```

### 2. Main Loop
```
while (session active):
    1. Select next player (least questions, or open)
    2. Generate question from content source
    3. Ask question in target language
    4. Wait for answer (with patience cycle)
    5. Process answer (correct/incorrect/help needed)
    6. Give feedback in target language
    7. Update participation tracking
    8. Check for stop signals
```

### 3. End Phase
```
LLM: "C'est fini pour aujourd'hui! Gut gemacht, alle zusammen.

      [Participant Summary]
      Anna: 8 Fragen, 6 richtig - super!
      Luis: 7 Fragen, 5 richtig - très bien!
      Mia: 8 Fragen, 7 richtig - fantastisch!

      Am schwierigsten waren: 'aller', 'venir', 'grand-mère'

      Ihr habt euch 4 mal gegenseitig geholfen -
      das ist echtes Teamwork!

      À bientôt! Bis zum nächsten Mal!"
```

---

## End-of-Session Summary

### For Players
- Questions answered
- Correct answers
- Accuracy percentage
- Hardest words (got wrong)
- Times helped others
- Times received help
- Streak achievements

### For Spectators
- Session duration
- Total questions asked
- Group accuracy
- Hints given
- Difficult words to practice later

### Summary Display

```
┌─────────────────────────────────────────────────────────────┐
│                    📊 ZUSAMMENFASSUNG                       │
│                                                             │
│  Dauer: 12 Minuten    Fragen: 23    Sprache: Französisch   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  👤 Anna                                            │   │
│  │  ████████░░ 8/10 richtig (80%)                     │   │
│  │  🔥 Längste Serie: 4                                │   │
│  │  🤝 Hat 2x geholfen                                 │   │
│  │  📚 Üben: "venir", "aller"                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  👤 Luis                                            │   │
│  │  ██████░░░░ 6/10 richtig (60%)                     │   │
│  │  🔥 Längste Serie: 2                                │   │
│  │  🤝 Hat 1x geholfen, 2x Hilfe bekommen             │   │
│  │  📚 Üben: "grand-mère", "école", "venir"           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  👁 Mama (Zuschauer)                                │   │
│  │  Tipps gegeben: 3                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🌟 TEAM-STATISTIK                                         │
│  Zusammen: 17/23 richtig (74%)                             │
│  Gegenseitige Hilfe: 5x                                    │
│                                                             │
│  [Nochmal spielen]  [Schwierige Wörter üben]  [Fertig]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## LLM Integration

### Model Selection
**Primary:** Gemini 2.0 Flash
- Fast response time (critical for conversation)
- Good multilingual support
- Already integrated for voice analysis

### System Prompt Structure
```
You are a friendly, encouraging language tutor running a group
vocabulary practice session.

Current session:
- Players: {player_names}
- Spectators: {spectator_names}
- Target language: {language}
- Content: {content_description}
- Immersion level: {level}

Guidelines:
- Speak primarily in {target_language}
- Switch to German when explicitly asked or when players struggle
- Keep energy positive and encouraging
- Track turn fairness (current counts: {participation})
- Celebrate correct answers enthusiastically
- Handle mistakes gently with immediate teaching
- Invite spectator help when players are stuck
- Adapt difficulty based on success rate

Current conversation:
{conversation_history}
```

### Conversation Management
- Maintain rolling context window
- Track participation counts in context
- Include recent Q&A pairs for continuity
- Summarize older history to save tokens

---

## Data Model

```typescript
interface GroupVoiceSession {
  id: string

  // Participants
  players: GroupParticipant[]
  spectators: GroupParticipant[]

  // Content
  contentSource: ContentSource
  targetLanguage: Language
  immersionLevel: 'beginner' | 'intermediate' | 'advanced' | 'full'

  // Conversation
  conversationHistory: ConversationTurn[]

  // Timing settings
  timingMode: 'calm' | 'challenge'

  // Session tracking (not persisted beyond session)
  startedAt: Date
  questionsAsked: number

  // Difficult words (for summary)
  difficultWords: {
    word: string
    translation: string
    missedBy: string[]  // Player names
  }[]
}

interface GroupParticipant {
  name: string
  oderId?: string  // Optional link to account
  role: 'player' | 'spectator'
  joinedAt: Date

  // Player stats
  questionsAnswered: number
  correctAnswers: number
  hintsGiven: number
  hintsReceived: number
  currentStreak: number
  maxStreak: number
}

interface ContentSource {
  type: 'sections' | 'book' | 'topic' | 'mixed'
  sectionIds?: string[]
  bookId?: string
  topic?: string
}

interface ConversationTurn {
  role: 'assistant' | 'user'
  content: string
  speaker?: string  // For user turns, who spoke (if known)
  timestamp: Date
  metadata?: {
    questionTarget?: string  // Who was asked
    wasCorrect?: boolean
    helpedBy?: string
  }
}
```

---

## Future Considerations

- Remote spectators (video call integration)
- Persistent group progress (optional accounts)
- Teacher dashboard for classroom use
- Competitive league between groups
- Story mode for narrative-driven learning
- Voice identification (if technology improves)
