import { useState, useEffect } from 'react'
import { getContentBlocks, getProgress, getBestWpm, getBestAccuracy } from '../lib/storage'

const cardShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'

const pill = (active) =>
  `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? 'bg-blue-500 text-white shadow-sm' : 'bg-white/60 text-gray-500 hover:bg-white/80'}`

const CATEGORIES = [
  { id: 'keyboard', label: 'Keyboard Basics', emoji: '⌨️', description: 'Learn to type step by step', color: 'from-blue-50 to-cyan-50', border: 'border-blue-200' },
  { id: 'story', label: 'Story Mode', emoji: '📖', description: 'Type through stories and learn as you go', color: 'from-amber-50 to-orange-50', border: 'border-amber-200' },
  { id: 'general', label: 'General Practice', emoji: '📝', description: 'Practice with common words and phrases', color: 'from-green-50 to-emerald-50', border: 'border-green-200' },
]

export default function ContentSelect({ user, onStart, onBack, initialCategory }) {
  const [blocks, setBlocks] = useState([])
  const [progress, setProgress] = useState({})
  const [bestWpms, setBestWpms] = useState({})
  const [bestAccuracies, setBestAccuracies] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [showResumeModal, setShowResumeModal] = useState(false)

  // General practice settings
  const [wordCount, setWordCount] = useState(50)
  const [mode, setMode] = useState('words')
  const [timeMinutes, setTimeMinutes] = useState(5)
  const [textMode, setTextMode] = useState('basic')

  useEffect(() => {
    async function load() {
      const [b, p, w, a] = await Promise.all([
        getContentBlocks(),
        getProgress(user.id),
        getBestWpm(user.id),
        getBestAccuracy(user.id),
      ])
      setBlocks(b)
      setProgress(p)
      setBestWpms(w)
      setBestAccuracies(a)
      setLoading(false)
    }
    load()
  }, [user.id])

  // Categorize blocks
  const storyBlocks = blocks.filter(b => b.category === 'Story')
  const kbBlocks = blocks.filter(b => b.category === 'Keyboard Basics').sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase
    return a.order - b.order
  })
  const generalBlocks = blocks.filter(b => b.category === 'General Practice')

  // Group story blocks by series
  const storySeries = {}
  storyBlocks.forEach(b => {
    const series = b.series || 'Other'
    if (!storySeries[series]) storySeries[series] = []
    storySeries[series].push(b)
  })
  // Sort each series by order or id
  Object.values(storySeries).forEach(arr => arr.sort((a, b) => (a.order || 0) - (b.order || 0)))

  // Group KB blocks by phase
  const kbPhases = {}
  kbBlocks.forEach(b => {
    const key = `Phase ${b.phase}: ${b.phaseTitle}`
    if (!kbPhases[key]) kbPhases[key] = []
    kbPhases[key].push(b)
  })

  // Check if a KB section is unlocked — Tester user bypasses lock
  const isTester = user.name?.toLowerCase() === 'tester'
  function isKbUnlocked(block) {
    if (isTester) return true
    if (!block.unlockRequirement) return true
    const reqAccuracy = bestAccuracies[block.unlockRequirement]
    return reqAccuracy >= 90
  }

  // Check if a KB section is mastered
  function isKbMastered(block) {
    const acc = bestAccuracies[block.id]
    const wpm = bestWpms[block.id]
    return acc >= 95 && wpm >= (block.masteryWpm || 15)
  }

  function handleStart(fromBeginning = false) {
    if (!selectedBlock) return
    const isStoryOrKb = selectedBlock.category === 'Story' || selectedBlock.category === 'Keyboard Basics'
    const startWord = fromBeginning ? 0 : (progress[selectedBlock.id]?.lastWordIndex || 0)
    onStart({
      block: selectedBlock,
      startWord,
      wordCount: isStoryOrKb ? null : (mode === 'words' ? wordCount : null),
      timeLimit: isStoryOrKb ? null : (mode === 'time' ? timeMinutes * 60 : null),
      textMode: isStoryOrKb ? 'full' : textMode,
      allActiveKeys: selectedBlock.allActiveKeys || null,
    })
  }

  const selectedHasProgress = selectedBlock && progress[selectedBlock.id]?.lastWordIndex > 0

  function handleStartClick() {
    if (!selectedBlock) return
    if (selectedHasProgress) {
      setShowResumeModal(true)
    } else {
      handleStart(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100dvh', backgroundColor: '#e8e9ed' }}>
        <div className="text-gray-400 font-medium">Loading...</div>
      </div>
    )
  }

  // ── Category Picker ──────────────────────────────────
  if (!selectedCategory) {
    return (
      <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#e8e9ed' }}>
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <button onClick={onBack} className="p-2 hover:bg-white/60 rounded-xl transition-colors text-gray-400">←</button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">Choose Practice</h2>
            <p className="text-xs text-gray-500">Hi {user.name}! 👋 Pick a category.</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="grid grid-cols-3 gap-5 max-w-3xl w-full">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedBlock(null) }}
                className={`bg-gradient-to-br ${cat.color} border-2 ${cat.border} rounded-3xl p-8 text-center transition-all hover:scale-105 hover:shadow-lg active:scale-95`}
                style={{ boxShadow: cardShadow }}
              >
                <div className="text-5xl mb-4">{cat.emoji}</div>
                <div className="text-lg font-bold text-gray-800 mb-1">{cat.label}</div>
                <div className="text-xs text-gray-500">{cat.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Category Detail View ─────────────────────────────
  const catInfo = CATEGORIES.find(c => c.id === selectedCategory)

  return (
    <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#e8e9ed' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <button onClick={() => { setSelectedCategory(null); setSelectedBlock(null) }} className="p-2 hover:bg-white/60 rounded-xl transition-colors text-gray-400">←</button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">{catInfo.emoji} {catInfo.label}</h2>
          <p className="text-xs text-gray-500">{catInfo.description}</p>
        </div>
      </div>

      {/* Settings bar — only for General Practice */}
      {selectedCategory === 'general' && (
        <div className="px-5 py-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2" style={{ boxShadow: cardShadow }}>
            <div className="flex items-center gap-1">
              <span className="text-xs mr-1">📏</span>
              <button onClick={() => setMode('words')} className={pill(mode === 'words')}>Words</button>
              <button onClick={() => setMode('time')} className={pill(mode === 'time')}>⏱️ Time</button>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            {mode === 'words' ? (
              <div className="flex items-center gap-1">
                {[20, 50, 100].map(n => (
                  <button key={n} onClick={() => setWordCount(n)} className={pill(wordCount === n)}>{n}</button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {[2, 5, 10].map(n => (
                  <button key={n} onClick={() => setTimeMinutes(n)} className={pill(timeMinutes === n)}>{n}m</button>
                ))}
              </div>
            )}
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-1">
              <span className="text-xs mr-1">🔠</span>
              <button onClick={() => setTextMode('basic')} className={pill(textMode === 'basic')}>Basic</button>
              <button onClick={() => setTextMode('full')} className={pill(textMode === 'full')}>Full</button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-1">

        {/* ── Story Mode ── */}
        {selectedCategory === 'story' && (
          <div className="space-y-4">
            {Object.entries(storySeries).map(([series, seriesBlocks]) => {
              const seriesEmoji = series.includes('Hobbit') ? '📕' : series.includes('Hockey') ? '🏒' : '📖'
              return (
                <div key={series}>
                  <h3 className="text-sm font-bold text-gray-700 mb-2">{seriesEmoji} {series}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {seriesBlocks.map((block, idx) => {
                      const isSelected = selectedBlock?.id === block.id
                      const best = bestWpms[block.id]
                      const hasProgress = progress[block.id]?.lastWordIndex > 0
                      const isCompleted = !!best
                      const isInProgress = hasProgress && !isCompleted
                      return (
                        <button
                          key={block.id}
                          onClick={() => setSelectedBlock(block)}
                          className={`p-3 rounded-2xl text-left transition-all backdrop-blur-sm ${
                            isSelected
                              ? 'bg-blue-500 text-white shadow-lg scale-[1.02]'
                              : isCompleted
                                ? 'bg-green-50/80 border border-green-200/50 hover:bg-green-50 hover:scale-[1.01]'
                                : isInProgress
                                  ? 'bg-amber-50/80 border border-amber-200/50 hover:bg-amber-50 hover:scale-[1.01]'
                                  : 'bg-white/80 hover:bg-white hover:scale-[1.01]'
                          }`}
                          style={{ boxShadow: isSelected ? undefined : cardShadow }}
                        >
                          <div className="text-[10px] font-medium mb-0.5 flex items-center gap-1" style={isSelected ? { color: 'rgba(255,255,255,0.7)' } : { color: '#9ca3af' }}>
                            <span>Section {idx + 1}</span>
                            {isCompleted && !isSelected && <span className="text-green-500">✓</span>}
                            {isInProgress && !isSelected && <span className="text-amber-500">⋯</span>}
                          </div>
                          <div className="font-medium text-xs truncate">{block.title}</div>
                          <div className={`text-[10px] flex items-center gap-1 mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                            <span>{block.wordCount} words</span>
                            {best && (
                              <span className={`font-semibold ${isSelected ? 'text-blue-100' : 'text-amber-500'}`}>· {best} WPM</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Keyboard Basics ── */}
        {selectedCategory === 'keyboard' && (
          <div className="space-y-4">
            {Object.entries(kbPhases).map(([phaseLabel, phaseBlocks]) => (
              <div key={phaseLabel}>
                <h3 className="text-sm font-bold text-gray-700 mb-2">🎯 {phaseLabel}</h3>
                <div className="space-y-1.5">
                  {phaseBlocks.map(block => {
                    const unlocked = isKbUnlocked(block)
                    const mastered = isKbMastered(block)
                    const passed = bestAccuracies[block.id] >= 90
                    const isSelected = selectedBlock?.id === block.id
                    const bestAcc = bestAccuracies[block.id]
                    const bestW = bestWpms[block.id]

                    return (
                      <button
                        key={block.id}
                        onClick={() => unlocked && setSelectedBlock(block)}
                        disabled={!unlocked}
                        className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 ${
                          !unlocked
                            ? 'bg-gray-100/60 opacity-50 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-500 text-white shadow-lg scale-[1.01]'
                              : 'bg-white/80 hover:bg-white hover:scale-[1.005] backdrop-blur-sm'
                        }`}
                        style={{ boxShadow: unlocked && !isSelected ? cardShadow : undefined }}
                      >
                        {/* Status icon */}
                        <div className="text-lg flex-shrink-0">
                          {!unlocked ? '🔒' : mastered ? '⭐' : passed ? '✅' : '🔓'}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>{block.id.replace('kb-', '')}</span>
                            <span className="font-medium text-sm truncate">{block.title}</span>
                          </div>
                          {block.keysIntroduced?.length > 0 && (
                            <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                              New keys: <span className="font-mono font-bold">{block.keysIntroduced.join(' ')}</span>
                            </div>
                          )}
                        </div>
                        {/* Stats */}
                        {unlocked && bestAcc != null && (
                          <div className={`text-right flex-shrink-0 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                            <div className="text-xs font-semibold">{bestAcc}%</div>
                            {bestW && <div className="text-[10px]">{bestW} WPM</div>}
                          </div>
                        )}
                        {/* Word count */}
                        <div className={`text-[10px] flex-shrink-0 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                          {block.wordCount}w
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── General Practice ── */}
        {selectedCategory === 'general' && (
          <div className="grid grid-cols-3 gap-2">
            {generalBlocks.map(block => {
              const isSelected = selectedBlock?.id === block.id
              const best = bestWpms[block.id]
              return (
                <button
                  key={block.id}
                  onClick={() => setSelectedBlock(block)}
                  className={`p-3 rounded-2xl text-left transition-all backdrop-blur-sm ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-lg scale-[1.02]'
                      : 'bg-white/80 hover:bg-white hover:scale-[1.01]'
                  }`}
                  style={{ boxShadow: isSelected ? undefined : cardShadow }}
                >
                  <div className="font-medium text-xs truncate">{block.title}</div>
                  <div className={`text-[10px] flex items-center gap-1 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                    <span>{block.wordCount} words</span>
                    {best && (
                      <span className={`font-semibold ${isSelected ? 'text-blue-100' : 'text-amber-500'}`}>· 🏅 {best} WPM</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Start button — fixed at bottom */}
      {selectedBlock && (
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={handleStartClick}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-lg transition-all shadow-md hover:shadow-lg hover:scale-[1.01]"
          >
            🚀 Start Practice
          </button>
        </div>
      )}

      {/* Resume/Restart modal */}
      {showResumeModal && selectedBlock && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowResumeModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Continue where you left off?</h3>
            <p className="text-sm text-gray-500 mb-5">
              You're {Math.round((progress[selectedBlock.id]?.lastWordIndex / selectedBlock.wordCount) * 100)}% through <strong>{selectedBlock.title}</strong>.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowResumeModal(false); handleStart(false) }} className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors">
                Continue ({Math.round((progress[selectedBlock.id]?.lastWordIndex / selectedBlock.wordCount) * 100)}%)
              </button>
              <button onClick={() => { setShowResumeModal(false); handleStart(true) }} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">
                Start from beginning
              </button>
              <button onClick={() => setShowResumeModal(false)} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
