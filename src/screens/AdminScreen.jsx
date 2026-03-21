import { useState, useEffect } from 'react'
import {
  getUsers, saveUser, deleteUser,
  getContentBlocks, saveContentBlock, deleteContentBlock,
  getSessions, getSettings, saveSettings,
} from '../lib/storage'
import { AVATARS } from '../lib/avatars'

function UserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | userId
  const [form, setForm] = useState({ name: '', pin: '', avatar: AVATARS[0] })

  useEffect(() => {
    getUsers().then(u => { setUsers(u); setLoading(false) })
  }, [])

  async function refreshUsers() {
    setUsers(await getUsers())
  }

  function startNew() {
    setForm({ name: '', pin: '', avatar: AVATARS[0] })
    setEditing('new')
  }

  function startEdit(user) {
    setForm({ name: user.name, pin: user.pin || '', avatar: user.avatar })
    setEditing(user.id)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    const existingUser = editing !== 'new' ? users.find(u => u.id === editing) : null
    const user = {
      id: editing === 'new' ? `user_${Date.now()}` : editing,
      name: form.name.trim(),
      pin: form.pin,
      avatar: form.avatar,
      createdAt: editing === 'new' ? Date.now() : (existingUser?.createdAt || Date.now()),
    }
    await saveUser(user)
    await refreshUsers()
    setEditing(null)
  }

  async function handleDelete(id) {
    await deleteUser(id)
    await refreshUsers()
  }

  if (loading) return <p className="text-gray-400 text-sm text-center py-4">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-700">Users</h3>
        <button onClick={startNew} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          + Add User
        </button>
      </div>

      {editing && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap gap-3 mb-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[140px]"
            />
            <input
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder="4-digit PIN (optional)"
              className="px-3 py-2 border rounded-lg text-sm w-40"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setForm({ ...form, avatar: a })}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${form.avatar === a ? 'bg-blue-100 ring-2 ring-blue-500 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Save</button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <span className="text-2xl">{user.avatar}</span>
            <span className="font-medium text-gray-700 flex-1">{user.name}</span>
            <button onClick={() => startEdit(user)} className="text-sm text-blue-500 hover:text-blue-700">Edit</button>
            <button onClick={() => handleDelete(user.id)} className="text-sm text-red-400 hover:text-red-600">Remove</button>
          </div>
        ))}
        {users.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No users yet.</p>}
      </div>
    </div>
  )
}

function ContentManager() {
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', category: '', text: '' })

  useEffect(() => {
    getContentBlocks().then(b => { setBlocks(b); setLoading(false) })
  }, [])

  async function refreshBlocks() {
    setBlocks(await getContentBlocks())
  }

  function startNew() {
    setForm({ title: '', category: '', text: '' })
    setEditing('new')
  }

  function startEdit(block) {
    setForm({ title: block.title, category: block.category, text: block.text })
    setEditing(block.id)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.text.trim()) return
    const existingBlock = editing !== 'new' ? blocks.find(b => b.id === editing) : null
    const block = {
      id: editing === 'new' ? `block_${Date.now()}` : editing,
      title: form.title.trim(),
      category: form.category.trim() || 'General',
      text: form.text.trim(),
      wordCount: form.text.trim().split(/\s+/).length,
      createdAt: editing === 'new' ? Date.now() : (existingBlock?.createdAt || Date.now()),
    }
    await saveContentBlock(block)
    await refreshBlocks()
    setEditing(null)
  }

  async function handleDelete(id) {
    await deleteContentBlock(id)
    await refreshBlocks()
  }

  if (loading) return <p className="text-gray-400 text-sm text-center py-4">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-700">Content Library</h3>
        <button onClick={startNew} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          + Add Content
        </button>
      </div>

      {editing && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex gap-3 mb-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="px-3 py-2 border rounded-lg text-sm flex-1"
            />
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category (e.g. Bible, Science)"
              className="px-3 py-2 border rounded-lg text-sm w-48"
            />
          </div>
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="Paste your text here..."
            rows={5}
            className="w-full px-3 py-2 border rounded-lg text-sm mb-3 resize-y"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Save</button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {blocks.map((block) => (
          <div key={block.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-700 truncate">{block.title}</div>
              <div className="text-xs text-gray-400">{block.category} · {block.wordCount} words</div>
            </div>
            <button onClick={() => startEdit(block)} className="text-sm text-blue-500 hover:text-blue-700 shrink-0">Edit</button>
            <button onClick={() => handleDelete(block.id)} className="text-sm text-red-400 hover:text-red-600 shrink-0">Remove</button>
          </div>
        ))}
        {blocks.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No content blocks yet.</p>}
      </div>
    </div>
  )
}

