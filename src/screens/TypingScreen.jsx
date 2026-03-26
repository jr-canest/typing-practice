import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Keyboard from '../components/Keyboard'
import HandGuide from '../components/HandGuide'
import FunDisplay from '../components/FunDisplay'
import { KEY_TO_FINGER } from '../lib/keyboard'
import { saveProgress } from '../lib/storage'
import { initSounds, playKeystroke, playError, playCountdownBeep, playGroupPop, playStreakChime } from '../lib/sounds'

// Strip punctuation and lowercase for basic mode
function sanitizeBasic(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function TypingScreen({ user, session, onFinish, onQuit }) {
  const { block, startWord, wordCount, timeLimit, textMode = 'basic', allActiveKeys } = session
  const rawText = textMode === 'basic' ? sanitizeBasic(block.text) : block.text
  const allWords = rawText.split(/\s+/).filter(Boolean)
  const endWord = wordCount
    ? Math.min(startWord + wordCount, allWords.length)
    : allWords.length
  const words = allWords.slice(startWord, endWord)

  const [phase, setPhase] = useState('countdown') // countdown | typing | done
  const [countdown, setCountdown] = useState(3)
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [slideKey, setSlideKey] = useState(0)
  const [pressedKey, setPressedKey] = useState(null)

  // Stats
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [totalKeystrokes, setTotalKeystrokes] = useState(0)
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0)
  const [keyErrors, setKeyErrors] = useState({}) // { key: { correct, errors } }
  const [completedWords, setCompletedWords] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [justCompletedWord, setJustCompletedWord] = useState(-1)

  // Streak / combo tracking — letters
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [comboPopup, setComboPopup] = useState(null) // { count, label, emoji, type }
  const comboTimeoutRef = useRef(null)

  // Streak / combo tracking — words (perfect words in a row)
  const [wordStreak, setWordStreak] = useState(0)
  const [bestWordStreak, setBestWordStreak] = useState(0)
  const [wordErrorInCurrent, setWordErrorInCurrent] = useState(false)

  const LETTER_MILESTONES = [
    { at: 10, emoji: '\u{1F525}', label: 'Nice!' },
    { at: 25, emoji: '\u{1F4AA}', label: 'Great!' },
    { at: 50, emoji: '\u{26A1}',  label: 'Amazing!' },
    { at: 100, emoji: '\u{1F680}', label: 'Unstoppable!' },
    { at: 200, emoji: '\u{1F451}', label: 'LEGENDARY!' },
  ]

  const WORD_MILESTONES = [
    { at: 3,  emoji: '\u{2728}', label: 'Nice!' },
    { at: 5,  emoji: '\u{1F31F}', label: 'On fire!' },
    { at: 10, emoji: '\u{1F4AF}', label: 'Flawless!' },
    { at: 20, emoji: '\u{1F3C6}', label: 'Unstoppable!' },
    { at: 50, emoji: '\u{1F525}', label: 'On another level!' },
    { at: 100, emoji: '\u{1F451}', label: 'LEGENDARY!' },
    { at: 150, emoji: '\u{2B50}', label: 'GODLIKE!' },
  ]

  // Streak sound tiers: key streaks 25/50/100, word streaks 10/25/50/100/150
  const STREAK_SOUNDS = {
    letter: { 25: 1, 50: 2, 100: 3 },
    word: { 10: 1, 25: 1, 50: 2, 100: 3, 150: 3 },
  }

  function triggerCombo(newStreak, type) {
    const milestones = type === 'word' ? WORD_MILESTONES : LETTER_MILESTONES
    const milestone = [...milestones].reverse().find(m => newStreak === m.at)
    if (milestone) {
      setComboPopup({ count: newStreak, ...milestone, type })
      clearTimeout(comboTimeoutRef.current)
      comboTimeoutRef.current = setTimeout(() => setComboPopup(null), 1500)
    }
    // Play streak chime at specific thresholds
    const tier = STREAK_SOUNDS[type]?.[newStreak]
    if (tier) playStreakChime(tier)
  }

  const containerRef = useRef(null)
  const timerRef = useRef(null)
  const wpmTimerRef = useRef(null)
  const completedWordsRef = useRef(0)

  // Prevent screen sleep during typing session (Wake Lock API)
  useEffect(() => {
    let wakeLock = null
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (e) { /* Wake Lock not supported or denied */ }
    }
    requestWakeLock()
    // Re-acquire on visibility change (iOS releases on tab switch)
    const onVisChange = () => { if (document.visibilityState === 'visible') requestWakeLock() }
    document.addEventListener('visibilitychange', onVisChange)
    return () => {
      wakeLock?.release()
      document.removeEventListener('visibilitychange', onVisChange)
    }
  }, [])

  // Pre-load sounds on mount
  useEffect(() => { initSounds() }, [])

  // Track viewport size for proportional scaling
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 768)
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // Scale factor: base design is 1024px wide, capped at 1
  const scale = Math.min(vw / 1024, vh / 768, 1)

  const cardShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'

  // Determine display mode for KB drill sections vs paper card
  const isKeyboardBasics = block.category === 'Keyboard Basics'
  const consolidationIds = ['kb-1.07', 'kb-2.06', 'kb-3.05', 'kb-3.06']
  const isConsolidation = isKeyboardBasics && (
    consolidationIds.includes(block.id) || block.id?.startsWith('kb-4.')
  )
  const funModes = ['target', 'pop', 'cascade']
  const displayMode = !isKeyboardBasics || isConsolidation
    ? 'paper'
    : funModes[((block.order || 1) - 1) % 3]

  const currentWord = words[wordIndex] || ''
  const nextChar = currentWord[charIndex] || ' '

  // Keep focus on the container during typing — grab on mount + reclaim if lost
  useEffect(() => {
    containerRef.current?.focus()
    if (phase !== 'typing') return
    const el = containerRef.current
    const reclaim = () => requestAnimationFrame(() => el?.focus())
    el?.addEventListener('blur', reclaim)
    return () => el?.removeEventListener('blur', reclaim)
  }, [phase])

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('typing')
      setStartTime(Date.now())
      containerRef.current?.focus()
      return
    }
    playCountdownBeep(countdown === 1) // higher tone on last number before Go
    const t = setTimeout(() => setCountdown((c) => c - 1), 490)
    return () => clearTimeout(t)
  }, [phase, countdown])

  // Elapsed timer
  useEffect(() => {
    if (phase !== 'typing') return
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const secs = Math.floor((now - startTime) / 1000)
      setElapsed(secs)

      // Time limit check
      if (timeLimit && secs >= timeLimit) {
        finishSession()
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, startTime, timeLimit])

  // Keep ref in sync with state
  useEffect(() => { completedWordsRef.current = completedWords }, [completedWords])

  // WPM calculation every 2 seconds — uses ref to avoid stale closure
  useEffect(() => {
    if (phase !== 'typing') return
    wpmTimerRef.current = setInterval(() => {
      const minutes = (Date.now() - startTime) / 60000
      if (minutes > 0) {
        setWpm(Math.round(completedWordsRef.current / minutes))
      }
    }, 2000)
    return () => clearInterval(wpmTimerRef.current)
  }, [phase, startTime])

  const finishSession = useCallback(() => {
    setPhase('done')
    clearInterval(timerRef.current)
    clearInterval(wpmTimerRef.current)

    const finalElapsed = (Date.now() - startTime) / 1000
    const finalWpm = Math.round(completedWords / (finalElapsed / 60)) || 0
    const finalAccuracy = totalKeystrokes > 0
      ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
      : 100

    // Save progress
    saveProgress(user.id, block.id, startWord + wordIndex)

    onFinish({
      wpm: finalWpm,
      accuracy: finalAccuracy,
      elapsed: Math.round(finalElapsed),
      wordsCompleted: completedWords,
      totalWords: words.length,
      keyErrors: { ...keyErrors },
      contentBlockId: block.id,
      bestKeyStreak: bestStreak,
      bestWordStreak,
      totalKeystrokes,
      correctKeystrokes,
    })
  }, [startTime, completedWords, totalKeystrokes, correctKeystrokes, keyErrors, wordIndex, words.length])

  // Handle keystrokes
  function handleKeyDown(e) {
    if (phase !== 'typing') return
    e.preventDefault()

    const key = e.key

    // Allow ending session with Escape
    if (key === 'Escape') {
      finishSession()
      return
    }

    // Ignore modifier keys, function keys, etc.
    if (key.length > 1 && key !== 'Backspace') return

    // Backspace handling — only useful if there's an error state
    if (key === 'Backspace') {
      if (hasError) {
        setHasError(false)
      }
      return
    }

    setPressedKey(key + Date.now()) // Unique trigger for animation

    const expected = currentWord[charIndex]

    // Track keystroke stats
    setTotalKeystrokes((t) => t + 1)

    if (charIndex >= currentWord.length) {
      // Expected: space to move to next word
      if (key === ' ') {
        playKeystroke()
        setCorrectKeystrokes((c) => c + 1)
        setStreak(s => {
          const ns = s + 1
          setBestStreak(b => Math.max(b, ns))
          triggerCombo(ns, 'letter')
          return ns
        })
        // Word streak — increment if no errors in this word
        if (!wordErrorInCurrent) {
          setWordStreak(ws => {
            const nws = ws + 1
            setBestWordStreak(b => Math.max(b, nws))
            triggerCombo(nws, 'word')
            return nws
          })
        } else {
          setWordStreak(0)
        }
        setWordErrorInCurrent(false)
        const nextWordIdx = wordIndex + 1
        setCompletedWords((c) => c + 1)

        if (nextWordIdx >= words.length) {
          // Session complete
          setWordIndex(nextWordIdx)
          setTimeout(finishSession, 100)
          return
        }

        setJustCompletedWord(wordIndex)
        setWordIndex(nextWordIdx)
        setCharIndex(0)
        setHasError(false)
        setSlideKey((k) => k + 1)
        if (displayMode !== 'paper') playGroupPop()
      } else {
        // Wrong key when space was expected
        playError()
        setHasError(true)
        setStreak(0)
        setWordStreak(0)
        setWordErrorInCurrent(true)
      }
      return
    }

    const keyLower = key.toLowerCase()
    const expectedLower = expected?.toLowerCase()

    // In basic mode, compare case-insensitively; in full mode, compare exact
    const isCorrect = textMode === 'full'
      ? key === expected
      : (key === expected || (key.length === 1 && keyLower === expectedLower))

    if (isCorrect) {
      // Correct — also clears any previous error
      playKeystroke()
      setHasError(false)
      setCorrectKeystrokes((c) => c + 1)
      const nextCharIdx = charIndex + 1
      setCharIndex(nextCharIdx)
      setStreak(s => {
        const ns = s + 1
        setBestStreak(b => Math.max(b, ns))
        triggerCombo(ns, 'letter')
        return ns
      })
      setKeyErrors((prev) => {
        const stats = prev[expectedLower] || { correct: 0, errors: 0 }
        return { ...prev, [expectedLower]: { correct: stats.correct + 1, errors: stats.errors } }
      })
      // Auto-finish if last character of last word — no space needed
      if (nextCharIdx >= currentWord.length && wordIndex >= words.length - 1) {
        setCompletedWords((c) => c + 1)
        setWordIndex(wordIndex + 1)
        setTimeout(finishSession, 100)
        return
      }
    } else {
      // Wrong — reset both streaks
      playError()
      setHasError(true)
      setStreak(0)
      setWordStreak(0)
      setWordErrorInCurrent(true)
      setKeyErrors((prev) => {
        const stats = prev[expectedLower] || { correct: 0, errors: 0 }
        return { ...prev, [expectedLower]: { correct: stats.correct, errors: stats.errors + 1 } }
      })
    }
  }

  const accuracy = totalKeystrokes > 0
    ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
    : 100

  // Determine target key for keyboard highlight
  const targetKey = charIndex < currentWord.length ? currentWord[charIndex] : ' '

  // Ref for auto-scrolling and row-based opacity
  const currentWordRef = useRef(null)
  const paperRef = useRef(null)
  const wordsContainerRef = useRef(null)
  const [currentRowTop, setCurrentRowTop] = useState(null)

  useEffect(() => {
    if (currentWordRef.current && paperRef.current) {
      const wordEl = currentWordRef.current
      const paperEl = paperRef.current
      const wordTop = wordEl.offsetTop
      const paperHeight = paperEl.clientHeight
      paperEl.scrollTo({ top: wordTop - paperHeight / 3, behavior: 'smooth' })
      setCurrentRowTop(wordTop)
    }
  }, [wordIndex])

  // Apply row-based opacity after render
  useEffect(() => {
    if (currentRowTop == null || !wordsContainerRef.current) return
    const children = wordsContainerRef.current.children
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      child.style.opacity = child.offsetTop === currentRowTop ? '1' : '0.5'
    }
  })

  // Countdown phase
  const countdownLabels = { 3: 'Ready', 2: 'Set', 1: 'GO!' }

  if (phase === 'countdown') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8e9ed' }}>
        <div key={countdown} className="text-center countdown-pop">
          <div className={`font-bold ${countdown === 1 ? 'text-green-500' : 'text-gray-700'}`} style={{ fontSize: countdown === 1 ? '6rem' : '4.5rem' }}>
            {countdownLabels[countdown] || 'GO!'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={() => { if (phase === 'typing') requestAnimationFrame(() => containerRef.current?.focus()) }}
      className="flex flex-col outline-none select-none relative overflow-hidden"
      style={{ cursor: 'default', backgroundColor: '#e8e9ed', height: '100dvh' }}
    >
      {/* Session progress bar */}
      <div className="relative w-full" style={{ height: 3 }}>
        <div className="absolute inset-0 bg-gray-200/60" />
        <div
          className="absolute left-0 top-0 bottom-0 bg-blue-400/50"
          style={{ width: `${timeLimit ? Math.min((elapsed / timeLimit) * 100, 100) : Math.min((completedWords / words.length) * 100, 100)}%`, transition: 'width 0.3s' }}
        />
        <div className="absolute right-2 -bottom-3 text-[9px] text-gray-400 tabular-nums">
          {timeLimit ? Math.min(Math.round((elapsed / timeLimit) * 100), 100) : Math.min(Math.round((completedWords / words.length) * 100), 100)}%
        </div>
      </div>

      {/* Top bar — metrics */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex gap-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-2 text-center shadow-sm">
            <div className="text-xs text-gray-400 font-medium">WPM</div>
            <div className="text-lg font-bold text-blue-600">{wpm}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-2 text-center shadow-sm">
            <div className="text-xs text-gray-400 font-medium">Accuracy</div>
            <div className="text-lg font-bold text-green-600">{accuracy}%</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-2 text-center shadow-sm" style={{ minWidth: 80 }}>
            <div className="text-xs text-gray-400 font-medium">Time</div>
            <div className="text-lg font-bold text-gray-700 tabular-nums">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              {timeLimit && <span className="text-gray-400 text-sm">/{Math.floor(timeLimit / 60)}:{String(timeLimit % 60).padStart(2, '0')}</span>}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-2 text-center shadow-sm">
            <div className="text-xs text-gray-400 font-medium">Words</div>
            <div className="text-lg font-bold text-gray-700">{completedWords}/{words.length}</div>
          </div>
          {/* Streak container — distinct style */}
          <div className="relative">
            <div className={`backdrop-blur-sm rounded-2xl px-4 pt-1 pb-1.5 shadow-sm transition-all duration-300 flex flex-col items-center border ${streak >= 10 || wordStreak >= 3 ? 'bg-gradient-to-r from-orange-50/90 to-blue-50/90 border-orange-200/50 scale-105' : 'bg-white/60 border-gray-200/50'}`}>
              <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Streak</div>
              <div className="flex items-center gap-3">
                {/* Letter streak */}
                <div className="text-center">
                  <div className={`text-lg font-bold tabular-nums transition-colors duration-300 ${streak >= 100 ? 'text-red-500' : streak >= 50 ? 'text-orange-500' : streak >= 25 ? 'text-amber-500' : streak >= 10 ? 'text-yellow-500' : 'text-gray-400'}`}>{streak}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{streak >= 10 ? '🔥 ' : ''}keys</div>
                </div>
                <div className="w-px h-7 bg-gray-200/80" />
                {/* Word streak */}
                <div className="text-center">
                  <div className={`text-lg font-bold tabular-nums transition-colors duration-300 ${wordStreak >= 20 ? 'text-purple-500' : wordStreak >= 10 ? 'text-blue-500' : wordStreak >= 5 ? 'text-sky-500' : wordStreak >= 3 ? 'text-cyan-500' : 'text-gray-400'}`}>{wordStreak}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{wordStreak >= 3 ? '✨ ' : ''}words</div>
                </div>
              </div>
            </div>
            {/* Combo callout */}
            {comboPopup && (
              <div key={`${comboPopup.type}-${comboPopup.count}`} className="absolute left-1/2 -translate-x-1/2 top-full mt-2 combo-popup pointer-events-none whitespace-nowrap z-30">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg text-center">
                  <span style={{ fontSize: 20 }}>{comboPopup.emoji}</span>
                  <span className="font-bold text-gray-800 ml-1" style={{ fontSize: 14 }}>
                    {comboPopup.count} {comboPopup.type === 'word' ? 'words' : 'keys'}!
                  </span>
                  <span className="font-semibold text-gray-400 ml-1" style={{ fontSize: 12 }}>{comboPopup.label}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <button onClick={finishSession} className="text-sm text-gray-400 hover:text-gray-600 transition-colors bg-white/60 rounded-xl px-3 py-1.5">
          ⏹ End Session
        </button>
      </div>

      {/* Display area — fun modes for KB drills, paper card for everything else */}
      {displayMode !== 'paper' ? (
        <FunDisplay
          mode={displayMode}
          words={words}
          wordIndex={wordIndex}
          charIndex={charIndex}
          hasError={hasError}
          scale={scale}
          streak={streak}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center px-6 min-h-0 overflow-hidden" style={{ paddingTop: 8, paddingBottom: 0, marginBottom: -30 }}>
          <div
            ref={paperRef}
            className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden"
            style={{
              maxWidth: 640 * scale,
              maxHeight: Math.min(260 * scale, vh * 0.28),
              padding: `${24 * scale}px ${32 * scale}px`,
              boxShadow: cardShadow,
            }}
          >
            <div ref={wordsContainerRef} className="font-mono leading-relaxed flex flex-wrap" style={{ fontSize: Math.max(24, 40 * scale), gap: `${6 * scale}px`, wordBreak: 'keep-all' }}>
              {words.map((word, wi) => {
                const isCurrentWord = wi === wordIndex
                const isCompleted = wi < wordIndex

                const showSpaceSymbol = isCurrentWord && charIndex >= word.length

                const justDone = wi === justCompletedWord

                return (
                  <span
                    key={wi}
                    ref={isCurrentWord ? currentWordRef : null}
                    className="inline-block relative whitespace-nowrap"
                  >
                    {isCurrentWord ? (
                      word.split('').map((char, ci) => {
                        let cls = 'text-gray-300'
                        if (ci < charIndex) cls = 'text-green-500'
                        else if (ci === charIndex && hasError) cls = 'text-white bg-red-500 rounded-sm px-0.5'
                        else if (ci === charIndex) cls = 'text-gray-800 border-b-2 border-blue-500'
                        return <span key={ci} className={cls}>{char}</span>
                      })
                    ) : (
                      <span className={isCompleted ? 'text-green-400' : 'text-gray-300'}>{word}</span>
                    )}
                    <span className={showSpaceSymbol ? 'text-blue-400 animate-pulse' : 'invisible'}>⎵</span>
                    {justDone && (
                      <span key={`ghost-${slideKey}`} className="word-ghost">{word}</span>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard — scaled proportionally, nudged up to clear hands */}
      <div className="flex justify-center relative z-10" style={{ flexShrink: 0, marginBottom: 20 * scale }}>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3" style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center', boxShadow: cardShadow }}>
          <Keyboard targetKey={targetKey} pressedKey={pressedKey} activeKeys={allActiveKeys} />
        </div>
      </div>
      {/* Spacer for hands visibility below keyboard */}
      <div style={{ height: Math.min(vh * 0.15 * scale, 100), flexShrink: 0 }} />

      {/* Hands — fixed to viewport bottom, SVG sizes itself naturally from its width */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <div style={{ width: 440 * scale }}>
          <HandGuide activeFinger={targetKey ? (KEY_TO_FINGER[targetKey.toLowerCase()] || KEY_TO_FINGER[targetKey]) : null} />
        </div>
      </div>
    </div>
  )
}
