# LLM Provider Options

This document tracks LLM options for conversational features like group voice mode and voice analysis.

**Current choice:** Gemini 2.0 Flash (via Google AI API)

---

## Requirements

For voice-based conversation, we need:
- **Low latency** (<1s response time for natural conversation)
- **Multilingual support** (German, French, Spanish, Italian/Latin)
- **Streaming** (optional but nice for longer responses)
- **Cost-effective** (many interactions per session)
- **Good instruction following** (maintain persona, track state)

---

## Provider Comparison

### Google Gemini

| Model | Latency | Quality | Cost | Notes |
|-------|---------|---------|------|-------|
| **Gemini 2.0 Flash** | ~300ms | Very good | Free tier generous | **Recommended** |
| Gemini 2.0 Flash-Lite | ~200ms | Good | Even cheaper | Faster but less capable |
| Gemini 1.5 Pro | ~800ms | Excellent | Higher | Overkill for this use case |
| Gemini 1.5 Flash | ~400ms | Very good | Low | Previous gen, still solid |

**Pros:**
- Already integrated (same API key as TTS/Vision)
- Generous free tier
- Excellent multilingual performance
- Fast response times

**Cons:**
- Occasional availability issues
- Less consistent than Claude for complex instructions

**Integration:** Already have Google API key infrastructure

---

### Anthropic Claude

| Model | Latency | Quality | Cost | Notes |
|-------|---------|---------|------|-------|
| Claude 3.5 Haiku | ~400ms | Very good | $0.25/1M input | Fast and cheap |
| Claude 3.5 Sonnet | ~800ms | Excellent | $3/1M input | Best instruction following |
| Claude Opus 4.5 | ~1.5s | Best | $15/1M input | Overkill |

**Pros:**
- Exceptional instruction following
- Very consistent persona maintenance
- Excellent at tracking complex state
- Strong multilingual (especially European languages)

**Cons:**
- Requires separate API key
- No free tier
- Slightly higher latency than Gemini Flash

**Integration:** Would need new API key setup in settings

---

### OpenAI

| Model | Latency | Quality | Cost | Notes |
|-------|---------|---------|------|-------|
| GPT-4o-mini | ~350ms | Good | $0.15/1M input | Best value |
| GPT-4o | ~600ms | Very good | $2.50/1M input | Solid all-rounder |
| GPT-4-turbo | ~1s | Excellent | $10/1M input | Older, slower |

**Pros:**
- Most widely used, well-documented
- Good multilingual support
- Reliable availability

**Cons:**
- Requires separate API key
- GPT-4o-mini can be inconsistent with complex prompts
- Less European language focus than others

**Integration:** Would need new API key setup

---

### Open Source / Self-Hosted

| Option | Latency | Quality | Cost | Notes |
|--------|---------|---------|------|-------|
| Llama 3.1 70B (Groq) | ~200ms | Good | Free tier | Very fast via Groq |
| Mixtral 8x7B (Together) | ~400ms | Decent | Low | Good for simple tasks |
| Local Ollama | Varies | Varies | Free | Requires local setup |

**Pros:**
- Can be very cheap or free
- Groq offers exceptional speed
- No vendor lock-in

**Cons:**
- Quality varies significantly
- Multilingual support often weaker
- More setup complexity

---

## Recommendation by Use Case

### Voice Analysis (Current)
**Gemini 2.0 Flash** - Already working, good at extracting answers

### Group Voice Mode (New)
**Gemini 2.0 Flash** - Start here for simplicity
- Same API key as existing features
- Fast enough for conversation
- Good multilingual for European languages

**Future consideration:** Claude 3.5 Haiku if we need better instruction following for complex group dynamics

### Story Mode (Future)
**Claude 3.5 Sonnet** - Best for maintaining narrative consistency

---

## Cost Estimation

### Group Voice Session (15 minutes)
- ~50 conversation turns
- ~500 tokens per turn average
- Total: ~25,000 tokens per session

| Provider | Model | Cost per Session |
|----------|-------|------------------|
| Google | Gemini 2.0 Flash | ~$0.002 (or free tier) |
| Anthropic | Claude 3.5 Haiku | ~$0.006 |
| OpenAI | GPT-4o-mini | ~$0.004 |

All options are very affordable for typical usage.

---

## Implementation Notes

### Current (Gemini)
```typescript
// Already in voice-analyzer.ts
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
```

### Adding Claude (Future)
```typescript
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

// Would need in settings:
anthropicApiKey: string | null
llmProvider: 'gemini' | 'claude' | 'openai'
```

### Adding OpenAI (Future)
```typescript
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// Would need in settings:
openaiApiKey: string | null
```

---

## Migration Path

1. **Now:** Use Gemini 2.0 Flash for everything
2. **If needed:** Abstract LLM calls behind provider interface
3. **Later:** Add alternative providers behind feature flag
4. **Eventually:** Let users choose in settings

```typescript
// Future abstraction
interface LLMProvider {
  chat(messages: Message[], options?: LLMOptions): Promise<string>
  stream(messages: Message[], options?: LLMOptions): AsyncGenerator<string>
}

class GeminiProvider implements LLMProvider { ... }
class ClaudeProvider implements LLMProvider { ... }
class OpenAIProvider implements LLMProvider { ... }
```

---

## References

- [Gemini API Docs](https://ai.google.dev/docs)
- [Claude API Docs](https://docs.anthropic.com/claude/reference)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Groq API](https://console.groq.com/docs)
