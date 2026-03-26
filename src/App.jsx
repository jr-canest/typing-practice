import { useState, useEffect } from 'react'
import { seedStarterContent, seedHobbitContent, seedCanucksContent, seedKeyboardBasicsContent, migrateContent, saveSession, getContentBlock, getContentBlocks, getProgress, getBestWpm } from './lib/storage'
import UserSelect from './screens/UserSelect'
import AdminScreen from './screens/AdminScreen'
import ContentSelect from './screens/ContentSelect'
import TypingScreen from './screens/TypingScreen'
import ResultsScreen from './screens/ResultsScreen'

export default function App() {
  const [screen, setScreen] = useState('userSelect')
  const [currentUser, setCurrentUser] = useState(null)
  const [sessionConfig, setSessionConfig] = useState(null)
  const [sessionResults, setSessionResults] = useState(null)
  const [ready, setReady] = useState(false)

  // Seed starter content on first load
  useEffect(() => {
    async function init() {
      await seedStarterContent()
      await seedHobbitContent()
      await seedCanucksContent()
      await seedKeyboardBasicsContent()
      await migrateContent()
      setReady(true)
    }
    init()
  }, [])

  function handleSelectUser(user) {
    setCurrentUser(user)
    setScreen('contentSelect')
  }

  async function handleStartSession(config) {
    setSessionConfig(config)
    setScreen('typing')
  }

  async function handleFinishSession(results) {
    // Check for record before saving
    const bestWpms = await getBestWpm(currentUser.id)
    const previousBest = bestWpms[results.contentBlockId] || 0
    const isNewRecord = results.wpm > previousBest && results.wpm > 0

    // Save session to storage
    await saveSession(currentUser.id, {
      ...results,
      startedAt: Date.now() - results.elapsed * 1000,
      completedAt: Date.now(),
    })

    // Find next logical block
    const allBlocks = await getContentBlocks()
    const currentBlock = sessionConfig.block
    let nextBlock = null

    if (currentBlock.category === 'Keyboard Basics') {
      // KB: next by phase then order
      const kbBlocks = allBlocks
        .filter(b => b.category === 'Keyboard Basics')
        .sort((a, b) => a.phase !== b.phase ? a.phase - b.phase : a.order - b.order)
      const idx = kbBlocks.findIndex(b => b.id === currentBlock.id)
      if (idx >= 0 && idx < kbBlocks.length - 1) nextBlock = kbBlocks[idx + 1]
    } else if (currentBlock.category === 'Story' && currentBlock.series) {
      // Story: next in same series by order
      const seriesBlocks = allBlocks
        .filter(b => b.series === currentBlock.series)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      const idx = seriesBlocks.findIndex(b => b.id === currentBlock.id)
      if (idx >= 0 && idx < seriesBlocks.length - 1) nextBlock = seriesBlocks[idx + 1]
    }

    setSessionResults({ ...results, isNewRecord, previousBest, nextBlock })
    setScreen('results')
  }

  async function handleRetry() {
    // Restart same content from same position
    const block = await getContentBlock(sessionConfig.block.id)
    if (block) {
      setSessionConfig({
        ...sessionConfig,
        block,
        startWord: sessionConfig.startWord,
      })
    }
    setScreen('typing')
  }

  async function handleContinue() {
    // Continue from where we left off
    const block = await getContentBlock(sessionConfig.block.id)
    if (block) {
      const progress = await getProgress(currentUser.id)
      const lastWord = progress[block.id]?.lastWordIndex || 0
      setSessionConfig({
        ...sessionConfig,
        block,
        startWord: lastWord,
      })
    }
    setScreen('typing')
  }

  async function handleNextLesson() {
    const nextBlock = sessionResults?.nextBlock
    if (!nextBlock) return
    const isStoryOrKb = nextBlock.category === 'Story' || nextBlock.category === 'Keyboard Basics'
    setSessionConfig({
      block: nextBlock,
      startWord: 0,
      wordCount: isStoryOrKb ? null : sessionConfig?.wordCount,
      timeLimit: isStoryOrKb ? null : sessionConfig?.timeLimit,
      textMode: isStoryOrKb ? 'full' : (sessionConfig?.textMode || 'basic'),
      allActiveKeys: nextBlock.allActiveKeys || null,
    })
    setSessionResults(null)
    setScreen('typing')
  }

  function goHome() {
    setCurrentUser(null)
    setSessionConfig(null)
    setSessionResults(null)
    setScreen('userSelect')
  }

  function goToContentSelect(category) {
    const cat = category || null
    setSessionConfig(prev => ({ ...prev, _returnCategory: cat }))
    setSessionResults(null)
    setScreen('contentSelect')
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center" style={{ backgroundColor: '#e8e9ed', height: '100dvh' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">⌨️</div>
          <div className="text-gray-400 font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  switch (screen) {
    case 'userSelect':
      return (
        <UserSelect
          onSelectUser={handleSelectUser}
          onAdmin={() => setScreen('admin')}
        />
      )

    case 'admin':
      return <AdminScreen onBack={goHome} />

    case 'contentSelect':
      return (
        <ContentSelect
          user={currentUser}
          onStart={handleStartSession}
          onBack={goHome}
          initialCategory={sessionConfig?._returnCategory || null}
        />
      )

    case 'typing':
      return (
        <TypingScreen
          user={currentUser}
          session={sessionConfig}
          onFinish={handleFinishSession}
          onQuit={() => setScreen('contentSelect')}
        />
      )

    case 'results':
      return (
        <ResultsScreen
          results={sessionResults}
          onRetry={handleRetry}
          onNext={sessionResults?.nextBlock ? handleNextLesson : null}
          nextBlockTitle={sessionResults?.nextBlock?.title}
          onHome={() => {
            const cat = sessionConfig?.block?.category
            const categoryId = cat === 'Keyboard Basics' ? 'keyboard' : cat === 'Story' ? 'story' : cat === 'General Practice' ? 'general' : null
            goToContentSelect(categoryId)
          }}
        />
      )

    default:
      return null
  }
}
