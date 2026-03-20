// Finger-to-key mapping and keyboard layout data

export const FINGER_COLORS = {
  'left-pinky': 'bg-pink-300',
  'left-ring': 'bg-violet-300',
  'left-middle': 'bg-blue-300',
  'left-index': 'bg-emerald-300',
  'right-index': 'bg-yellow-300',
  'right-middle': 'bg-orange-300',
  'right-ring': 'bg-red-300',
  'right-pinky': 'bg-fuchsia-300',
  'thumb': 'bg-gray-300',
}

// Hex versions for the SVG hand circles
export const FINGER_HEX = {
  'left-pinky': '#f9a8d4',
  'left-ring': '#c4b5fd',
  'left-middle': '#93c5fd',
  'left-index': '#6ee7b7',
  'right-index': '#fcd34d',
  'right-middle': '#fdba74',
  'right-ring': '#f87171',
  'right-pinky': '#e879f9',
  'thumb': '#d1d5db',
}

export const FINGER_LABELS = {
  'left-pinky': 'Left Pinky',
  'left-ring': 'Left Ring',
  'left-middle': 'Left Middle',
  'left-index': 'Left Index',
  'right-index': 'Right Index',
  'right-middle': 'Right Middle',
  'right-ring': 'Right Ring',
  'right-pinky': 'Right Pinky',
  'thumb': 'Thumb',
}

export const KEY_TO_FINGER = {
  '`': 'left-pinky', '~': 'left-pinky',
  '1': 'left-pinky', '!': 'left-pinky', q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
  '2': 'left-ring', '@': 'left-ring', w: 'left-ring', s: 'left-ring', x: 'left-ring',
  '3': 'left-middle', '#': 'left-middle', e: 'left-middle', d: 'left-middle', c: 'left-middle',
  '4': 'left-index', '$': 'left-index', r: 'left-index', f: 'left-index', v: 'left-index',
  '5': 'left-index', '%': 'left-index', t: 'left-index', g: 'left-index', b: 'left-index',
  '6': 'right-index', '^': 'right-index', y: 'right-index', h: 'right-index', n: 'right-index',
  '7': 'right-index', '&': 'right-index', u: 'right-index', j: 'right-index', m: 'right-index',
  '8': 'right-middle', '*': 'right-middle', i: 'right-middle', k: 'right-middle', ',': 'right-middle',
  '9': 'right-ring', '(': 'right-ring', o: 'right-ring', l: 'right-ring', '.': 'right-ring',
  '0': 'right-pinky', ')': 'right-pinky', p: 'right-pinky', ';': 'right-pinky', ':': 'right-pinky', '/': 'right-pinky', '?': 'right-pinky',
  '-': 'right-pinky', '_': 'right-pinky', '=': 'right-pinky', '+': 'right-pinky',
  '[': 'right-pinky', '{': 'right-pinky', ']': 'right-pinky', '}': 'right-pinky',
  "'": 'right-pinky', '"': 'right-pinky', '\\': 'right-pinky', '|': 'right-pinky',
  '<': 'right-middle', '>': 'right-ring',
  ' ': 'thumb',
}

export const KEYBOARD_ROWS = [
  [
    { key: '`', display: '`', w: 1 },
    { key: '1', display: '1', w: 1 },
    { key: '2', display: '2', w: 1 },
    { key: '3', display: '3', w: 1 },
    { key: '4', display: '4', w: 1 },
    { key: '5', display: '5', w: 1 },
    { key: '6', display: '6', w: 1 },
    { key: '7', display: '7', w: 1 },
    { key: '8', display: '8', w: 1 },
    { key: '9', display: '9', w: 1 },
    { key: '0', display: '0', w: 1 },
    { key: '-', display: '-', w: 1 },
    { key: '=', display: '=', w: 1 },
    { key: 'Backspace', display: '⌫', w: 1.5, noFinger: true },
  ],
  [
    { key: 'Tab', display: 'Tab', w: 1.5, noFinger: true },
    { key: 'q', display: 'Q', w: 1 },
    { key: 'w', display: 'W', w: 1 },
    { key: 'e', display: 'E', w: 1 },
    { key: 'r', display: 'R', w: 1 },
    { key: 't', display: 'T', w: 1 },
    { key: 'y', display: 'Y', w: 1 },
    { key: 'u', display: 'U', w: 1 },
    { key: 'i', display: 'I', w: 1 },
    { key: 'o', display: 'O', w: 1 },
    { key: 'p', display: 'P', w: 1 },
    { key: '[', display: '[', w: 1 },
    { key: ']', display: ']', w: 1 },
    { key: '\\', display: '\\', w: 1 },
  ],
  [
    { key: 'CapsLock', display: 'Caps', w: 1.75, noFinger: true },
    { key: 'a', display: 'A', w: 1 },
    { key: 's', display: 'S', w: 1 },
    { key: 'd', display: 'D', w: 1 },
    { key: 'f', display: 'F', w: 1, home: true },
    { key: 'g', display: 'G', w: 1 },
    { key: 'h', display: 'H', w: 1 },
    { key: 'j', display: 'J', w: 1, home: true },
    { key: 'k', display: 'K', w: 1 },
    { key: 'l', display: 'L', w: 1 },
    { key: ';', display: ';', w: 1 },
    { key: "'", display: "'", w: 1 },
    { key: 'Enter', display: '↵', w: 1.75, noFinger: true },
  ],
  [
    { key: 'ShiftLeft', display: '⇧', w: 2.25, noFinger: true },
    { key: 'z', display: 'Z', w: 1 },
    { key: 'x', display: 'X', w: 1 },
    { key: 'c', display: 'C', w: 1 },
    { key: 'v', display: 'V', w: 1 },
    { key: 'b', display: 'B', w: 1 },
    { key: 'n', display: 'N', w: 1 },
    { key: 'm', display: 'M', w: 1 },
    { key: ',', display: ',', w: 1 },
    { key: '.', display: '.', w: 1 },
    { key: '/', display: '/', w: 1 },
    { key: 'ShiftRight', display: '⇧', w: 2.25, noFinger: true },
  ],
  [
    { key: ' ', display: '', w: 5, noFinger: false },
  ],
]

// Map for shifted key → base key (for highlighting the right key on the keyboard)
export const SHIFTED_KEY_MAP = {
  '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\',
  ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
  '~': '`',
}

export function getFingerForKey(key) {
  return KEY_TO_FINGER[key.toLowerCase()] || KEY_TO_FINGER[key] || null
}

// SVG hand circle indices mapped to fingers
// Left hand: pinky=0, ring=1, middle=2, index=3, thumb=4
// Right hand: pinky=5, ring=6, middle=7, index=8, thumb=9
export const FINGER_TO_CIRCLE_INDEX = {
  'left-pinky': 0,
  'left-ring': 1,
  'left-middle': 2,
  'left-index': 3,
  'right-index': 8,
  'right-middle': 7,
  'right-ring': 6,
  'right-pinky': 5,
  'thumb': [4, 9], // both thumbs
}
