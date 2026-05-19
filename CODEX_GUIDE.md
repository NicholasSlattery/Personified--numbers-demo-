# Personified — Codex Rebuild Guide

> **Purpose:** This document is the authoritative brief for a full visual and feature refresh of the Personified numbers demo. It documents the current app in detail, lists what must be preserved, and catalogs every brainstormed idea so you can pick and choose before giving the final Codex prompt.

---

## 1. What the App Is Right Now

**Personified** is a 2-player, browser-only party game. One player secretly gets a number and must describe it *as if it were a person* — its personality, vibe, career, aesthetic — while the other player guesses what the number is. Math questions are against the rules.

### Current Tech Stack
- Pure **HTML + CSS + Vanilla JS** — no framework, no build step, no backend
- Runs as a **PWA** (service worker, web manifest, offline-capable)
- **Single file per concern:** `index.html`, `style.css`, `script.js`, `sw.js`

### Screens (all present, show/hide via JS class toggles)
| Screen | What It Does |
|--------|-------------|
| `screen-config` | Setup lobby — player names, range, rounds, timer, repeats toggle, theme picker |
| `screen-htp` | How to Play rules card |
| `screen-reveal` | Horizontal slot-machine reel — describer spins for their secret number |
| `screen-guess` | Active round — shows number to describer, countdown timer, incorrect guess counter, Correct / Incorrect / Give Up buttons |
| `screen-scoreboard` | Final results — scores, incorrect guess totals, winner declaration |

### Scoring System
- 1 point for a correct guess
- Tie-breaker: fewer total incorrect guesses wins
- If still tied: "Sudden Death" (currently just a text prompt)

### Key JS State (`GameState` object)
- `rangeMin`, `rangeMax`, `rounds`, `timerSeconds`, `avoidRepeats`
- `p1` / `p2` objects with `name`, `score`, `totalGuesses`
- `isP1Guesser`, `currentNumber`, `seenNumbers` (Set), `guessesThisRound`
- `roundIndex`, `halfTurn` (0 = P1 describes, 1 = P2 describes)
- `spinning`, `timerId`, `timeLeft`

### Current Visual Style
"Professional SaaS" — clean white cards, Inter font, blue accent (`#2563eb`), subtle shadows, 4px grid spacing. Has 4 color themes: Default, Forest, Crimson, Slate. Auto dark mode via `prefers-color-scheme`.

### What Already Works Well
- Slot reel animation (cubic-bezier centering, `selected` green glow)
- Web Audio API tick sounds during spin
- `localStorage` for timer preference and theme
- `aria-live` regions, `aria-invalid`, skip link, focus management
- Mobile responsive layout (sidebar collapses under 768px)
- Service worker with auto-update

---

## 2. Core Ideas to NEVER Change

These are the soul of the game. Any update must keep all of these:

1. **The core conceit** — numbers are people. You describe a number's personality, not its math. This is the whole hook.
2. **2-player local play** — no accounts, no backend, no internet required during a match.
3. **The slot machine spin** — picking the secret number with a reel is the best moment in the flow. Keep it. Make it better.
4. **Plain HTML/CSS/JS** — no React, no Vite, no bundler. Open `index.html` and it works.
5. **PWA capability** — stays installable and offline-capable.
6. **The screen flow** — Config → Reveal → Guess → Scoreboard. Clean and simple.
7. **Role swap logic** — both players describe and guess each round; a full round is when both have had a turn.
8. **Accessibility** — `aria-live`, focus management, keyboard navigable. Don't regress this.

---

## 3. The Full Brainstorm — Everything to Pick From

Pick whichever combination of these excites you most before running the Codex prompt.

---

### 3A. Visual & Aesthetic Overhaul

#### Option A1 — Arcade / Neon
Dark background (`#0d0d14`), electric neon accents (hot pink `#ff2d78`, cyan `#00f5ff`), scanline texture overlay, CRT-style glow on the big number, phosphor-green timer display. The slot reel becomes a proper arcade drum with lit borders. Feels like a game from a boardwalk.

#### Option A2 — Cosmic / Space
Deep navy-black background with a procedurally generated star field (canvas or CSS `radial-gradient` dots). Numbers float in like planets. The slot reel spins against a star-streaked warp effect. Accent colors: electric violet and gold. Feels mystical, like the numbers have cosmic significance.

#### Option A3 — Neon Glassmorphism (upgrade of current)
Keep the card structure but make it genuinely glassy — `backdrop-filter: blur(20px)`, semi-transparent backgrounds (`rgba(255,255,255,0.07)`), subtle inner glow borders. Dark background with a blurred gradient blob behind everything (purple → blue). Neon green and blue accents. This is the easiest to implement and looks the most modern.

