# Personified — Codex Prompt (Glass Overhaul)

Paste everything below the line into Codex.

---

Read every file in this repo before making any change: index.html, style.css, script.js, sw.js.

You are doing a complete visual overhaul of a 2-player browser game called Personified. The game logic, screen flow, and all JavaScript in script.js must stay exactly as-is — do not touch the JS except for one exception noted below. You are rewriting index.html and style.css in full.

---

## What the game is

One player secretly gets a random number. They describe it as if it were a person — its personality, vibe, aesthetic — out loud in their head or verbally. No math clues. The other player guesses the number. That is the entire game. The UI just needs to get out of the way and let that happen.

---

## What to REMOVE

Strip these from the UI entirely:

- The theme selector dropdown and all theme-switching logic (JS exception: remove the applyTheme function and themeSelect event listener from script.js, and remove all theme objects from the `themes` const — the design is fixed)
- The "How to Play" button and the entire `screen-htp` screen
- The player panel sidebar (the `<aside>` with both player score cards, the home icon, and "In Play" text). Replace it with a slim top bar described below
- Any `glass`, `glass-hero`, `bg` classes or other dead CSS
- The `rotate-overlay` element

Do not add any new features. No prompt cards, no personality seeds, no history log, no bonus points, no hot/cold meter, no confetti, no challenge flag, no presets, no emoji pickers.

---

## New Visual Design — Glass Theme

The entire design language is dark glassmorphism. Every value below is a CSS custom property on `:root`. Do not hardcode any color or blur value.

### Color tokens

```css
:root {
  --bg:            #08080f;          /* near-black, slightly blue */
  --glass-bg:      rgba(255, 255, 255, 0.055);
  --glass-border:  rgba(255, 255, 255, 0.10);
  --glass-blur:    20px;
  --glass-shadow:  0 8px 32px rgba(0, 0, 0, 0.45);

  --accent:        #5b8dee;          /* soft electric blue */
  --accent-glow:   rgba(91, 141, 238, 0.35);
  --accent-hover:  #7aaaf5;

  --success:       #34d399;
  --success-glow:  rgba(52, 211, 153, 0.30);
  --danger:        #f87171;
  --danger-glow:   rgba(248, 113, 113, 0.30);
  --warn:          #fbbf24;
  --warn-glow:     rgba(251, 191, 36, 0.25);

  --text:          #f1f5f9;
  --text-muted:    rgba(241, 245, 249, 0.45);
  --text-on-btn:   #ffffff;

  --radius-card:   18px;
  --radius-btn:    10px;
  --radius-input:  8px;
  --radius-tile:   10px;

  --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Background

The `body` background is `var(--bg)`. Behind everything, render two soft ambient glow orbs using pseudo-elements or fixed divs — one top-left (violet, `rgba(120, 80, 255, 0.12)`), one bottom-right (blue, `rgba(60, 120, 255, 0.10)`). Both are `600px` circles with `blur(120px)`, `pointer-events: none`, `position: fixed`, `z-index: 0`. The entire app content sits at `z-index: 1`.

### Glass card component

Every screen card uses:
```css
background: var(--glass-bg);
backdrop-filter: blur(var(--glass-blur));
-webkit-backdrop-filter: blur(var(--glass-blur));
border: 1px solid var(--glass-border);
border-radius: var(--radius-card);
box-shadow: var(--glass-shadow);
```

No white backgrounds anywhere. No `box-shadow` using light colors.

### Buttons

Three button types, all sharing this base:
```css
border-radius: var(--radius-btn);
font-weight: 600;
font-size: 0.95rem;
padding: 12px 24px;
border: 1px solid transparent;
cursor: pointer;
transition: all 180ms ease;
letter-spacing: 0.01em;
```

**Primary (Start Match, Lock In, Spin):**
```css
background: var(--accent);
color: var(--text-on-btn);
box-shadow: 0 0 18px var(--accent-glow);
```
On hover: `background: var(--accent-hover); box-shadow: 0 0 28px var(--accent-glow);`

**Ghost (secondary actions):**
```css
background: rgba(255,255,255,0.07);
border-color: var(--glass-border);
color: var(--text);
```
On hover: `background: rgba(255,255,255,0.13);`

**Correct:** accent is `var(--success)`, glow is `var(--success-glow)`
**Incorrect:** accent is `var(--danger)`, glow is `var(--danger-glow)`
**Give Up / warn:** accent is `var(--warn)`, glow is `var(--warn-glow)`, text `#000`

