import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UnifiedTTSService } from '@/lib/services/unified-tts'

interface MockWebTTS {
  speak: ReturnType<typeof vi.fn>
  isAvailable: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  isSpeaking: ReturnType<typeof vi.fn>
}

interface MockGoogleTTS {
  speak: ReturnType<typeof vi.fn>
  isAvailable: ReturnType<typeof vi.fn>
  setEnabled: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  isSpeaking: ReturnType<typeof vi.fn>
}

function createServiceHarness() {
  const service = new UnifiedTTSService()
  const webTTS: MockWebTTS = {
    speak: vi.fn(async () => ({ success: true })),
    isAvailable: vi.fn(() => true),
    stop: vi.fn(),
    isSpeaking: vi.fn(() => false),
  }
  const googleTTS: MockGoogleTTS = {
    speak: vi.fn(async () => ({ success: true })),
    isAvailable: vi.fn(() => true),
    setEnabled: vi.fn(),
    stop: vi.fn(),
    isSpeaking: vi.fn(() => false),
  }

  ;(service as unknown as { webTTS: MockWebTTS }).webTTS = webTTS
  ;(service as unknown as { googleTTS: MockGoogleTTS }).googleTTS = googleTTS

  return { service, webTTS, googleTTS }
}

describe('UnifiedTTSService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('uses premium Google voices when voice quality is set to wavenet', async () => {
    const { service, googleTTS } = createServiceHarness()
    service.configure({
      provider: 'google-cloud',
      googleEnabled: true,
      googleVoiceType: 'wavenet',
    })

    const result = await service.speak('Hallo', 'german', { rate: 1.1, pitch: 1.2 })

    expect(googleTTS.setEnabled).toHaveBeenCalledWith(true)
    const googleCall = googleTTS.speak.mock.calls[0]
    expect(googleCall?.[0]).toBe('Hallo')
    expect(googleCall?.[1]).toBe('german')
    expect(googleCall?.[2]).toMatchObject({
      speakingRate: 1.1,
      useWaveNet: true,
    })
    expect(googleCall?.[2]?.pitch).toBeCloseTo(4)
    expect(result.success).toBe(true)
    expect(result.provider).toBe('google-cloud')
  })

  it('switches to standard Google voices when voice quality is set to standard', async () => {
    const { service, googleTTS } = createServiceHarness()
    service.configure({
      provider: 'google-cloud',
      googleEnabled: true,
      googleVoiceType: 'standard',
    })

    await service.speak('Bonjour', 'french')

    expect(googleTTS.speak).toHaveBeenCalledWith(
      'Bonjour',
      'french',
      expect.objectContaining({
        useWaveNet: false,
      })
    )
  })

  it('uses override language and returns warning when pronunciation language is forced', async () => {
    const { service, webTTS } = createServiceHarness()
    service.configure({
      provider: 'web-speech',
      ttsLanguageOverride: 'spanish',
    })

    const result = await service.speak('Haus', 'german')

    expect(webTTS.speak).toHaveBeenCalledWith(
      'Haus',
      'spanish',
      expect.objectContaining({ rate: 0.9, pitch: 1, volume: 1 })
    )
    expect(result.success).toBe(true)
    expect(result.provider).toBe('web-speech')
    expect(result.requestedLanguage).toBe('german')
    expect(result.effectiveLanguage).toBe('spanish')
    expect(result.warning).toContain('Aussprache-Sprache überschrieben')
  })

  it('falls back to Web Speech when Google TTS fails', async () => {
    const { service, webTTS, googleTTS } = createServiceHarness()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    googleTTS.speak.mockResolvedValueOnce({ success: false, error: 'quota exceeded' })
    service.configure({
      provider: 'google-cloud',
      googleEnabled: true,
      googleVoiceType: 'wavenet',
      ttsLanguageOverride: 'latin',
    })

    const result = await service.speak('Haus', 'german')

    expect(googleTTS.speak).toHaveBeenCalledTimes(1)
    expect(webTTS.speak).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
    expect(result.provider).toBe('web-speech')
    expect(result.effectiveLanguage).toBe('latin')
    expect(result.warning).toContain('Google TTS fehlgeschlagen')
    expect(warnSpy).toHaveBeenCalled()
  })
})