#### Option A4 — Retro Paper / Board Game
Warm cream `#f5f0e8` background, stamped-ink typography (a serif or slab font), number tiles that look like scrabble/scrabble-adjacent wooden tiles. The slot reel looks like a physical drum with rounded edges and a slight 3D perspective. Earthy palette: olive, terracotta, navy.

#### Option A5 — Party / Confetti Mode
Bright white backgrounds with explosions of color. Every correct answer sends confetti raining down (pure CSS `@keyframes` falling elements, no canvas needed). Score cards wobble and bounce. The timer turns red and pulsates in the last 10 seconds. Energy of a party game box.

---

### 3B. Slot Reel Upgrades

- **Vertical drum instead of horizontal** — numbers scroll up/down like a classic one-armed bandit. More dramatic stop.
- **Spin momentum** — overshoot past the target, then snap back (spring physics via cubic-bezier).
- **Multi-reel fake-out** — briefly show 3 spinning reels that lock one at a time before revealing the chosen number.
- **Glow pulse on land** — the selected tile radiates a glow ring outward (CSS `@keyframes` on `box-shadow`) when it stops.
- **Number "face" reveal** — after spin lands, animate a quick card flip to show an illustrated personality silhouette (different for each number 1–100, could be CSS-generated geometric shapes).
- **Sound upgrade** — use Web Audio API to synthesize a proper slot spin whir that decelerates, plus a satisfying "thunk" on landing.
- **Confetti burst on lock-in** — when describer presses "Lock In," a short burst of colored particles rains over the reel.

---

### 3C. Gameplay Feature Ideas

#### Prompt Cards (biggest UX win for new players)
Show a rotating carousel of example questions on the guess screen that the guesser can use as inspiration. Examples:
- "If this number were a person, what decade would they be from?"
- "What's their energy — introvert or extrovert?"
- "Would they show up late or early to a party?"
- "What genre of music are they?"
- "Are they more coffee or tea?"
These are read-only suggestions, not mandatory. Just helps players get into the spirit of the game fast.

#### Hot/Cold Proximity Meter
The describer gets a private slider or dial they can nudge toward "🔥 Hot" or "🧊 Cold" to give the guesser a sense of direction. Purely vibes-based, not a math hint. Shows as an animated gradient bar on the guesser's view.

#### Question Category Cards
At the start of each turn, reveal a random "Clue Category" card the describer must use for their first clue — e.g., "CAREER", "CHILDHOOD", "FASHION", "GUILTY PLEASURE", "NEMESIS". Forces creativity. Can be toggled off in setup.

#### Number Personality Seeds
Each number 1–100 has a preset personality archetype shown only to the describer. For example:
- 1 — "The Pioneer. Always first. Doesn't follow trends."
- 7 — "The Mystic. Lucky, aloof, a little superstitious."
- 13 — "The Rebel. Misunderstood. Has a bad reputation they don't deserve."
- 42 — "The Answer. Knows everything but is terrible at small talk."
- 69 — "Obviously popular at parties. Tired of the attention."
- 100 — "The Perfectionist. Intimidating. Lives up to every expectation."
These are flavor-only — fun for the describer, not a mechanic.

#### Challenge Flag
The guesser can press a "That's Math! 🚩" button if they think the describer snuck in a mathematical hint. If upheld (honor system), the describer loses the clue and must redo it. Adds a meta layer of policing the rules.

#### Bonus Points for Efficiency
Instead of just 1 point for a correct guess, award bonus points based on how few incorrect guesses it took:
- 0 wrong guesses: 3 points
- 1–2 wrong guesses: 2 points
- 3+ wrong guesses: 1 point

#### Sudden Death (actually implemented)
When the match is tied after all rounds, trigger a real Sudden Death screen:
- A single bonus round, both players play once
- First to guess correctly (regardless of wrong guesses) wins
- Special visual treatment — red pulsing border, different sound cues

#### Match History Log
A scrollable log on the scoreboard showing every round: which number was played, who described, who guessed, how many wrong guesses it took, and whether it was correct. Satisfying recap.

#### Streak Counter
Track how many correct guesses in a row a player has. Show a 🔥 streak flame with a count. Breaking a streak could have a dramatic sound.

#### Speed Round Mode
A setup preset: 30-second timer, 3 rounds, no repeats. All UI hints lean into urgency — the timer is giant, the buttons are huge.

