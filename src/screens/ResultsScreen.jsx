import { useState, useEffect, useRef } from 'react'
import { KEYBOARD_ROWS, KEY_TO_FINGER, FINGER_COLORS } from '../lib/keyboard'
import { playCelebration, playNewRecord } from '../lib/sounds'

// Confetti particle component
function Confetti() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c']
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 60,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute confetti-fall"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

export default function ResultsScreen({ results, onRetry, onNext, nextBlockTitle, onHome }) {
  const { wpm, accuracy, elapsed, wordsCompleted, totalWords, keyErrors, isNewRecord, previousBest,
    bestKeyStreak = 0, bestWordStreak = 0, totalKeystrokes = 0, correctKeystrokes = 0 } = results
  const [showContent, setShowContent] = useState(false)
  const [showRecord, setShowRecord] = useState(false)

  useEffect(() => {
    playCelebration()
    const t = setTimeout(() => setShowContent(true), 100)
    if (isNewRecord) {
      const t2 = setTimeout(() => {
        setShowRecord(true)
        playNewRecord()
      }, 800)
      return () => { clearTimeout(t); clearTimeout(t2) }
    }
    return () => clearTimeout(t)
  }, [])

  // Problem keys — sorted by error rate
  const keyStats = Object.entries(keyErrors)
    .map(([key, stats]) => ({
      key,
      total: stats.correct + stats.errors,
      errors: stats.errors,
      accuracy: stats.total === 0 ? 100 : Math.round((stats.correct / (stats.correct + stats.errors)) * 100),
    }))
    .filter((k) => k.total >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)

  const problemKeys = keyStats.filter((k) => k.accuracy < 100).slice(0, 8)

  // Build heat map data
  const heatMap = {}
  keyStats.forEach((k) => { heatMap[k.key] = k.accuracy })

  function getHeatColor(acc) {
    if (acc === undefined) return 'bg-gray-100'
    if (acc >= 95) return 'bg-green-200'
    if (acc >= 85) return 'bg-green-100'
    if (acc >= 75) return 'bg-yellow-200'
    if (acc >= 60) return 'bg-orange-200'
    return 'bg-red-200'
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  const getMessage = () => {
    if (accuracy >= 98) return { emoji: '🏆', text: 'Perfect!' }
    if (accuracy >= 90) return { emoji: '🌟', text: 'Excellent!' }
    if (accuracy >= 80) return { emoji: '💪', text: 'Great job!' }
    if (accuracy >= 70) return { emoji: '👍', text: 'Nice work!' }
    return { emoji: '📝', text: 'Keep practicing!' }
  }
  const msg = getMessage()

  // Filter heat map rows to only show letter keys (skip modifiers like Tab, Caps, Backspace, Enter, Shift)
  const heatMapRows = KEYBOARD_ROWS.slice(0, 4).map(row =>
    row.filter(k => k.key.length === 1 || k.key === ';' || k.key === "'" || k.key === '\\' || k.key === ',' || k.key === '.' || k.key === '/' || k.key === '-' || k.key === '=' || k.key === '[' || k.key === ']' || k.key === '`')
  )

  return (
    <div className="flex flex-col items-center p-6 overflow-y-auto" style={{ backgroundColor: '#e8e9ed', height: '100dvh' }}>
      <Confetti />
      <div className={`max-w-2xl w-full mt-auto mb-auto transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center mb-4">
          <div className="text-5xl mb-1 results-bounce">{msg.emoji}</div>
          <h2 className="text-2xl font-bold text-gray-800">{msg.text}</h2>
          <p className="text-gray-400 text-sm">Session Complete</p>
        </div>

        {/* New record banner — compact */}
        {isNewRecord && showRecord && (
          <div className="mb-4 new-record-banner">
            <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-xl px-4 py-2 text-center shadow-md flex items-center justify-center gap-2">
              <span className="text-xl">🏆</span>
              <span className="font-bold text-amber-900">NEW RECORD — {wpm} WPM</span>
              {previousBest > 0 && (
                <span className="text-amber-700 text-sm">(+{wpm - previousBest})</span>
              )}
              <span className="text-xl">🏆</span>
            </div>
          </div>
        )}

        {/* Main stats — 6 columns */}
        <div className="grid grid-cols-6 gap-2 mb-5">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm results-stat" style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl font-bold text-blue-600">{wpm}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">WPM</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm results-stat" style={{ animationDelay: '0.15s' }}>
            <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Accuracy</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm results-stat" style={{ animationDelay: '0.2s' }}>
            <div className="text-2xl font-bold text-purple-600">
              {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Time</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm results-stat" style={{ animationDelay: '0.25s' }}>
            <div className="text-2xl font-bold text-orange-600">{wordsCompleted}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Words</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm results-stat" style={{ animationDelay: '0.3s' }}>
            <div className={`text-2xl font-bold ${bestKeyStreak >= 50 ? 'text-red-500' : bestKeyStreak >= 25 ? 'text-amber-500' : bestKeyStreak >= 10 ? 'text-yellow-500' : 'text-gray-500'}`}>
              {bestKeyStreak}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{bestKeyStreak >= 10 ? '🔥 ' : ''}Key Streak</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm results-stat" style={{ animationDelay: '0.35s' }}>
            <div className={`text-2xl font-bold ${bestWordStreak >= 10 ? 'text-blue-500' : bestWordStreak >= 5 ? 'text-cyan-500' : bestWordStreak >= 3 ? 'text-sky-500' : 'text-gray-500'}`}>
              {bestWordStreak}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{bestWordStreak >= 3 ? '✨ ' : ''}Word Streak</div>
          </div>
        </div>

        {/* Problem keys */}
        {problemKeys.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="font-bold text-gray-700 mb-2 text-sm">Problem Keys</h3>
            <div className="flex flex-wrap gap-2">
              {problemKeys.map((k) => (
                <div
                  key={k.key}
                  className={`px-2.5 py-1.5 rounded-lg text-sm font-mono font-bold ${getHeatColor(k.accuracy)}`}
                >
                  <span className="text-base">{k.key.toUpperCase()}</span>
                  <span className="text-[10px] text-gray-500 ml-1">{k.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini keyboard heat map — letter keys only */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm mb-5">
          <h3 className="font-bold text-gray-700 mb-2 text-sm">Accuracy Heat Map</h3>
          <div className="flex flex-col items-center gap-1">
            {heatMapRows.map((row, ri) => (
              <div key={ri} className="flex gap-0.5" style={{ paddingLeft: ri === 1 ? 8 : ri === 2 ? 16 : ri === 3 ? 24 : 0 }}>
                {row.map((k) => {
                  const acc = heatMap[k.key]
                  return (
                    <div
                      key={k.key}
                      className={`rounded flex items-center justify-center font-mono font-bold ${getHeatColor(acc)} transition-colors`}
                      style={{ width: 28, height: 28, fontSize: 10 }}
                    >
                      {k.display}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-3 mt-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-200"></span> 95%+</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-yellow-200"></span> 75-94%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-200"></span> 60-74%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-200"></span> &lt;60%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
          >
            Try Again
          </button>
          {onNext && (
            <button
              onClick={onNext}
              className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md max-w-[200px] truncate"
            >
              Next: {nextBlockTitle}
            </button>
          )}
          <button
            onClick={onHome}
            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    </div>
  )
}
