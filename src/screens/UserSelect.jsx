import { useState } from 'react'
import { getUsers, getSettings } from '../lib/storage'
import { AVATARS } from '../lib/avatars'
import PinEntry from '../components/PinEntry'

export default function UserSelect({ onSelectUser, onAdmin }) {
  const [showPin, setShowPin] = useState(null) // userId or 'admin'
  const users = getUsers()

  function handleUserClick(user) {
    if (user.pin) {
      setShowPin(user.id)
    } else {
      onSelectUser(user)
    }
  }

  function handlePinSubmit(pin) {
    if (showPin === 'admin') {
      const settings = getSettings()
      if (pin === settings.adminPin) {
        onAdmin()
        setShowPin(null)
        return true
      }
      return false
    }
    const user = users.find((u) => u.id === showPin)
    if (user && pin === user.pin) {
      onSelectUser(user)
      setShowPin(null)
      return true
    }
    return false
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#e8e9ed' }}>
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Typing Practice</h1>
      <p className="text-gray-500 mb-10">Who's practicing today?</p>

      <div className="flex flex-wrap justify-center gap-6 max-w-3xl mb-10">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-white/60 active:scale-95 transition-all w-32"
          >
            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-4xl">
              {user.avatar || '👤'}
            </div>
            <span className="font-semibold text-gray-700 text-lg">{user.name}</span>
          </button>
        ))}

        {users.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-6xl mb-4">👋</p>
            <p className="text-lg">No users yet!</p>
            <p className="text-sm">Open Admin to add your first user.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowPin('admin')}
        className="px-6 py-3 bg-white/70 hover:bg-white rounded-xl text-gray-600 font-medium shadow-sm transition-colors"
      >
        Parent / Admin
      </button>

      {showPin && (
        <PinEntry
          title={showPin === 'admin' ? 'Enter Admin PIN' : 'Enter PIN'}
          onSubmit={handlePinSubmit}
          onCancel={() => setShowPin(null)}
        />
      )}
    </div>
  )
}