function StatsViewer() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    getUsers().then(u => { setUsers(u); setLoading(false) })
  }, [])

  async function handleSelectUser(userId) {
    setSelectedUser(userId)
    const s = await getSessions(userId)
    setSessions(s)
  }

  const recentSessions = sessions.slice(-20).reverse()
  const avgWpm = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length)
    : 0
  const avgAccuracy = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length)
    : 0

  if (loading) return <p className="text-gray-400 text-sm text-center py-4">Loading...</p>

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-700 mb-4">User Stats</h3>
      <div className="flex gap-2 mb-4 flex-wrap">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => handleSelectUser(u.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedUser === u.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {u.avatar} {u.name}
          </button>
        ))}
      </div>

      {selectedUser && sessions.length > 0 && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{avgWpm}</div>
              <div className="text-xs text-gray-400">Avg WPM</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">{avgAccuracy}%</div>
              <div className="text-xs text-gray-400">Avg Accuracy</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{sessions.length}</div>
              <div className="text-xs text-gray-400">Sessions</div>
            </div>
          </div>
          <div className="space-y-1">
            {recentSessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-2 text-sm shadow-sm">
                <span className="text-gray-400 text-xs w-24">{new Date(s.completedAt).toLocaleDateString()}</span>
                <span className="font-medium text-gray-700">{s.wpm} WPM</span>
                <span className="text-gray-500">{s.accuracy}%</span>
                <span className="text-gray-400 text-xs">{s.wordsCompleted} words</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedUser && sessions.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">No sessions yet for this user.</p>
      )}
    </div>
  )
}

function SettingsPanel() {
  const [settings, setSettings] = useState({ adminPin: '1234', dailyGoalMinutes: 10, dailyGoalSessions: 3 })
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then(s => { setSettings(s); setLoading(false) })
  }, [])

  async function handleSave() {
    await saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p className="text-gray-400 text-sm text-center py-4">Loading...</p>

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-700 mb-4">Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Admin PIN</label>
          <input
            value={settings.adminPin}
            onChange={(e) => setSettings({ ...settings, adminPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            className="px-3 py-2 border rounded-lg text-sm w-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Daily Goal (minutes)</label>
          <input
            type="number"
            value={settings.dailyGoalMinutes}
            onChange={(e) => setSettings({ ...settings, dailyGoalMinutes: Number(e.target.value) })}
            className="px-3 py-2 border rounded-lg text-sm w-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Daily Goal (sessions)</label>
          <input
            type="number"
            value={settings.dailyGoalSessions}
            onChange={(e) => setSettings({ ...settings, dailyGoalSessions: Number(e.target.value) })}
            className="px-3 py-2 border rounded-lg text-sm w-32"
          />
        </div>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default function AdminScreen({ onBack }) {
  const [tab, setTab] = useState('users')

  const tabs = [
    { id: 'users', label: 'Users' },
    { id: 'content', label: 'Content' },
    { id: 'stats', label: 'Stats' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen p-4 max-w-3xl mx-auto" style={{ backgroundColor: '#e8e9ed' }}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/60 rounded-lg transition-colors text-gray-500">
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Admin</h2>
      </div>

      <div className="flex gap-1 bg-white/50 rounded-xl p-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white/40 rounded-2xl p-5">
        {tab === 'users' && <UserManager />}
        {tab === 'content' && <ContentManager />}
        {tab === 'stats' && <StatsViewer />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}
