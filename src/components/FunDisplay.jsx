import { useState, useEffect, useRef, useMemo } from 'react'
import { KEY_TO_FINGER, FINGER_HEX } from '../lib/keyboard'

// ─── Target Shoot Mode ─────────────────────────────────────────────
// Carnival shooting gallery — continuous stream of targets including spaces.
// Slides right-to-left, targets knock back when hit.
function TargetShoot({ words, wordIndex, charIndex, hasError, scale }) {
  const prevGlobalPosRef = useRef(0)

  // Build flat array of all characters with spaces between words
  const allChars = useMemo(() => {
    const chars = []
    words.forEach((word, wi) => {
      word.split('').forEach(c => chars.push({ char: c, type: 'letter' }))
      if (wi < words.length - 1) chars.push({ char: '⎵', type: 'space' })
    })
    return chars
  }, [words])

  // Calculate global position in flat array
  const globalPos = useMemo(() => {
    let pos = 0
    for (let i = 0; i < wordIndex; i++) {
      pos += words[i].length + 1 // +1 for space
    }
    pos += charIndex
    return pos
  }, [words, wordIndex, charIndex])

  const [knockedCount, setKnockedCount] = useState(0)

  useEffect(() => {
    if (globalPos > knockedCount) setKnockedCount(globalPos)
    prevGlobalPosRef.current = globalPos
  }, [globalPos])

  const targetSize = Math.max(90, 120 * scale)
  const fontSize = Math.max(32, 48 * scale)
  const spacing = targetSize + Math.max(16, 24 * scale)
  const containerW = Math.min(500, 600 * scale)

  const offsetX = -(globalPos * spacing) + (containerW / 2) - (targetSize / 2)

  return (
    <div className="relative overflow-hidden" style={{ width: containerW, height: targetSize + 40 }}>
      {/* Conveyor track line */}
      <div className="absolute left-0 right-0" style={{ top: targetSize + 8, height: 3, backgroundColor: '#d1d5db', borderRadius: 2 }} />
      {/* Sliding row */}
      <div
        className="absolute flex items-end gap-0 transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${offsetX}px)`, bottom: 12 }}
      >
        {allChars.map((item, ci) => {
          const isKnocked = ci < knockedCount
          const isCurrent = ci === globalPos
          const isUpcoming = ci > globalPos
          const isSpace = item.type === 'space'
          const finger = isSpace ? 'thumb' : (KEY_TO_FINGER[item.char.toLowerCase()] || 'thumb')
          const fingerColor = FINGER_HEX[finger] || '#d1d5db'

          return (
            <div key={ci} className="flex-shrink-0 relative" style={{ width: spacing }}>
              {/* Spark particles on hit */}
              {isKnocked && ci === knockedCount - 1 && (
                <div className="absolute" style={{ width: targetSize, height: targetSize }}>
                  {[0,1,2,3,4,5,6,7,8,9].map(i => (
                    <div key={i} className="target-spark absolute" style={{
                      width: i % 2 === 0 ? 4 : 6,
                      height: i % 2 === 0 ? 4 : 6,
                      borderRadius: '50%',
                      backgroundColor: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#f97316' : '#ef4444',
                      top: '50%', left: '50%',
                      '--spark-angle': `${i * 36}deg`,
                      '--spark-dist': `${30 + Math.random() * 20}px`,
                    }} />
                  ))}
                </div>
              )}
              <div
                className={isKnocked ? 'target-knockback' : isCurrent && hasError ? 'bubble-shake' : ''}
                style={{
                  width: targetSize, height: targetSize,
                  position: 'relative', transformOrigin: 'bottom center',
                  opacity: isKnocked ? 0 : isUpcoming ? 0.5 : 1,
                  transform: isCurrent ? 'scale(1)' : isUpcoming ? 'scale(0.85)' : undefined,
                  transition: 'opacity 0.2s, transform 0.2s',
                }}
              >
                {/* Target stand */}
                <div className="absolute left-1/2 -translate-x-1/2" style={{
                  bottom: -8, width: 4, height: 16,
                  backgroundColor: '#94a3b8', borderRadius: 2,
                }} />
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full"
                  style={{ border: `4px solid ${isCurrent ? fingerColor : '#d1d5db'}` }}
                />
                {/* Middle ring */}
                <div className="absolute rounded-full"
                  style={{
                    top: '14%', left: '14%', right: '14%', bottom: '14%',
                    border: `3px solid ${isCurrent ? fingerColor : '#e2e8f0'}`,
                    opacity: 0.7,
                  }}
                />
                {/* White center */}
                <div className="absolute rounded-full"
                  style={{ top: '22%', left: '22%', right: '22%', bottom: '22%', backgroundColor: 'white' }}
                />
                {/* Character */}
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: isSpace ? fontSize * 0.7 : (isCurrent ? fontSize : fontSize * 0.8),
                    fontWeight: 900,
                    color: isCurrent && hasError ? '#ef4444' : isCurrent ? '#1e293b' : '#94a3b8',
                    transition: 'font-size 0.2s, color 0.15s',
                  }}
                >
                  {item.char}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {/* Crosshair overlay — aim reticle with gap in center */}
      <div className="absolute pointer-events-none" style={{
        left: '50%', bottom: 12,
        transform: 'translateX(-50%)',
        width: targetSize, height: targetSize,
      }}>
        {/* Top tick */}
        <div className="absolute left-1/2" style={{ top: 0, width: 2, height: '20%', marginLeft: -1, backgroundColor: 'rgba(239,68,68,0.5)', borderRadius: 1 }} />
        {/* Bottom tick */}
        <div className="absolute left-1/2" style={{ bottom: 0, width: 2, height: '20%', marginLeft: -1, backgroundColor: 'rgba(239,68,68,0.5)', borderRadius: 1 }} />
        {/* Left tick */}
        <div className="absolute top-1/2" style={{ left: 0, height: 2, width: '20%', marginTop: -1, backgroundColor: 'rgba(239,68,68,0.5)', borderRadius: 1 }} />
        {/* Right tick */}
        <div className="absolute top-1/2" style={{ right: 0, height: 2, width: '20%', marginTop: -1, backgroundColor: 'rgba(239,68,68,0.5)', borderRadius: 1 }} />
      </div>
    </div>
  )
}

// ─── Bubble Pop Mode ───────────────────────────────────────────────
// Big floating bubbles that bob up and down. Pop with a satisfying burst on correct keystroke.
function BubblePop({ word, charIndex, hasError, scale, groupKey }) {
  const [poppedChars, setPoppedChars] = useState([])

  useEffect(() => { setPoppedChars([]) }, [groupKey])

  useEffect(() => {
    if (charIndex > 0 && charIndex <= word.length) {
      setPoppedChars(prev => prev.includes(charIndex - 1) ? prev : [...prev, charIndex - 1])
    }
  }, [charIndex, word.length])

  const bubbleSize = Math.max(64, 90 * scale)
  const fontSize = Math.max(28, 44 * scale)

  return (
    <div className="flex items-center justify-center gap-4" key={groupKey}>
      {word.split('').map((char, ci) => {
        const isPopped = poppedChars.includes(ci)
        const isCurrent = ci === charIndex && !isPopped
        const finger = KEY_TO_FINGER[char.toLowerCase()] || 'thumb'
        const fingerColor = FINGER_HEX[finger] || '#d1d5db'

        if (isPopped) {
          return (
            <div
              key={`${groupKey}-${ci}`}
              className="bubble-pop relative"
              style={{ width: bubbleSize, height: bubbleSize }}
            >
              {/* Pop particles */}
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="target-particle absolute"
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: fingerColor,
                    top: '50%', left: '50%',
                    '--angle': `${i * 60}deg`,
                  }}
                />
              ))}
            </div>
          )
        }

        return (
          <div
            key={`${groupKey}-${ci}`}
            className={`bubble-enter ${isCurrent && hasError ? 'bubble-shake' : ''}`}
            style={{
              width: bubbleSize, height: bubbleSize, borderRadius: '50%',
              background: isCurrent && hasError
                ? 'radial-gradient(circle at 35% 35%, #fee2e2, #fca5a5)'
                : isCurrent
                  ? `radial-gradient(circle at 35% 35%, white 40%, ${fingerColor}30 100%)`
                  : 'radial-gradient(circle at 35% 35%, white 40%, #f1f5f9 100%)',
              boxShadow: isCurrent
                ? `0 4px 20px ${fingerColor}40, inset 0 -4px 12px ${fingerColor}15`
                : '0 2px 10px rgba(0,0,0,0.06), inset 0 -2px 6px rgba(0,0,0,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontSize, fontWeight: 'bold',
              color: isCurrent && hasError ? '#ef4444' : isCurrent ? '#1e293b' : '#b0b8c4',
              transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              animation: isPopped ? undefined : `bubble-float 2.5s ease-in-out ${ci * 0.3}s infinite`,
              animationDelay: `${ci * 60}ms, ${ci * 0.3}s`,
              animationFillMode: 'both',
              animationName: 'bubble-enter, bubble-float',
              animationDuration: '0.35s, 2.5s',
              animationIterationCount: '1, infinite',
              animationTimingFunction: 'ease-out, ease-in-out',
            }}
          >
            {/* Bubble shine highlight */}
            <div
              className="absolute rounded-full"
              style={{
                width: '30%', height: '20%',
                top: '15%', left: '20%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
                borderRadius: '50%',
              }}
            />
            {char}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tile Drop Mode ────────────────────────────────────────────────
// Characters as Scrabble-like tiles. Typed ones drop away.
function TileDrop({ word, charIndex, hasError, scale, groupKey }) {
  const [droppedChars, setDroppedChars] = useState([])

  useEffect(() => { setDroppedChars([]) }, [groupKey])

  useEffect(() => {
    if (charIndex > 0 && charIndex <= word.length) {
      setDroppedChars(prev => prev.includes(charIndex - 1) ? prev : [...prev, charIndex - 1])
    }
  }, [charIndex, word.length])

  const tileW = Math.max(48, 64 * scale)
  const tileH = Math.max(56, 72 * scale)
  const fontSize = Math.max(24, 38 * scale)

  return (
    <div className="flex items-center justify-center gap-2" key={groupKey}>
      {word.split('').map((char, ci) => {
        const isDropped = droppedChars.includes(ci)
        const isCurrent = ci === charIndex && !isDropped
        const finger = KEY_TO_FINGER[char.toLowerCase()] || 'thumb'
        const fingerColor = FINGER_HEX[finger] || '#d1d5db'

        if (isDropped) {
          return (
            <div
              key={`${groupKey}-${ci}`}
              className="tile-drop"
              style={{
                width: tileW, height: tileH, borderRadius: 10,
                backgroundColor: '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'monospace', fontSize, fontWeight: 'bold', color: '#16a34a',
              }}
            >
              {char.toUpperCase()}
            </div>
          )
        }

        return (
          <div
            key={`${groupKey}-${ci}`}
            className={`tile-enter ${isCurrent && hasError ? 'bubble-shake' : ''}`}
            style={{
              width: tileW, height: tileH, borderRadius: 10,
              backgroundColor: isCurrent && hasError ? '#fee2e2' : '#fffbeb',
              borderBottom: isCurrent ? `4px solid ${fingerColor}` : '4px solid #e5e7eb',
              boxShadow: isCurrent ? '0 4px 12px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontSize, fontWeight: 'bold',
              color: isCurrent ? '#1e293b' : '#94a3b8',
              transform: isCurrent ? 'translateY(-4px)' : 'translateY(0)',
              transition: 'transform 0.15s, border-color 0.15s, background-color 0.15s',
              animationDelay: `${ci * 60}ms`, animationFillMode: 'both',
            }}
          >
            {char.toUpperCase()}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main FunDisplay Component ─────────────────────────────────────
export default function FunDisplay({ mode, words, wordIndex, charIndex, hasError, scale, streak }) {
  const currentWord = words[wordIndex] || ''
  const allTyped = charIndex >= currentWord.length
  const groupKey = `group-${wordIndex}`

  // Completion burst when group advances
  const [showBurst, setShowBurst] = useState(false)
  const prevWordIndex = useRef(wordIndex)

  useEffect(() => {
    if (wordIndex > prevWordIndex.current) {
      setShowBurst(true)
      const t = setTimeout(() => setShowBurst(false), 400)
      prevWordIndex.current = wordIndex
      return () => clearTimeout(t)
    }
    prevWordIndex.current = wordIndex
  }, [wordIndex])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0 relative">
      {/* Group counter */}
      <div className="absolute top-2 text-sm text-gray-400 font-medium">
        {wordIndex + 1} of {words.length}
      </div>

      {/* Completion burst */}
      {showBurst && (
        <div className="absolute group-burst pointer-events-none" style={{ fontSize: 48 }}>
          ✨
        </div>
      )}

      {/* Mode renderer + space prompt in a fixed-height container */}
      <div className="flex flex-col items-center justify-center" style={{ minHeight: Math.max(140, 220 * scale) }}>
        {/* Targets/bubbles area */}
        <div className="flex items-center justify-center" style={{ minHeight: Math.max(80, 120 * scale) }}>
          {mode === 'target' && (
            <TargetShoot words={words} wordIndex={wordIndex} charIndex={charIndex} hasError={hasError} scale={scale} />
          )}
          {mode === 'pop' && (
            <BubblePop word={currentWord} charIndex={allTyped ? currentWord.length : charIndex} hasError={hasError} scale={scale} groupKey={groupKey} />
          )}
          {mode === 'cascade' && (
            <TileDrop word={currentWord} charIndex={allTyped ? currentWord.length : charIndex} hasError={hasError} scale={scale} groupKey={groupKey} />
          )}
        </div>

        {/* Space prompt — fixed position below (hidden for target mode since space is a target) */}
        <div className="h-12 flex items-center justify-center mt-2">
          {mode !== 'target' && allTyped && currentWord.length > 0 && (
            <div className="space-pulse">
              <div
                className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-2 shadow-md flex items-center gap-2"
                style={{ boxShadow: '0 2px 12px rgba(59,130,246,0.15)' }}
              >
                <span className="text-blue-500 font-bold" style={{ fontSize: Math.max(12, 16 * scale) }}>SPACE</span>
                <span className="text-gray-400" style={{ fontSize: Math.max(10, 13 * scale) }}>to continue</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-2 flex gap-1">
        {words.length <= 40 && words.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === wordIndex ? 8 : 5,
              height: i === wordIndex ? 8 : 5,
              backgroundColor: i < wordIndex ? '#86efac' : i === wordIndex ? '#3b82f6' : '#d1d5db',
            }}
          />
        ))}
        {words.length > 40 && (
          <div className="text-xs text-gray-400 font-medium">
            {Math.round((wordIndex / words.length) * 100)}% complete
          </div>
        )}
      </div>
    </div>
  )
}
