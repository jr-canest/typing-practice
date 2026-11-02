// Sound engine using Web Audio API for zero-latency playback

import { getAudioContext } from './audioKeepAlive'

let keystrokeBuffer = null
let initialized = false

// The shared AudioContext from audioKeepAlive.ts (vendored from Apps/_shared, edit it there): it wakes
// it on every key or tap, after the phone sleeps or the app comes back, and replaces it when iOS
// leaves it stuck, so nothing here resumes it by hand.
function getContext() {
  return getAudioContext()
}

// Pre-load the keystroke sound
export async function initSounds() {
  if (initialized) return
  initialized = true

  const ctx = getContext()

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}sounds/keystroke.mp3`)
    const arrayBuffer = await response.arrayBuffer()
    keystrokeBuffer = await ctx.decodeAudioData(arrayBuffer)
  } catch (err) {
    console.warn('Could not load keystroke sound:', err)
  }
}

// Play the keystroke click — instant from pre-decoded buffer
export function playKeystroke() {
  if (!keystrokeBuffer) return
  const ctx = getContext()

  const source = ctx.createBufferSource()
  source.buffer = keystrokeBuffer

  // Slight volume reduction so it's not jarring on rapid typing
  const gain = ctx.createGain()
  gain.gain.value = 0.4
  source.connect(gain)
  gain.connect(ctx.destination)

  source.start(0)
}

// Countdown beep — clean digital tone, higher pitch on "Go!"
export function playCountdownBeep(isGo = false) {
  const ctx = getContext()

  const duration = isGo ? 0.25 : 0.12
  const freq = isGo ? 880 : 520

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  if (isGo) {
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08)
  }

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(isGo ? 0.25 : 0.18, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

// Celebration sound — ascending arpeggio chime
export function playCelebration() {
  const ctx = getContext()

  const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.12
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, startTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.2, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + 0.35)
  })
}

// New record fanfare — triumphant ascending with harmony
export function playNewRecord() {
  const ctx = getContext()

  // Main melody: C5, E5, G5, C6 (longer, louder)
  const melody = [523, 659, 784, 1047]
  melody.forEach((freq, i) => {
    const startTime = ctx.currentTime + i * 0.15
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, startTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.25, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + 0.5)
  })

  // Harmony layer (thirds above, slightly delayed)
  const harmony = [659, 784, 988, 1318]
  harmony.forEach((freq, i) => {
    const startTime = ctx.currentTime + 0.08 + i * 0.15
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, startTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.12, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + 0.4)
  })
}

// Streak milestone chime — escalating tiers for key/word streaks
export function playStreakChime(tier = 1) {
  const ctx = getContext()

  if (tier === 1) {
    // Single gentle chime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(700, ctx.currentTime)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15)
  } else if (tier === 2) {
    // Two-note chime
    ;[700, 900].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.08
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.14, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t); osc.stop(t + 0.18)
    })
  } else {
    // Three-note ascending
    ;[700, 900, 1100].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.07
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.16, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t); osc.stop(t + 0.22)
    })
  }
}

// Group completion pop — quick bright chirp for fun modes
export function playGroupPop() {
  const ctx = getContext()

  // Quick two-note chirp: rising pitch
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.setValueAtTime(900, ctx.currentTime + 0.04)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.2, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.12)
}

// Generate a subtle error sound — short low buzz/thud
export function playError() {
  const ctx = getContext()

  // Short noise burst — feels like a soft "thunk"
  const duration = 0.08
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}
