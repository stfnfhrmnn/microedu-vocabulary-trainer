/**
 * Sound system using Web Audio API
 * Generates sounds programmatically - no audio files needed
 */

export type SoundType =
  | 'correct'
  | 'incorrect'
  | 'flip'
  | 'tap'
  | 'success'
  | 'levelUp'
  | 'achievement'
  | 'streak'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      console.warn('Web Audio API not supported')
      return null
    }
  }

  // Resume if suspended (needed for iOS)
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  return audioContext
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  fadeOut: boolean = true
): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

  gainNode.gain.setValueAtTime(volume, ctx.currentTime)

  if (fadeOut) {
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
  }

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

function playChord(
  frequencies: number[],
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15
): void {
  frequencies.forEach((freq) => {
    playTone(freq, duration, type, volume)
  })
}

function playSequence(
  notes: Array<{ freq: number; duration: number; delay: number }>,
  type: OscillatorType = 'sine',
  volume: number = 0.3
): void {
  const ctx = getAudioContext()
  if (!ctx) return

  notes.forEach(({ freq, duration, delay }) => {
    setTimeout(() => {
      playTone(freq, duration, type, volume)
    }, delay * 1000)
  })
}

export const sounds = {
  // Bright, happy ding for correct answers
  correct: (volume: number = 0.3) => {
    playTone(880, 0.15, 'sine', volume) // A5
    setTimeout(() => playTone(1108.73, 0.2, 'sine', volume * 0.8), 50) // C#6
  },

  // Soft, low boop for incorrect (not harsh)
  incorrect: (volume: number = 0.25) => {
    playTone(220, 0.15, 'sine', volume) // A3
    setTimeout(() => playTone(196, 0.2, 'sine', volume * 0.7), 50) // G3
  },

  // Quick whoosh for card flip
  flip: (volume: number = 0.15) => {
    const ctx = getAudioContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  },

  // Subtle click for button taps
  tap: (volume: number = 0.1) => {
    playTone(600, 0.05, 'sine', volume)
  },

  // Triumphant fanfare for session completion
  success: (volume: number = 0.25) => {
    playSequence([
      { freq: 523.25, duration: 0.15, delay: 0 },    // C5
      { freq: 659.25, duration: 0.15, delay: 0.1 },  // E5
      { freq: 783.99, duration: 0.15, delay: 0.2 },  // G5
      { freq: 1046.50, duration: 0.4, delay: 0.3 },  // C6
    ], 'sine', volume)
  },

  // Ascending chime for level up
  levelUp: (volume: number = 0.3) => {
    playSequence([
      { freq: 523.25, duration: 0.1, delay: 0 },     // C5
      { freq: 587.33, duration: 0.1, delay: 0.08 },  // D5
      { freq: 659.25, duration: 0.1, delay: 0.16 },  // E5
      { freq: 698.46, duration: 0.1, delay: 0.24 },  // F5
      { freq: 783.99, duration: 0.1, delay: 0.32 },  // G5
      { freq: 880.00, duration: 0.1, delay: 0.40 },  // A5
      { freq: 987.77, duration: 0.1, delay: 0.48 },  // B5
      { freq: 1046.50, duration: 0.3, delay: 0.56 }, // C6
    ], 'sine', volume)
  },

  // Achievement unlock sound
  achievement: (volume: number = 0.3) => {
    // Sparkle effect
    playChord([1318.51, 1567.98, 2093.00], 0.3, 'sine', volume * 0.5) // E6, G6, C7
    setTimeout(() => {
      playChord([1046.50, 1318.51, 1567.98], 0.4, 'sine', volume * 0.4) // C6, E6, G6
    }, 150)
  },

  // Fire crackle for streak
  streak: (volume: number = 0.2) => {
    playSequence([
      { freq: 440, duration: 0.08, delay: 0 },
      { freq: 554.37, duration: 0.08, delay: 0.06 },
      { freq: 659.25, duration: 0.12, delay: 0.12 },
    ], 'triangle', volume)
  },
}

export function playSound(type: SoundType, volume: number = 1): void {
  const soundFn = sounds[type]
  if (soundFn) {
    soundFn(volume * 0.3) // Global volume scaling
  }
}
