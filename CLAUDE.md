# Typing Practice App

A typing practice app for homeschool kids. Built with React, uses Firestore for cross-device persistence. Deployed to Firebase Hosting via GitHub Actions.

## Stack

- React (Vite)
- Tailwind CSS v4
- Cloud Firestore for persistence (user data, session history, content library — syncs across devices)
- Firebase Hosting (auto-deployed from GitHub Actions on push to main)
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

Three categories with large icon-based selection:

**Keyboard Basics** (⌨️) — 24 progressive lessons across 4 phases
- Phase 1: Home Row (7 sections), Phase 2: Top Row (6), Phase 3: Bottom Row (6), Phase 4: All Together (6)
- Sequential unlock: 90%+ accuracy required to unlock next section
- Mastery badge at 95%+ accuracy AND 15+ WPM
- Tester user bypasses all locks for testing
- KB blocks stored with `phase`, `order`, `keysIntroduced`, `allActiveKeys`, `unlockRequirement`

**Story Mode** (📖) — Stories grouped by series
- The Hobbit: Chapter I (8 sections, ~230-270 words each)
- Hockey: Canucks History (8 sections)
- No settings bar, always full text mode with all words

**General Practice** (📝) — Common English Words, Pangram Collection
- Settings bar: Words/Time toggle, amount (20/50/100 or 2m/5m/10m), Basic/Full text mode

### Fun Display Modes (Keyboard Basics)

KB drill sections use playful typing modes instead of the paper card. The mode cycles based on block order: `['target', 'pop', 'cascade'][(order - 1) % 3]`. Consolidation sections (kb-1.07, kb-2.06, kb-3.05, kb-3.06, kb-4.*) use the traditional paper card.

**Target Shoot** (`target`) — Carnival shooting gallery
- Continuous stream of bullseye targets (including space as ⎵ target) sliding right-to-left
- Aim reticle (4 tick marks) centered on current target
- Hit animation: target knocks back + spark particles burst outward
- Finger-colored bullseye rings, white center behind letter
- Group pop sound on word completion

**Bubble Pop** (`pop`) — Floating bubbles
- Large circular bubbles with gradient shading and shine highlight
- Gentle floating/bobbing animation (`bubble-float`)
- Pop animation with colored particles on correct keystroke
- Finger-colored glow on active bubble

**Tile Drop** (`cascade`) — Scrabble tiles
- Rectangular tiles with finger-colored bottom border
- Tiles drop away with rotation on correct keystroke
- New tiles cascade in from above

**Component**: `src/components/FunDisplay.jsx` — renders mode based on prop, handles space prompt (hidden for target mode), progress dots/percentage

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
- **Group pop**: Quick rising chirp (600→900Hz, 120ms) — plays on word completion in fun display modes
- All sounds use `AudioContext` with autoplay policy resume handling

## Data Model (Firestore)

```
users/{userId}                          → { id, name, pin, avatar, createdAt }
users/{userId}/sessions/{auto-id}       → { contentBlockId, startedAt, completedAt, wordsCompleted, totalWords, wpm, accuracy, keyErrors }
users/{userId}/progress/{contentBlockId} → { lastWordIndex, updatedAt }
contentBlocks/{blockId}                 → { id, title, category, text, wordCount, createdAt }
config/settings                         → { adminPin, dailyGoalMinutes, dailyGoalSessions }
```

All storage functions in `storage.js` are `async` and return Promises. Components load data via `useEffect` + `useState` with loading states.

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
- `target-knockback`: rotateX(0)→rotateX(-90deg) + scale down, 350ms (carnival target fall)
- `target-spark`: rotate(angle) + translateX outward, 400ms (hit particles)
- `target-enter`: scale(0)+rotate(90deg)→scale(1), 300ms
- `bubble-float`: translateY(0)→translateY(-8px)→0, 2.5s infinite (gentle bobbing)
- `bubble-pop`: scale 1→1.4→0, fade, 300ms
- `bubble-enter`: scale(0)+rotate(-10deg)→scale(1), 350ms
- `bubble-shake`: translateX shake, 200ms (error feedback)
- `tile-drop`: translateY(0)→120px + rotate(15deg), fade, 350ms
- `tile-enter`: translateY(-60px)→0, 300ms
- `group-burst`: scale 1→1.8, fade, 400ms (group completion)
- `space-pulse`: scale 1→1.05, 800ms infinite

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

- Focus management: `onBlur` listener reclaims focus during typing phase; `onMouseDown` refocuses via `requestAnimationFrame`; focus grabbed on mount and phase change
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
    FunDisplay.jsx     — Fun typing modes for KB drills (TargetShoot, BubblePop, TileDrop)
  screens/
    UserSelect.jsx     — Netflix-style profile picker
    ContentSelect.jsx  — Category picker (3 icons) → content list, settings, resume/restart
    TypingScreen.jsx   — Main typing interface (countdown, typing, metrics, streak, fun modes)
    ResultsScreen.jsx  — Session results (confetti, record, heat map)
    AdminScreen.jsx    — Users/Content/Stats/Settings tabs
  lib/
    keyboard.js        — Key layout, finger mapping, colors
    firebase.js        — Firebase/Firestore initialization, SDK exports
    storage.js         — Firestore async CRUD (users, sessions, progress, content, bestWpm)
    sounds.js          — Web Audio API (keystroke, error, beep, celebration, fanfare)
public/
  sounds/
    keystroke.mp3      — Key click sound
.env                   — Firebase config (VITE_FIREBASE_* env vars)
firestore.rules        — Firestore security rules
.github/workflows/
  firebase-hosting.yml — CI/CD: build + deploy to Firebase on push to main
```

## Out of Scope (for now)
- Multiplayer / race mode
- Gamification (points, badges, unlocks)
- Typing games (falling words, etc.)
- Mobile/touch keyboard support
- Dark mode
- Targeted drill mode (auto-generate from weak keys)
- Daily practice tracker
