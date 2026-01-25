# Voice AI Providers Research (January 2026)

Comprehensive research on TTS, STT, and real-time voice AI providers for the Lernkreis (group learning) feature, focusing on:
- **Speaker diarization** (identifying who said what)
- **Low latency** (sub-second response times)
- **Full duplex / interruptible conversations**

---

## Executive Summary

For the Lernkreis feature with multiple speakers, there are three main architectural approaches:

| Approach | Best For | Key Players |
|----------|----------|-------------|
| **Full-duplex speech-to-speech** | Single-speaker conversations, interruptible | OpenAI Realtime, Gemini Live, Hume EVI |
| **Modular pipeline (STT + LLM + TTS)** | Multi-speaker with diarization, flexibility | Deepgram/AssemblyAI + Any LLM + ElevenLabs |
| **Orchestration platforms** | Rapid prototyping, telephony | Vapi, LiveKit Agents |

**Recommendation for Lernkreis**: A modular pipeline with **AssemblyAI Universal-Streaming** (STT with fast latency) or **Deepgram Nova-3** (best diarization) + **Gemini 2.0 Flash** (LLM) + **ElevenLabs Flash** (TTS) provides the best balance of multi-speaker support, low latency, and cost.

---

## Full-Duplex Speech-to-Speech APIs

These provide end-to-end voice conversations with native interruption support, but typically don't support multi-speaker diarization.

### OpenAI Realtime API

The gold standard for full-duplex voice AI, now with production-ready features.

| Aspect | Details |
|--------|---------|
| **Latency** | ~200ms response time |
| **Interruption** | Native barge-in support, graceful recovery |
| **Connection** | WebSocket, WebRTC, SIP |
| **Languages** | Multilingual with new voices (Marin, Cedar) |
| **Unique** | Vision input support, MCP server integration |

**Pricing** (token-based):
- Audio input: $0.06/min ($32/1M tokens)
- Audio output: $0.24/min ($64/1M tokens)
- **Estimated per conversation**: ~$0.30/min

**Limitations**: No speaker diarization, locked to OpenAI models.