#### Mystery Range
A toggle in setup where the range is hidden from the guesser throughout the match. They don't know if they're guessing 1–10 or 1–1000. Makes bluffing even wilder.

---

### 3D. Audio Upgrades

The current Web Audio API implementation is minimal (one tick sound). Possible expansions:

- **Spin whir** — synthesized decelerating oscillator during slot spin
- **Correct fanfare** — quick ascending arpeggio (3–4 notes, major key)
- **Incorrect buzz** — low descending tone + noise
- **Timer warning** — last 10 seconds: higher-pitched, faster ticks
- **Round start** — short "game show" sting
- **Match over** — triumphant chord or sad trombone, depending on match result
- **Mute toggle** — a simple 🔊/🔇 button in the HUD

All synthesized with Web Audio API — no audio file downloads, no extra bytes.

---

### 3E. Animation & Micro-interactions

- **Screen transitions** — instead of instant show/hide, slide new screens in from the right (CSS `translate + transition`) and fade old ones out
- **Score counter animation** — when score increases, the number ticks up one at a time
- **Player card "pulse" on active turn** — the active player card bounces subtly
- **Timer urgency** — last 10 seconds: timer turns red, text scales up slightly with each tick, border glows
- **Confetti on correct guess** — ~30 colored divs raining down, removed after 2s
- **"Locked in" stamp animation** — when describer locks in their number, a "LOCKED IN" stamp rotates into view over the reel
- **Win screen** — winner's name does a big bounce animation, loser's score grays out

---

### 3F. Setup / Lobby Improvements

- **Quick presets** — one-click buttons for common configs: "Quick Game (1–10, 3 rounds, 2 min)", "Party Mode (1–20, 5 rounds, 3 min)", "Expert (1–100, 7 rounds, 90 sec)"
- **Player avatars** — pick an emoji as your avatar at setup; it shows next to your name in the HUD
- **Match name/title** — optional flavor field: name your match ("Championship Finals", "Kitchen Table Classic")
- **Swapped start** — toggle which player describes first
- **Timer presets** — quick-pick buttons instead of a raw number input: "1 min / 2 min / 3 min / 5 min"

---

### 3G. Scoreboard Improvements

- **Per-round breakdown table** — show each round's number, who described, guesses taken, result
- **MVP stat** — call out "Fewest guesses needed", "Best streak", "Quickest correct"
- **Shareable result card** — generate a summary `<canvas>` image users can screenshot ("Nick beat Sam at Personified — 4-2! 🎯")
- **Confetti rain** — play confetti animation behind the winner text
- **Rematch shortcut** — "Rematch" button keeps same names and settings, skips straight to first spin

---

### 3H. Themes (Full Visual Overhaul List)

| Theme Name | Vibe | Bg Color | Accent | Font Feel |
|-----------|------|----------|--------|-----------|
| `arcade` | Neon dark | `#0d0d14` | `#ff2d78` / `#00f5ff` | Mono / Display |
| `cosmic` | Space | `#080818` | `#9d4edd` / `#ffd700` | Rounded sans |
| `glass` | Dark glassmorphism | `#13131f` | `#4cc9f0` / `#7209b7` | Inter (current) |
| `paper` | Board game | `#f5f0e8` | `#4a3728` / `#c84b31` | Serif / Slab |
| `party` | Bright chaos | `#ffffff` | `#ff006e` / `#ffbe0b` | Chunky round |
| `midnight` | Elegant dark | `#0f0f23` | `#e2b96f` / `#ffffff` | Inter thin |
| `forest` | Nature (exists) | `#f0fdf4` | `#16a34a` | Inter |
| `crimson` | Bold red (exists) | `#fef2f2` | `#dc2626` | Inter |

---

## 4. Recommended Combinations

These are curated "upgrade packages" — pick one and use it as the basis for your Codex prompt.

### Package 1 — "Neon Arcade" (Biggest visual impact)
Arcade theme + Neon glassmorphism cards + Vertical slot reel with glow + Synthesized sounds (spin, correct, incorrect, timer warning) + Confetti on correct + Screen slide transitions + Timer urgency animation + Prompt cards for new players + Bonus points system

### Package 2 — "Party Game Polish" (Best for casual play)
Party theme + Confetti everywhere + Score counter animations + Player emoji avatars + Quick presets in setup + Match history log + Shareable result card + Sudden Death actually implemented + Hot/Cold meter

