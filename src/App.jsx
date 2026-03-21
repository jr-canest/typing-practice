import { useState, useEffect } from 'react'
import { seedStarterContent, seedHobbitContent, saveSession, getContentBlock, getProgress, getBestWpm } from './lib/storage'
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
    setSessionResults({ ...results, isNewRecord, previousBest })
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

  function goHome() {
    setCurrentUser(null)
    setSessionConfig(null)
    setSessionResults(null)
    setScreen('userSelect')
  }

  function goToContentSelect() {
    setSessionConfig(null)
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
          onHome={goToContentSelect}
        />
      )

    default:
      return null
  }
}