All buttons: no border-radius changes on hover. Scale to `0.97` on `active:`. Disabled: `opacity: 0.4; cursor: not-allowed`.

### Inputs

```css
background: rgba(255,255,255,0.07);
border: 1px solid var(--glass-border);
border-radius: var(--radius-input);
color: var(--text);
padding: 10px 14px;
font-size: 1rem;
```
On focus: `border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); outline: none;`
Labels: `color: var(--text-muted); font-size: 0.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em;`

Checkbox / toggle: style as a pill toggle using CSS only (no JS). The `avoidRepeats` checkbox becomes a custom toggle using the `<label>` + `<input>` pattern with a sliding white pill on dark glass.

---

## Screen Layout

The app is a single centered column, max-width `480px`, horizontally centered, vertically centered on desktop. On mobile it fills the viewport with `16px` horizontal padding. Remove the sidebar grid layout entirely.

```css
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
```

---

## Top Bar (replaces the old player panel aside)

A slim fixed `<header>` at the top of the screen, visible only during `screen-reveal`, `screen-guess`, and `screen-scoreboard`. Hidden during setup.

Contents (left to right):
- Home icon button (SVG house or ← arrow, calls `returnToLobby()` — keep the existing JS function)
- Centered: `Player 1 Name · P1 Score — P2 Score · Player 2 Name` in one line, muted text
- Right: `Round X of Y` label

Style: `background: rgba(8,8,15,0.7); backdrop-filter: blur(12px); border-bottom: 1px solid var(--glass-border); padding: 10px 20px;` Full viewport width. `position: fixed; top: 0; left: 0; right: 0; z-index: 100;`

When the top bar is visible, the main content area has `padding-top: 56px`.

The active player's name in the top bar is highlighted with `color: var(--accent)` and `font-weight: 600`.

---

## Screen Transitions

Screens no longer snap instantly. When switching screens, the outgoing screen plays:
```css
opacity: 0; transform: translateY(12px);
transition: opacity 200ms ease, transform 200ms ease;
```
The incoming screen starts `opacity: 0; transform: translateY(-12px)` then transitions to `opacity: 1; transform: translateY(0)` over `220ms` with a `30ms` delay (so outgoing finishes first).

Implement this in JS: when `go(name)` is called, add a `leaving` class to the current screen, wait `200ms`, then swap `active` class and trigger enter animation. Respect `prefers-reduced-motion` — if set, skip the transform and only fade.

---

## Setup Screen (`screen-config`)

Layout: single glass card, no sidebar.

At the top: the word **Personified** in a large display font (`2rem, font-weight: 800, letter-spacing: -0.02em`) centered, with the tagline `"Numbers have personalities."` beneath it in `var(--text-muted)`.

A thin horizontal rule (`border-top: 1px solid var(--glass-border)`) separates the title from the form.

Form layout: two-column grid for player names and the number range/timer fields. Collapse to one column under `520px`.

Sections use a small uppercase muted label (`Players`, `Range & Rules`) instead of full h3 elements.

Rounds input: replace with a stepper (– and + buttons flanking the value) instead of a plain number input.

Timer input: keep as a number input but add a muted hint below: `"seconds per turn"`.

Footer: `Start Match` button, full width, large (`padding: 14px`).

Remove the How to Play button entirely.

---

## Reveal Screen (`screen-reveal`)

Headline: `"[Describer Name]"` in accent color, then `"— spin for your number"` in muted text. Same line or two lines depending on name length.

The slot reel:

The reel track: `background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: 14px; height: 88px;`

