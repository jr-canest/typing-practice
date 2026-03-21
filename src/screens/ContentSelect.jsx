import { useState, useEffect } from 'react'
import { getContentBlocks, getProgress, getBestWpm } from '../lib/storage'

const CATEGORY_EMOJI = {
  Fundamentals: '🔤',
  Challenge: '🏆',
  Story: '📖',
  Science: '🔬',
}

export default function ContentSelect({ user, onStart, onBack }) {
  const [blocks, setBlocks] = useState([])
  const [progress, setProgress] = useState({})
  const [bestWpms, setBestWpms] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [wordCount, setWordCount] = useState(50)
  const [mode, setMode] = useState('words')
  const [timeMinutes, setTimeMinutes] = useState(5)
  const [textMode, setTextMode] = useState('basic')

  useEffect(() => {
    async function load() {
      const [b, p, w] = await Promise.all([
        getContentBlocks(),
        getProgress(user.id),
        getBestWpm(user.id),
      ])
      setBlocks(b)
      setProgress(p)
      setBestWpms(w)
      setLoading(false)
    }
    load()
  }, [user.id])

  const categories = {}
  blocks.forEach((b) => {
    if (!categories[b.category]) categories[b.category] = []
    categories[b.category].push(b)
  })

  const isStory = selectedBlock?.category === 'Story'

  function handleStart(fromBeginning = false) {
    if (!selectedBlock) return
    const startWord = fromBeginning ? 0 : (progress[selectedBlock.id]?.lastWordIndex || 0)
    onStart({
      block: selectedBlock,
      startWord,
      wordCount: isStory ? null : (mode === 'words' ? wordCount : null),
      timeLimit: isStory ? null : (mode === 'time' ? timeMinutes * 60 : null),
      textMode: isStory ? 'full' : textMode,
    })
  }

  const selectedHasProgress = selectedBlock && progress[selectedBlock.id]?.lastWordIndex > 0
  const [showResumeModal, setShowResumeModal] = useState(false)

  function handleStartClick() {
    if (!selectedBlock) return
    if (selectedHasProgress) {
      setShowResumeModal(true)
    } else {
      handleStart(true)
    }
  }

  const cardShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'

  const pill = (active) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? 'bg-blue-500 text-white shadow-sm' : 'bg-white/60 text-gray-500 hover:bg-white/80'}`

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100dvh', backgroundColor: '#e8e9ed' }}>
        <div className="text-gray-400 font-medium">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#e8e9ed' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <button onClick={onBack} className="p-2 hover:bg-white/60 rounded-xl transition-colors text-gray-400">
          ←
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">Choose Practice</h2>
          <p className="text-xs text-gray-500">Hi {user.name}! 👋 Pick what to practice.</p>
        </div>
      </div>

      {/* Compact settings bar — disabled for Story blocks */}
      <div className="px-5 py-2">
        <div
          className={`bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2 transition-opacity duration-300 ${isStory ? 'opacity-40 pointer-events-none' : ''}`}
          style={{ boxShadow: cardShadow }}
        >
          <div className="flex items-center gap-1">
            <span className="text-xs mr-1">📏</span>
            <button onClick={() => setMode('words')} className={pill(mode === 'words')}>Words</button>
            <button onClick={() => setMode('time')} className={pill(mode === 'time')}>⏱️ Time</button>
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {mode === 'words' ? (
            <div className="flex items-center gap-1">
              {[20, 50, 100].map((n) => (
                <button key={n} onClick={() => setWordCount(n)} className={pill(wordCount === n)}>
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {[2, 5, 10].map((n) => (
                <button key={n} onClick={() => setTimeMinutes(n)} className={pill(timeMinutes === n)}>
                  {n}m
                </button>
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

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-1">
        {/* Content blocks by category */}
        <div className="space-y-3">
          {Object.entries(categories).map(([cat, catBlocks]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {CATEGORY_EMOJI[cat] || '📝'} {cat}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {catBlocks.map((block) => {
                  const isSelected = selectedBlock?.id === block.id
                  const best = bestWpms[block.id]
                  return (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlock(block)}
                      className={`p-2.5 rounded-2xl text-left transition-all backdrop-blur-sm ${
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
                          <span className={`font-semibold ${isSelected ? 'text-blue-100' : 'text-amber-500'}`}>
                            · 🏅 {best} WPM
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
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
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">Continue where you left off?</h3>
            <p className="text-sm text-gray-500 mb-5">
              You were on word {progress[selectedBlock.id]?.lastWordIndex} of {selectedBlock.wordCount} in <strong>{selectedBlock.title}</strong>.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setShowResumeModal(false); handleStart(false) }}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
              >
                ▶️ Continue (word {progress[selectedBlock.id]?.lastWordIndex})
              </button>
              <button
                onClick={() => { setShowResumeModal(false); handleStart(true) }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                🔄 Start from beginning
              </button>
              <button
                onClick={() => setShowResumeModal(false)}
                className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
