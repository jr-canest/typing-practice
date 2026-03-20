import { useState, useRef } from 'react'

export default function PinEntry({ title, onSubmit, onCancel }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const pinRef = useRef('')

  function handleDigit(d) {
    if (pinRef.current.length >= 4) return
    const next = pinRef.current + d
    pinRef.current = next
    setError(false)
    if (next.length === 4) {
      const ok = onSubmit(next)
      if (ok === false) {
        setError(true)
        pinRef.current = ''
        setPin('')
      } else {
        setPin(next)
      }
    } else {
      setPin(next)
    }
  }

  function handleDelete() {
    pinRef.current = pinRef.current.slice(0, -1)
    setPin(pinRef.current)
    setError(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl w-80 text-center">
        <h2 className="text-xl font-bold mb-2 text-gray-800">{title}</h2>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 my-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length
                  ? error ? 'bg-red-500 scale-110' : 'bg-blue-500 scale-110'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-3">Incorrect PIN. Try again.</p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(String(n))}
              className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-2xl font-semibold text-gray-700 transition-colors"
            >
              {n}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-2xl font-semibold text-gray-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-xl text-gray-500 transition-colors"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}
