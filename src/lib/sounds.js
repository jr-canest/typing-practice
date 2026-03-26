// Sound engine using Web Audio API for zero-latency playback

let audioCtx = null
let keystrokeBuffer = null
let initialized = false

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

// Pre-load the keystroke sound
export async function initSounds() {
  if (initialized) return
  initialized = true

  const ctx = getContext()

  try {
    const response = await fetch('/sounds/keystroke.mp3')
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

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

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
  if (ctx.state === 'suspended') ctx.resume()

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
  if (ctx.state === 'suspended') ctx.resume()

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
  if (ctx.state === 'suspended') ctx.resume()

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

// Group completion pop — quick bright chirp for fun modes
export function playGroupPop() {
  const ctx = getContext()
  if (ctx.state === 'suspended') ctx.resume()

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

  if (ctx.state === 'suspended') {
    ctx.resume()
  }

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
