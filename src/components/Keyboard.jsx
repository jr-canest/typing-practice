import { useState, useEffect } from 'react'
import { KEYBOARD_ROWS, KEY_TO_FINGER, FINGER_COLORS, SHIFTED_KEY_MAP, getShiftKey } from '../lib/keyboard'

const KEY_SIZE = 34
const GAP = 2

export default function Keyboard({ targetKey, pressedKey, activeKeys }) {
  const [animatingKey, setAnimatingKey] = useState(null)

  const targetLower = targetKey?.toLowerCase()
  const baseKey = SHIFTED_KEY_MAP[targetKey] || targetLower
  const needsShift = targetKey !== targetLower || !!SHIFTED_KEY_MAP[targetKey]
  const correctShift = needsShift ? getShiftKey(baseKey || targetKey) : null

  useEffect(() => {
    if (pressedKey) {
      setAnimatingKey(pressedKey.toLowerCase())
      const timer = setTimeout(() => setAnimatingKey(null), 150)
      return () => clearTimeout(timer)
    }
  }, [pressedKey])

  return (
    <div className="flex flex-col items-center gap-[2px]">
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-[2px]">
          {row.map((k, ki) => {
            const kLower = k.key.toLowerCase()
            const kFinger = KEY_TO_FINGER[k.key] || (k.noFinger ? null : KEY_TO_FINGER[k.key])
            const isTarget = baseKey === kLower || (targetKey === ' ' && k.key === ' ')
            const isShiftTarget = needsShift && k.key === correctShift
            const isHighlighted = isTarget || isShiftTarget
            const isAnimating = animatingKey === kLower
            const fingerColor = kFinger ? FINGER_COLORS[kFinger] : 'bg-gray-200'

            // If activeKeys is set, dim keys not yet introduced
            const isDimmed = activeKeys && !k.noFinger && !activeKeys.includes(kLower) && k.key !== ' '

            const w = k.w * KEY_SIZE + (k.w > 1 ? (k.w - 1) * GAP : 0)

            return (
              <div
                key={k.key + ki}
                className={`
                  flex items-center justify-center rounded-lg font-mono font-bold
                  border-b-2 select-none transition-all
                  ${isDimmed
                    ? 'bg-gray-100 border-gray-200 opacity-25'
                    : isHighlighted
                    ? `${fingerColor} border-gray-400 ring-2 ring-blue-500 ring-offset-1 scale-105 shadow-lg z-10`
                    : `${fingerColor} border-gray-300 opacity-60`
                  }
                  ${isAnimating ? 'key-pressed' : ''}
                  ${k.home && !isHighlighted ? 'border-b-[3px] border-gray-400' : ''}
                `}
                style={{
                  width: w,
                  height: KEY_SIZE,
                  fontSize: k.w > 1.2 ? 11 : 13,
                }}
              >
                {k.display}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