### Package 3 — "Thoughtful Upgrade" (Keeps current feel, adds depth)
Glassmorphism upgrade of current style + Screen transitions + Mute toggle + Prompt cards + Number personality seeds + Question category cards + Per-round scoreboard breakdown + Streak counter + Timer urgency + Bonus points

### Package 4 — "Cosmic Immersion" (Most unique)
Cosmic / Space theme + Animated star-field background + Number personality seeds (full flavor text) + Slot reel with warp-speed spin effect + Triumphant/sad audio stings + Mystery range mode + Challenge flag + Match history + Sudden Death

---

## 5. Ready-to-Use Codex Prompt

Copy the section below and paste it as your Codex / Claude Code prompt. Before pasting, **fill in the blanks** marked with `[CHOOSE]` based on your picks from Section 4 above.

---

```
You are updating a 2-player browser game called "Personified." The codebase is pure HTML, CSS,
and vanilla JavaScript — no frameworks, no build step. The game is a PWA. All files are in the 
repo root: index.html, style.css, script.js, sw.js.

Read every file in full before making any change.

=== WHAT MUST STAY THE SAME ===
- The core game mechanic: one player gets a secret number and describes it as a person (personality,
  vibe, aesthetic). No math questions allowed. The other player guesses.
- Pure HTML/CSS/JS — no React, no Vite, no npm, no bundler. Open index.html and it works.
- PWA: service worker and web manifest must remain functional.
- The 5-screen flow: Config → Reveal (slot reel) → Guess (timer) → Scoreboard. No new screens unless
  specified below.
- The slot machine reel for picking the secret number. This is the signature moment of the game.
- Role swap logic: both players describe and guess each round. A full round = both have had a turn.
- Scoring: 1 point for correct guess. Tie-breaker: fewer total incorrect guesses. If still tied:
  Sudden Death.
- Accessibility: aria-live regions, aria-invalid, skip link, visible focus rings. Do not regress any
  of this.
- localStorage for persisting timer preference and theme.

=== VISUAL OVERHAUL ===
Implement the [CHOOSE: arcade / cosmic / glass / paper / party / midnight] visual theme.
[Describe the look in 2-3 sentences based on your chosen theme from Section 3A above.]

Apply this consistently to: body background, cards, buttons, inputs, slot reel, timer display,
scoreboard, and the player HUD sidebar. All color values must use CSS custom properties on :root so
they are easy to change. Keep dark mode support via prefers-color-scheme.

=== NEW FEATURES TO ADD ===
[Pick from the list below and paste only the ones you want:]

1. PROMPT CARDS: On the screen-guess view, add a read-only scrollable carousel of example questions
   the guesser can use for inspiration. Questions rotate every 8 seconds automatically or can be
   manually advanced. Examples: "What decade are they from?", "Introvert or extrovert?", "What genre
   of music are they?" Minimum 20 unique prompt questions hardcoded in the JS.

2. NUMBER PERSONALITY SEEDS: On the screen-reveal view, after the slot reel locks in, show a brief
   "personality card" to the describer only — a one-liner archetype for that number. Cover numbers
   1 through at least 20. Example: 7 = "The Mystic. Lucky, aloof, a little superstitious." Display
   it in a styled callout below the reel before the describer presses Lock In.

3. BONUS POINT SYSTEM: Change scoring so correct guesses award 1, 2, or 3 points based on how many
   incorrect guesses were needed (0 wrong = 3 pts, 1-2 wrong = 2 pts, 3+ wrong = 1 pt). Update the
   scoreboard and HUD to reflect the new scoring. Keep the tie-breaker logic (fewer incorrect guesses
   still wins ties at equal points).

4. TIMER URGENCY: In the last 10 seconds of each turn, the timer display turns red, the font scales up
   slightly on each tick, and tick sounds double in tempo. When time runs out, a short descending audio
   "buzz" plays. Implement the sound using Web Audio API (no audio files).

5. CONFETTI ON CORRECT GUESS: When the Correct button is pressed, spawn ~40 colored div elements with
   randomized starting X positions at the top of the screen. Animate them falling and rotating with
   CSS keyframes. Remove all confetti elements after 2.5 seconds. No canvas. No libraries.

6. SCREEN TRANSITIONS: Instead of instant show/hide, outgoing screens slide left and fade out
   (transform: translateX(-40px); opacity: 0) and incoming screens slide in from the right
   (transform: translateX(40px) → translateX(0)). Transition duration 250ms ease. Respect
   prefers-reduced-motion by skipping the animation for users who have it set.

7. SLOT REEL UPGRADE — SPRING OVERSHOOT: The reel scrolls 2-3 tiles past the target, then springs
   back to center using a two-step CSS transition (fast overshoot with ease-out, then slow snap with
   cubic-bezier spring feel). Also add a glow-pulse @keyframes animation on the selected tile when it
   locks in.

8. SOUND SYSTEM UPGRADE: Using only Web Audio API (no audio files), implement:
   - A decelerating whir during the slot spin (oscillator that drops in frequency)
   - An ascending 3-note arpeggio on correct guess
   - A descending buzz on incorrect / give up / timeout
   - A triumphant 4-note chord on match end (winner)
   - A mute toggle button (🔊/🔇) in the player HUD
   Sounds must not play on page load. All triggered by user interaction.

9. PLAYER EMOJI AVATARS: In the setup form, add an emoji picker field next to each player name.
   Clicking it opens a small dropdown/grid of 16 preset emojis (🐶🦊🐯🐸🦋🌙⚡🎯🎲🍕🎸🏆👑🌈🔥💎).
   The chosen emoji shows next to the player name everywhere in the HUD, scoreboard, and result text.
   Default to 🎯 for P1 and 🎲 for P2 if nothing is picked.

10. QUICK SETUP PRESETS: Add three preset buttons at the top of the config screen:
    - "Quick Game" → 1-10, 3 rounds, 120s, no repeats
    - "Party Mode" → 1-20, 5 rounds, 180s, repeats off
    - "Expert" → 1-100, 7 rounds, 90s, repeats on
    Clicking a preset fills all the inputs. The user can still edit after.

11. SUDDEN DEATH (implemented): When the match ends in a true tie (equal points AND equal incorrect
    guesses), instead of just showing text, navigate to a special Sudden Death sub-screen. Both players
    play one bonus half-turn each (same reveal → guess flow). The first player to get a correct guess
    in their Sudden Death turn wins. If both get it correct, the one who used fewer wrong guesses in
    the Sudden Death turn wins. Show a visually distinct "SUDDEN DEATH" screen header with red pulsing
    border animation.

12. MATCH HISTORY LOG: On the scoreboard screen, below the final score summary, add a collapsible
    "Round History" section. It shows a table/list of each half-turn: round number, which player
    described, the secret number, how many incorrect guesses, and the result (✓ correct / ✗ miss /
    ⏱ timeout). Track this data in GameState throughout the match.

13. HOT/COLD METER: Add a private control for the describer on the guess screen — a horizontal slider
    labeled "Vibe Meter" from 🧊 Cold to 🔥 Hot. When the describer moves it, the guesser's view
    shows an animated gradient bar (blue → red) reflecting the current setting in real-time. This is
    not a math hint — it's a vibes hint. The slider only appears on the "describer's side" of the
    guess screen UI. Since it's same-device play, use an honor system: describe screen shows both the
    number AND the slider, guesser is supposed to look away from the number display. Add a note to
    that effect.

=== CODE QUALITY REQUIREMENTS ===
- Keep all JS in script.js, all CSS in style.css, all HTML in index.html.
- Do not add any external libraries or CDN imports. All new functionality must be self-contained.
- Preserve all existing GameState fields. Add new fields cleanly (don't rename or restructure existing
  ones in a breaking way).
- All new DOM elements must have appropriate aria labels or aria-hidden where decorative.
- Use CSS custom properties for all new colors, not hardcoded hex values.
- The service worker (sw.js) cache version string must be bumped when any cached file changes.
- Test mentally for: setup → match → multiple rounds → scoreboard → play again flow. The play again
  reset must fully clear all new state you add.

=== DELIVERABLES ===
Rewrite index.html, style.css, and script.js in full. Output each file completely — no truncation,
no "rest of file unchanged" shortcuts. The sw.js only needs updating if the cache version needs
bumping.
```

---

## 6. Tips for Using the Prompt

- **Be selective.** Don't paste all 13 features at once. Pick 4–6 and do them well.
- **Lead with the visual theme.** The aesthetic overhaul makes everything feel new. Do that first so subsequent feature additions build on the right foundation.
- **Verify the slot reel after any JS change.** The `centerOnTile` offset math is sensitive to tile width. If tiles change size, the centering calc needs to account for it.
- **The play-again reset is a common regression point.** After any new `GameState` fields are added, confirm they're cleared in `returnToLobby()`.
- **Web Audio on iOS requires a user gesture.** The current code already has `audioCtx.resume()` on first use — don't remove that pattern when adding new sounds.
- **Don't remove the `sr-only` live region.** Screen readers depend on it for dynamic announcements.