**Links**: [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) | [Introducing gpt-realtime](https://openai.com/index/introducing-gpt-realtime/)

---

### Google Gemini Live API

Google's answer to OpenAI Realtime, with native audio understanding.

| Aspect | Details |
|--------|---------|
| **Model** | Gemini 2.5 Flash Native Audio |
| **Latency** | ~600ms first token |
| **Voices** | 30 HD voices in 24 languages |
| **Connection** | WebSocket (stateful) |
| **Unique** | Dynamic thinking, affective dialog (adapts tone to user) |

**Features**:
- Barge-in capability for responsive interactions
- Live speech-to-speech translation
- Multimodal (audio, video, text)
- Thinking capabilities with configurable budget

**Pricing**: Uses standard Gemini token pricing, generally cheaper than OpenAI.

**Limitations**: No speaker diarization in real-time mode.

**Links**: [Gemini Live API](https://ai.google.dev/gemini-api/docs/live) | [Gemini 2.5 Native Audio](https://blog.google/products/gemini/gemini-audio-model-updates/)

---

### Hume AI EVI (Empathic Voice Interface)

Unique focus on emotional intelligence in voice AI.

| Aspect | Details |
|--------|---------|
| **Model** | EVI 3 / EVI 4-mini (October 2025) |
| **Latency** | Competitive with OpenAI |
| **Voices** | 100,000+ custom voices with inferred personalities |
| **Languages** | 11 languages (Arabic, English, French, German, Hindi, Italian, Japanese, Korean, Portuguese, Russian, Spanish) |
| **Unique** | Understands emotional tone, responds empathically |

**Key Differentiators**:
- Processes tune, rhythm, and timbre of speech
- Knows when to speak based on emotional cues
- Voice cloning with <30s recordings
- Rated higher than GPT-4o on empathy and expressiveness in blind tests

**Pricing**: Octave 2 (October 2025) brought 50% cost reduction.

**Best For**: Educational contexts where emotional support matters (struggling learners, encouragement).

**Links**: [Hume AI](https://www.hume.ai/) | [EVI 3 Announcement](https://www.hume.ai/blog/introducing-evi-3)

---

## Speech-to-Text (STT) APIs

For multi-speaker scenarios, a separate STT with diarization is essential.

### Deepgram Nova-3

The fastest STT with excellent diarization.

| Aspect | Details |
|--------|---------|
| **Accuracy** | 54% lower WER than competitors |
| **Latency** | <300ms real-time |
| **Diarization** | 40x faster than competitors, unlimited speakers |
| **Languages** | 36+ with code-switching support |
| **Special** | First ASR to handle live code-switching across 10 languages |

**Pricing**:
- Real-time: $0.0059/min ($0.35/hr)
- Batch: $0.0043/min ($0.26/hr)
- Diarization add-on: ~$0.001-0.002/min

**Best For**: Multi-speaker scenarios with mixed languages (e.g., German/French in Lernkreis).

**Links**: [Deepgram Nova-3](https://deepgram.com/learn/introducing-nova-3-speech-to-text-api) | [Diarization Docs](https://developers.deepgram.com/docs/diarization)

---

### AssemblyAI Universal-Streaming

Purpose-built for voice agents with immutable transcripts.

| Aspect | Details |
|--------|---------|
| **Accuracy** | 91% word accuracy on noisy audio |
| **Latency** | 307ms median (41% faster than Deepgram Nova-3) |
| **Diarization** | 10.1% DER improvement in 2024-2025 |
| **Languages** | English, Spanish, French, German, Italian, Portuguese |
| **Special** | Immutable transcriptions (no rewrites) |

**Pricing**: $0.15/hr for streaming

**Key Advantage**: Transcripts don't change after emission—crucial for real-time UI updates.

**Links**: [Universal-Streaming](https://www.assemblyai.com/universal-streaming) | [Streaming Docs](https://www.assemblyai.com/docs/universal-streaming)

---

### Comparison: Deepgram vs AssemblyAI

| Feature | Deepgram Nova-3 | AssemblyAI Universal-Streaming |
|---------|-----------------|-------------------------------|
| Median latency | ~300ms | 307ms |
| P99 latency | ~500ms | 1,012ms |
| Diarization | Excellent, 40x faster | Good, 10% DER |
| Code-switching | 10 languages | 6 languages |
| Transcript style | Partial (can rewrite) | Immutable |
| Noise handling | Good | 73% fewer false outputs |
| Price | $0.35/hr | $0.15/hr |

**Recommendation**: Deepgram for best diarization and multilingual, AssemblyAI for cost and immutable transcripts.

---

## Text-to-Speech (TTS) APIs

### ElevenLabs

Industry leader in voice quality and variety.

| Model | Latency | Best For |
|-------|---------|----------|
| **Flash v2.5** | ~75ms | Real-time voice agents |
| **Turbo v2.5** | ~250-300ms | Interactive use cases |
| **Multilingual v2** | ~300ms | High quality, all languages |

**Features**:
- 5,000+ voices in 70+ languages
- Voice cloning
- Emotion control
- Streaming output

**Pricing**:
- Starter: $5/mo for 30k characters
- Business: $0.08/min for conversational AI
- Enterprise: Volume discounts available

**Links**: [ElevenLabs TTS](https://elevenlabs.io/text-to-speech-api) | [Conversational AI](https://elevenlabs.io/conversational-ai)

---

### Comparison: TTS Options

| Provider | Latency | Quality | Languages | Price |
|----------|---------|---------|-----------|-------|
| ElevenLabs Flash | 75ms | Excellent | 70+ | $0.08/min |
| OpenAI TTS | ~200ms | Very Good | 50+ | $15/1M chars |
| Google Cloud TTS | ~300ms | Good | 40+ | $4/1M chars |
| Amazon Polly | ~200ms | Good | 30+ | $4/1M chars |

---

## Orchestration Platforms

These combine STT, LLM, and TTS into unified platforms.

### LiveKit Agents

Open-source framework for building voice AI agents.

| Aspect | Details |
|--------|---------|
| **Architecture** | WebRTC-based, agent as room participant |
| **Pipeline** | Modular STT-LLM-TTS or speech-to-speech |
| **Features** | Semantic turn detection, interruption handling |
| **Deployment** | Self-hosted or cloud |
| **Telephony** | Built-in SIP support |

**Key Innovation**: AI agent becomes a full WebRTC participant, enabling true real-time interaction.

**Best For**: Custom implementations requiring full control.

**Links**: [LiveKit Agents](https://github.com/livekit/agents) | [Documentation](https://docs.livekit.io/agents/)

---

### Vapi

Developer-friendly voice AI platform with excellent interruption handling.

| Aspect | Details |
|--------|---------|
| **Latency** | 500-700ms voice-to-voice |
| **Interruption** | Advanced barge-in with backchannel detection |
| **LLM Support** | OpenAI, Claude, Gemini, custom |
| **Telephony** | Full phone integration |

**Unique Features**:
- Distinguishes true interruptions from acknowledgments ("right", "okay")
- Configurable backoff timing after interruption
- Background noise filtering

**Pricing**: Per-minute with various tiers.

**Links**: [Vapi](https://vapi.ai/) | [Voice Pipeline Config](https://docs.vapi.ai/customization/voice-pipeline-configuration)

---

## Speaker Diarization Deep Dive

Critical for Lernkreis where we need to know which student is speaking.

### State of the Art (2026)

- Top systems handle 1-16 speakers dynamically
- 80+ languages supported
- DER (Diarization Error Rate) below 10% considered production-ready
- Real-time diarization now feasible with optimized models

### Education-Specific Challenges

Research from EDM 2025 on noisy classrooms shows:
- Children's voices are harder to diarize
- Background noise significantly impacts accuracy
- Hybrid VAD models achieve 17% DER for teacher-student scenarios

### Best Options for Lernkreis

| Provider | Real-time | Accuracy | Price | Notes |
|----------|-----------|----------|-------|-------|
| **Deepgram** | Yes | Excellent | +$0.002/min | Best overall |
| **AssemblyAI** | Yes | Very Good | Included | Improving rapidly |
| **Gladia + pyannoteAI** | Yes | Excellent | Contact | State-of-the-art accuracy |
| **NVIDIA Streaming Sortformer** | Yes | Good | Self-hosted | Best for on-device |

**Links**: [AssemblyAI Diarization](https://www.assemblyai.com/blog/top-speaker-diarization-libraries-and-apis) | [Gladia + pyannoteAI](https://www.gladia.io/blog/gladia-x-pyannoteai-speaker-diarization-and-the-future-of-voice-ai)

---

## Recommended Architecture for Lernkreis

### Option A: Maximum Flexibility (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    LERNKREIS SESSION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Microphone ──► Deepgram Nova-3 ──► Transcript + Speaker ID │
│                 (STT + Diarization)                         │
│                        │                                    │
│                        ▼                                    │
│              Gemini 2.0 Flash ──► Response                  │
│                   (LLM)                                     │
│                        │                                    │
│                        ▼                                    │
│              ElevenLabs Flash ──► Speaker                   │
│                   (TTS)                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Estimated Latency**: 600-900ms end-to-end
**Estimated Cost**: ~$0.05-0.10/min

**Pros**:
- Full speaker diarization
- Know which student answered
- Can track individual progress
- Flexible LLM choice

**Cons**:
- Higher latency than full-duplex
- More complex to implement
- Interruption handling requires careful design

---

### Option B: Premium Full-Duplex (Single Speaker Focus)

```
┌─────────────────────────────────────────────────────────────┐
│                    LERNKREIS SESSION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Microphone ──► OpenAI Realtime API ──► Speaker             │
│                 (Full duplex S2S)                           │
│                        │                                    │
│                        ▼                                    │
│              App tracks turn order                          │
│              (Software-based speaker ID)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Estimated Latency**: 200-400ms
**Estimated Cost**: ~$0.30/min

**Pros**:
- Lowest latency
- Native interruption support
- Most natural conversation feel

**Cons**:
- No true speaker diarization
- Must rely on turn-taking protocol
- Higher cost

---

### Option C: Emotional Intelligence Focus

```
┌─────────────────────────────────────────────────────────────┐
│                    LERNKREIS SESSION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Microphone ──► Hume EVI 3 ──► Empathic Response            │
│                 (Emotional S2S)                             │
│                        │                                    │
│                        ▼                                    │
│              Understands frustration, excitement            │
│              Adapts encouragement style                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Best For**: When emotional support is priority over speaker identification.

---

## Implementation Roadmap

### Phase 1: Current (Gemini-based)
Keep existing Gemini 2.0 Flash integration for LLM conversation.
- Works well for turn-based group sessions
- No real-time audio, but functional

### Phase 2: Add Real-Time STT
Integrate Deepgram Nova-3 or AssemblyAI:
- Enable continuous listening
- Add speaker diarization
- Improve responsiveness

### Phase 3: Upgrade TTS
Add ElevenLabs for voice output:
- Lower latency (75ms vs current)
- Better voice quality
- More voice variety

### Phase 4: Consider Full-Duplex
Evaluate OpenAI Realtime or Gemini Live for specific modes:
- "Challenge mode" where speed matters
- 1-on-1 practice sessions

---

## Cost Comparison (10-minute session)

| Architecture | STT | LLM | TTS | Total |
|--------------|-----|-----|-----|-------|
| Current (Web Speech + Gemini) | Free | ~$0.01 | Free | ~$0.01 |
| Option A (Deepgram + Gemini + ElevenLabs) | $0.06 | $0.01 | $0.80 | ~$0.87 |
| Option B (OpenAI Realtime) | — | — | — | ~$3.00 |
| Option C (Hume EVI) | — | — | — | ~$1.50 |

**Note**: Current implementation is essentially free but lacks real-time capabilities.

---

## References

### Full-Duplex APIs
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Google Gemini Live API](https://ai.google.dev/gemini-api/docs/live)
- [Hume AI EVI](https://www.hume.ai/empathic-voice-interface)

### STT Providers
- [Deepgram Nova-3](https://deepgram.com/learn/introducing-nova-3-speech-to-text-api)
- [AssemblyAI Universal-Streaming](https://www.assemblyai.com/universal-streaming)
- [Gladia](https://www.gladia.io/)

### TTS Providers
- [ElevenLabs](https://elevenlabs.io/text-to-speech-api)

### Orchestration
- [LiveKit Agents](https://docs.livekit.io/agents/)
- [Vapi](https://docs.vapi.ai/)

### Speaker Diarization
- [AssemblyAI Diarization Guide](https://www.assemblyai.com/blog/top-speaker-diarization-libraries-and-apis)
- [pyannoteAI](https://www.pyannote.ai/)
- [EDM 2025 Classroom Diarization](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.short-papers.199/index.html)

### Pricing & Comparisons
- [Voice AI Providers Comparison](https://comparevoiceai.com/providers)
- [OpenAI Realtime Pricing Calculator](https://skywork.ai/blog/agent/openai-realtime-api-pricing-2025-cost-calculator/)
- [ElevenLabs vs OpenAI Comparison](https://elevenlabs.io/blog/comparing-elevenlabs-conversational-ai-v-openai-realtime-api)
