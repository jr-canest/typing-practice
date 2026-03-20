# Typing Practice App

A typing practice app for homeschool kids. Built with React, uses localStorage for persistence. Deployed to Firebase Hosting.

## Stack

- React (Vite)
- Tailwind CSS v4
- localStorage for persistence (user data, session history, content library)
- Web Audio API for sounds (keystroke, error, countdown beeps, celebration, record fanfare)
- No external typing libraries — built from scratch

## Core Architecture

### User System

- On launch, show a user selection screen (Netflix-style profiles)
- Each user has a name, avatar (emoji), and PIN (simple 4-digit, stored in localStorage)
- Admin/parent mode (separate PIN, default 1234) to:
  - Add/remove users
  - Add/edit typing content (paste in paragraphs or word lists)
  - View per-user stats and session history
  - Manage settings

### Content System

- Admin pastes in content blocks: paragraphs, word lists, etc.
- Each content block has a title, category (e.g., "Fundamentals," "Challenge," "Story"), and the raw text
- The app splits content into words for the typing exercise
- Track per-user progress through each content block (which word they left off on)
- Built-in starter content: Home Row Basics, Top Row Practice, Bottom Row Practice, Common English Words (100), Pangram Collection
- Built-in story content: The Hobbit Chapter 1, split into 8 sections (~230-270 words each)
- Best WPM record shown per content block on the selection screen

### Typing Screen

#### Word Display (Paper Card)

- Paper-style card with rounded corners, centered between stats bar and keyboard
- Shows 3+ lines of words in monospace font, scaled proportionally to viewport
- Current word: letter-by-letter coloring (green=done, blue underline=cursor, red bg=error)
- Row-based opacity: current row 100%, other rows 50%
- Smooth auto-scroll when advancing to a new line
- Space symbol (⎵) always rendered on every word (invisible by default, visible blue+pulsing when space expected) — prevents layout shift
- Word completion ghost animation: completed word scales to 200% and fades out in green

#### Keyboard Visual

- On-screen keyboard at bottom, scaled proportionally to viewport (`Math.min(vw/1024, vh/768, 1)`)
- White container with backdrop blur and subtle shadow
- **Highlight the correct key** for the next character to type
- **Color-code keys by finger assignment** (8 colors, one per finger — soft/distinct pastels)
- Non-active keys at 60% opacity so the target key stands out
- Key press animation on each keystroke
- Keyboard nudged up 20px (scaled) above hands to prevent finger overlap

#### Hand Guide

- SVG hands positioned `fixed` at viewport bottom, white fill with subtle drop shadow
- ViewBox tightened to actual path bounds (`280 462 1440 512`) for flush bottom alignment
- `preserveAspectRatio="xMidYMin meet"` — sizes naturally from width
- Active finger highlighted with matching finger color (solid circle, no outline)
- Width: `440 * scale` pixels

#### Metrics (live during session)

- WPM (words per minute) — rolling, updated every 2 seconds via ref (avoids stale closure)
- Accuracy percentage — correct keystrokes / total keystrokes
- Time elapsed (with time limit display if set)
- Words completed / total words in session
- Streak container — dual counters for keys and words, horizontal "STREAK" label on top
  - **Letter streak**: consecutive correct keystrokes, resets on any error
    - Color progression: gray (0-9) → yellow (10+) → amber (25+) → orange (50+) → red (100+)
    - Fire emoji at 10+ streak
    - Milestones at 10/25/50/100/200 with combo popup
  - **Word streak**: consecutive perfect words (no errors), resets on any error
    - Color progression: gray (0-2) → cyan (3+) → sky (5+) → blue (10+) → purple (20+)
    - Sparkle emoji at 3+ streak
    - Milestones at 3/5/10/20 with combo popup
  - Warm gradient background when either streak is hot (keys ≥10 or words ≥3)
  - Combo milestone popups appear below the streak container (bounce animation)

#### Controls

- "End Session" button (top right) — saves progress and shows results
- Escape key also ends session (saves progress)

### Session Flow

1. User selects a content block from the Choose Practice screen
   - Always shows single "Start Practice" button
   - If block has progress: modal asks "Continue (word N)" or "Start from beginning"
   - Story blocks auto-disable settings bar (full text mode, all words)
2. Compact settings bar at top: Words/Time toggle, amount (20/50/100 or 2m/5m/10m), Basic/Full text mode
3. "Ready → Set → GO!" countdown (490ms per step) with beep sounds (higher tone on GO!)
4. Typing begins — keystroke and error sounds play via Web Audio API
5. On completion or "End Session" → results screen

### Results Screen

- Celebratory entrance: confetti particles + ascending chime arpeggio
- Emoji + message based on accuracy (Trophy 98%+, Star 90%+, Muscle 80%+, etc.)
- Stat cards with staggered pop-in animation: WPM, Accuracy, Time, Words
- **New Record banner**: golden gradient with bounce animation + fanfare sound when beating previous best WPM on that content block
- **Problem keys breakdown**: keys with <100% accuracy, color-coded by severity
- **Accuracy Heat Map**: mini keyboard with keys shaded green→red by accuracy
- Actions: Try Again, Home (returns to content select, keeps user logged in)
- Scrollable on short viewports (`overflow-y-auto`, `100dvh`)

### Sound System (`/src/lib/sounds.js`)

