# Future AI Features: Lessons from Praktika

**Source:** OpenAI case study on Praktika (January 2026)
**Status:** Research notes for future consideration

---

## Praktika's Multi-Agent Architecture

Praktika uses a sophisticated multi-agent system for language learning:

| Agent | Model | Role |
|-------|-------|------|
| **Lesson Agent** | GPT-5.2 | Primary tutor interaction, blends personality + context + goals |
| **Student Progress Agent** | GPT-5.2 | Background tracking of fluency, accuracy, vocabulary, mistakes |
| **Learning Planning Agent** | GPT-5 Pro | Long-term progression, sequencing, activity selection |

**Key insight:** Agents share a persistent memory layer storing learner goals, preferences, and past mistakes. Memory is retrieved *after* the learner responds (not preloaded), making interactions feel attentive rather than robotic.

**Result:** 24% increase in Day-1 retention, doubled revenue after introducing long-term memory.

---

## Applicable Concepts for Vocabulary Trainer

### 1. Progress Pattern Agent (Medium-term)

**Current state:** Basic spaced repetition based on correct/incorrect answers.

**Future possibility:** Background analysis that identifies patterns:
- Words consistently confused (e.g., "le/la" gender mistakes)
- Time-of-day performance variations
- Types of errors (spelling vs. meaning vs. gender)
- Vocabulary categories that need reinforcement

**Implementation approach:**
```
After each practice session:
  → Store detailed interaction data (not just pass/fail)
  → Periodically run analysis to identify patterns
  → Surface insights to learner: "You often confuse masculine/feminine articles"
  → Adjust spaced repetition weights based on error patterns
```

### 2. Adaptive Practice Sessions (Medium-term)

**Current state:** Fixed practice modes (flashcards, multiple choice, typing).

**Future possibility:** Dynamic session adjustment:
- Detect frustration (many wrong answers in a row) → switch to easier words or different mode
- Detect mastery (quick correct answers) → increase difficulty or move on
- "The system can switch to a completely different exercise if the learner isn't feeling it"

**Implementation approach:**
```
During practice session:
  → Track rolling accuracy and response time
  → If accuracy drops below threshold → inject easier "confidence boosters"
  → If accuracy high + fast responses → skip ahead or increase difficulty
  → Allow explicit "this is too hard/easy" feedback
```

### 3. Persistent Learner Profile (Long-term)

**Current state:** Per-vocabulary mastery scores, streak tracking.

**Future possibility:** Rich learner profile:
- Learning style preferences (visual vs. audio vs. typing)
- Optimal session length before fatigue
- Vocabulary category strengths/weaknesses
- Historical mistake patterns with specific words

**Data to capture:**
- Response times per word (not just correct/incorrect)
- Session abandonment points
- Mode preferences (which modes get completed vs. skipped)
- Time between sessions and performance correlation

### 4. Parent/Teacher Insight Agent (Long-term)

**Current state:** Leaderboard and basic stats in network view.

**Future possibility:** AI-generated progress summaries for parents/teachers:
- "Emma has been practicing consistently but struggles with verb conjugations"
- "Max mastered 15 new words this week, particularly food vocabulary"
- "Consider reviewing Unit 3 before the test - accuracy is below average"

**Implementation approach:**
```
Weekly/on-demand for network admins:
  → Aggregate child's practice data
  → Run through LLM to generate natural language summary
  → Highlight concerns and achievements
  → Suggest specific review areas
```

### 5. Conversational Practice Mode (Long-term)

**Current state:** Voice practice with pronunciation feedback.

**Future possibility:** Contextual conversation using learned vocabulary:
- AI creates scenarios using the learner's vocabulary
- "You're at a French bakery. Order a croissant using words you've learned."
- Conversation naturally incorporates target vocabulary
- Mistakes become teaching moments, not failures

**Key Praktika insight:** Speech recognition must handle non-native speech gracefully. Learners hesitate, restart, and mispronounce - the system shouldn't penalize this.

### 6. Memory-Aware Feedback (Medium-term)

**Current state:** Generic feedback ("Correct!" / "Try again").

**Future possibility:** Context-aware feedback retrieved at moment of interaction:
- "You got this wrong last time too - remember: 'la maison' is feminine"
- "Great! You've struggled with this word before but now you've got it"
- "This word is similar to 'maison' which you know well"

**Key Praktika insight:** "If a learner makes a mistake right now, the tutor responds to *that* mistake, not one from yesterday."

---

## Implementation Considerations

### Privacy
- All learner data should remain local-first
- AI analysis can run on-device or with explicit consent for cloud processing
- Parent/teacher insights require explicit data sharing permissions

### Cost
- LLM calls are expensive; batch analysis during off-peak times
- Use smaller models (Haiku-class) for real-time feedback
- Cache common patterns and insights

### Complexity
- Start with simple heuristics before adding AI
- Each feature should work without AI, with AI as enhancement
- Avoid over-engineering; a 12-year-old should still find it simple

---

## Priority Assessment

| Feature | Impact | Complexity | Priority |
|---------|--------|------------|----------|
| Adaptive session difficulty | High | Medium | P1 |
| Memory-aware feedback | Medium | Low | P1 |
| Progress pattern detection | High | Medium | P2 |
| Parent/teacher summaries | Medium | High | P2 |
| Persistent learner profile | High | Medium | P2 |
| Conversational practice | High | Very High | P3 |

---

## Next Steps

1. **Immediate:** Enhance practice session data capture (response times, mode switches, session completion)
2. **Short-term:** Add simple adaptive difficulty (confidence boosters when struggling)
3. **Medium-term:** Build learner profile infrastructure for future AI features
4. **Long-term:** Evaluate API costs and feasibility for AI-generated insights

---

## References

- [Inside Praktika's conversational approach to language learning](https://openai.com/index/praktika/) - OpenAI, January 2026