The center indicator line: replace the single vertical line with a soft full-width highlight band — a `60px`-tall `rgba(91,141,238,0.10)` centered rectangle with a `1px` top and bottom border in `var(--accent)` at 30% opacity. This creates a "selection zone" look.

Each number tile:
```css
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.08);
border-radius: var(--radius-tile);
font-size: 1.8rem;
font-weight: 700;
color: var(--text-muted);
```

Selected tile:
```css
background: rgba(91, 141, 238, 0.18);
border-color: var(--accent);
color: var(--text);
box-shadow: 0 0 20px var(--accent-glow);
```
Add a `@keyframes pulse-glow` that oscillates the box-shadow between `0 0 16px var(--accent-glow)` and `0 0 32px var(--accent-glow)` over 1.4s infinite, applied to the selected tile after landing.

Button row: `Spin` (primary) and `Lock In & Start` (ghost), side by side, equal width.

Small muted note below buttons: `"Other player, look away."` in `font-size: 0.8rem`.

---

## Guess Screen (`screen-guess`)

This is the most important screen. Keep it ruthlessly minimal.

Layout top to bottom:

1. **Role label** — `"[Describer Name] is describing"` — small, muted, centered
2. **The secret number** — displayed to the describer only. `font-size: 5rem; font-weight: 800; color: var(--text);` Centered. Massive. Nothing else competing with it.
3. **Timer** — `font-size: 2.8rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text);` Centered. When `timeLeft <= 10`, transition color to `var(--danger)` with a `0.5s ease` color transition. No blinking, no scaling — just the color shift is enough.
4. **Incorrect guess count** — `"3 incorrect"` in small muted text centered below the timer. Single line.
5. **Three buttons** — full width, stacked vertically with `12px` gap: `Correct ✓` (success), `Incorrect Guess ✗` (danger), `They Give Up` (warn).

No other content on this screen. No distractions.

---

## Scoreboard Screen (`screen-scoreboard`)

A single glass card.

Header: `"Match Over"` or a trophy glyph + `"[Winner Name] wins"` in large text.

Two player result rows, each showing: name, score in large text (`2rem, bold`), and total incorrect guesses in muted small text below. The winner's row has a subtle accent-color left border (`3px solid var(--accent)`).

If it's a tie: show `"Too close to call — Sudden Death"` in warn color.

Two buttons: `Play Again` (primary) and `Back to Setup` (ghost).

No round history, no detailed breakdown. Just the outcome.

---

## Typography

Use only Inter from Google Fonts (already linked). No other font.

```css
body { font-family: var(--font); color: var(--text); }
```

Headings use `letter-spacing: -0.02em`. Body text uses default tracking. All muted/secondary text uses `var(--text-muted)`. No text is pure `#ffffff` — use `var(--text)` (`#f1f5f9`) for slightly softer rendering on the dark background.

---

## Accessibility — Do Not Regress

Keep all existing accessibility work intact:
- The `#live` sr-only aria-live region
- `aria-invalid` on invalid form fields
- `aria-live="polite"` on the timer and guess count
- The `.skip` focus link (update its background/colors to match the new theme)
- All focus states: `outline: 2px solid var(--accent); outline-offset: 3px;` on `:focus-visible`
- `prefers-reduced-motion` skip on transitions (already noted above)

---

## Service Worker

In `sw.js`, bump the `CACHE_NAME` version string (e.g. from `v1` to `v2`). No other changes to `sw.js`.

---

## Deliverables

Output three complete files in full — no truncation, no "rest unchanged" shortcuts:

1. `index.html` — complete rewrite with the new structure (no sidebar, new top bar, no HTP screen, no theme selector)
2. `style.css` — complete rewrite using the design system above
3. `script.js` — minimal changes only: remove `applyTheme()`, remove `themes` object, remove `themeSelect` event listener, remove `htpBackBtn` and `howToPlayBtn` listeners, add the screen transition animation logic to `go()`, add timer color-shift logic for last 10 seconds. All game logic untouched.

Also output the one-line change to `sw.js` (just the new cache name string).