- **Keystroke**: Pre-loaded MP3 (`/public/sounds/keystroke.mp3`), played via Web Audio API buffer for zero latency, volume 0.4
- **Error**: Synthesized sine wave, 180→100Hz in 80ms, volume 0.15
- **Countdown beep**: Synthesized sine at 520Hz (normal) or 880→1100Hz (GO!), volume 0.18-0.25
- **Celebration**: Ascending arpeggio C5→E5→G5→C6, 120ms spacing
- **New Record fanfare**: Melody + harmony layer (thirds above, delayed 80ms)
- All sounds use `AudioContext` with autoplay policy resume handling

## Data Model (localStorage)

```
users              → [{ id, name, pin, avatar, createdAt }]
sessions_{userId}  → [{ contentBlockId, startedAt, completedAt, wordsCompleted, totalWords, wpm, accuracy, keyErrors }]
progress_{userId}  → { [contentBlockId]: { lastWordIndex, updatedAt } }
contentBlocks      → [{ id, title, category, text, wordCount, createdAt }]
config             → { adminPin }
```

Helper: `getBestWpm(userId)` returns `{ [contentBlockId]: bestWpmNumber }` from session history.

## UI / Design Direction

- Clean, kid-friendly but not babyish — educational app feel
- Consistent grey background (`#e8e9ed`) across all screens
- White/translucent cards (`bg-white/80 backdrop-blur-sm`) with subtle shadow (`0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`)
- Large readable type (monospace for typing words, sans-serif for UI)
- Minimal chrome — focus on the word and the keyboard
- Smooth transitions/animations (word ghost, combo popups, results stat pop-in, confetti, countdown pop)
- Viewport-proportional scaling: `scale = Math.min(vw/1024, vh/768, 1)` — works on iPad horizontal (1024x768) and desktop
- `100dvh` for iOS Safari compatibility (dynamic viewport height)
- Emojis used throughout for friendly feel (settings, categories, streak, results)

## CSS Animations (`/src/index.css`)

- `key-press`: scale 1→0.92→1 in 150ms
- `slide-in`: translateX(40px)→0 with opacity
- `word-ghost`: scale 1→2, opacity 0.8→0 in 500ms (green, absolute positioned)
- `combo-popup`: scale 0.3→1.15→1, hold, then scale→1.3 + fade in 1500ms
- `results-stat`: scale(0.5)+translateY(20px)→scale(1.05)→scale(1) in 500ms (staggered via animationDelay)
- `results-bounce`: scale 0→1.3→0.9→1 in 600ms
- `confetti-fall`: translateY(0)→100vh with rotation and drift, 2s
- `new-record-banner`: scale(0.5)+rotate(-2deg)→bounce→settle in 600ms
- `countdown-pop`: scale(0.5)→1.2→1 in 500ms

## Finger-to-Key Mapping Reference

Use standard touch typing assignments:

| Finger | Keys |
|---|---|
| Left Pinky | q, a, z, 1, `, Tab, Caps, Shift |
| Left Ring | w, s, x, 2 |
| Left Middle | e, d, c, 3 |
| Left Index | r, f, v, t, g, b, 4, 5 |
| Right Index | y, h, n, u, j, m, 6, 7 |
| Right Middle | i, k, ,, 8 |
| Right Ring | o, l, ., 9 |
| Right Pinky | p, ;, /, 0, -, =, [, ], ', \, Enter, Shift, Backspace |
| Thumbs | Space |

## Key Implementation Details

- Keystrokes captured via `onKeyDown` on a focused `div[tabIndex=0]` — no input elements
- WPM uses a ref (`completedWordsRef`) to avoid stale closure in `setInterval`
- Space symbol (⎵) always rendered (invisible) on every word to prevent layout shift — only becomes visible/pulsing on the current word when space is expected
- Wrong key when space is expected: triggers error sound, red highlight, resets streak
- Row-based opacity: `useEffect` measures `offsetTop` of each word span, sets opacity based on match with current word's row
- Paper card auto-scrolls: `scrollTo({ top: wordTop - paperHeight/3, behavior: 'smooth' })`
- Hands: `position: fixed; bottom: 0` with SVG `viewBox` tightened to actual path bounds (measured via `getBBox()`) for flush bottom edge
- PIN entry: numeric keypad UI, no physical keyboard required
- All screens use `100dvh` height and consistent `#e8e9ed` background

## File Structure

```
src/
  App.jsx              — Screen router, session management, record detection
  index.css            — Tailwind config, CSS animations
  components/
    Keyboard.jsx       — On-screen keyboard (KEY_SIZE=34, GAP=2)
    HandGuide.jsx      — SVG hands with finger highlights
  screens/
    UserSelect.jsx     — Netflix-style profile picker
    ContentSelect.jsx  — Content blocks grid (3-col), settings bar, resume/restart
    TypingScreen.jsx   — Main typing interface (countdown, typing, metrics, streak)
    ResultsScreen.jsx  — Session results (confetti, record, heat map)
    AdminScreen.jsx    — Users/Content/Stats/Settings tabs
  lib/
    keyboard.js        — Key layout, finger mapping, colors
    storage.js         — localStorage CRUD (users, sessions, progress, content, bestWpm)
    sounds.js          — Web Audio API (keystroke, error, beep, celebration, fanfare)
public/
  sounds/
    keystroke.mp3      — Key click sound
```

## Out of Scope (for now)

- Firestore integration (currently localStorage only, hosted on Firebase)
- Multiplayer / race mode
- Gamification (points, badges, unlocks)
- Typing games (falling words, etc.)
- Mobile/touch keyboard support
- Dark mode
- Targeted drill mode (auto-generate from weak keys)
- Daily practice tracker
