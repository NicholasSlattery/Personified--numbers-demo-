# Personified (Numbers Demo)

Personified is a browser game for two players.  
One player "becomes" a secretly chosen number. The other player has to guess that number by asking questions about its personality, vibe, reputation, etc. You aren't allowed to just ask math questions. You have to treat the number like a person.

This repo is the working numbers-only prototype. It runs fully in the browser using plain HTML, CSS, and vanilla JavaScript. No build step. No backend.

🎮 **[Play Online](https://personifiednumbers.netlify.app)** - Live deployment of the game

---

## Core Loop

1. Players enter their names and match rules in the setup screen.
   - Range of valid numbers (example: 1 to 10)
   - How many rounds to play
   - How long each guessing turn lasts (built in timer)
   - Option to avoid repeats so you don't get the same number twice in one match :contentReference[oaicite:9]{index=9} :contentReference[oaicite:10]{index=10}

2. The describing player "spins" to lock in a secret random number using a horizontal slot-machine style reel. The chosen number is visually highlighted. :contentReference[oaicite:11]{index=11} :contentReference[oaicite:12]{index=12}

3. The guesser asks questions and tries to figure it out before the timer hits 0.
   - The secret number is shown to the describing player on screen
   - A big match timer counts down live
   - There's a running count of incorrect guesses for tie-breakers later :contentReference[oaicite:13]{index=13} :contentReference[oaicite:14]{index=14}

4. When the guesser is right, you hit "Correct." If they strike out or give up, you record it.
   - Points and total wrong guesses are tracked per player
   - Roles automatically swap for the next half-round
   - After both players have had a turn, that is one full round in the match logic :contentReference[oaicite:15]{index=15} :contentReference[oaicite:16]{index=16}

5. At the end, a scoreboard screen shows the winner based on points, then on total incorrect guesses as a tie-breaker. If it is still tied, it calls for Sudden Death. :contentReference[oaicite:17]{index=17} :contentReference[oaicite:18]{index=18}

---

## Screens in the App

All screens are already built and styled. They just show and hide using classes in JS, so the whole thing feels like a mini app. :contentReference[oaicite:19]{index=19} :contentReference[oaicite:20]{index=20}

### Setup / Lobby
- Enter Player 1 and Player 2 names
- Pick range min and max for the random number generator
- Choose number of rounds
- Set the timer (seconds)
- Toggle "Avoid repeats this match"
- Accessibility notes:
  - Form inputs use labels and aria-invalid for validation feedback
  - There's a screen reader friendly skip link at the top ("Skip to setup") for keyboard users
  - Invalid fields are highlighted and focused automatically if setup is not valid :contentReference[oaicite:21]{index=21} :contentReference[oaicite:22]{index=22} :contentReference[oaicite:23]{index=23}

### How To Play
- In-game rules explanation
- Plain language instructions on roles, scoring, and round format
- Simple "Back to Setup" button to return :contentReference[oaicite:24]{index=24}

### Reveal (Spin)
- Slot-machine style horizontal reel of numbers
- Spin button animates and recenters the chosen number with a green glow
- The chosen number is locked in and secretly shown to the describing player
- Prevents repeat numbers if that setting is enabled, by tracking which numbers have already been seen this match :contentReference[oaicite:25]{index=25} :contentReference[oaicite:26]{index=26} :contentReference[oaicite:27]{index=27}

### Guess / Timer
- Shows:
  - "The number is X" (visible only to the answering player)
  - Countdown timer in mm:ss
  - Running guess count for this turn
- Buttons for:
  - Correct
  - Incorrect Guess
  - They give up
- The timer is enforced in JS with `setInterval` and automatically ends the round on timeout. :contentReference[oaicite:28]{index=28} :contentReference[oaicite:29]{index=29}

### Scoreboard / Results
- Displays both player names, scores, and total incorrect guesses
- Declares winner using:
  1. Score
  2. Fewer total incorrect guesses
  3. Otherwise Sudden Death prompt
- Includes a "Play Again" button that resets state and sends you back to lobby with clean inputs and restored defaults. :contentReference[oaicite:30]{index=30} :contentReference[oaicite:31]{index=31}

---

## Features

### Instant local multiplayer
No account, no backend, just hand the device to Player 1 and Player 2 and play.

### Mobile friendly layout
The UI is responsive and uses a glassy "card" style that still fits on a phone screen without horizontal scrolling. Touch targets meet at least ~44px tap area. The layout switches to single-column under 640px. :contentReference[oaicite:32]{index=32}

### Animated number reel
The "spin" experience builds a repeating sequence of numbers, then recenters the chosen number in the viewport with a smooth cubic-bezier transition. The chosen tile gets a green glow pulse. :contentReference[oaicite:33]{index=33} :contentReference[oaicite:34]{index=34} :contentReference[oaicite:35]{index=35}

### Match timer
Each turn gets a countdown clock. When it hits 0, the round auto-ends as a miss. This keeps pressure high and stops stalling. :contentReference[oaicite:36]{index=36} :contentReference[oaicite:37]{index=37}

### Scoreboard logic
- 1 point for a correct guess
- Tracks how many wrong guesses you needed
- Tie-breaker favors the player who guessed using fewer wrong guesses overall
- If still tied, calls Sudden Death :contentReference[oaicite:38]{index=38} :contentReference[oaicite:39]{index=39}

### Persisted timer preference
The app saves your last chosen timer length in `localStorage`, and uses that next match so you do not have to keep typing it. :contentReference[oaicite:40]{index=40}

### Accessibility work
- `aria-live` region announces dynamic updates to assistive tech (for example when validation fails or when UI state changes)  
- Setup form uses `aria-invalid` and automatic scroll to the first invalid field on bad input  
- "Skip to setup" link for keyboard/screen reader users  
- Visual focus outlines and high contrast tokens  
- Explicit timer text updates via `aria-live` so a screen reader can keep up with the countdown (the code uses a live region and `requestAnimationFrame` announcements) :contentReference[oaicite:41]{index=41} :contentReference[oaicite:42]{index=42} :contentReference[oaicite:43]{index=43}

---

## Tech Stack

- **HTML5** for structure and screen sections (`index.html`).
- **CSS** for the glass UI, responsive grid, focus states, accessible contrast, and the animated slot reel visuals (`style.css`). The palette uses dark backgrounds, translucent cards, and neon accent states. :contentReference[oaicite:44]{index=44} :contentReference[oaicite:45]{index=45}
- **Vanilla JavaScript** for:
  - State management (players, rounds, timer, guesses)
  - Navigation between screens without a router
  - Slot reel spin animation and selection
  - Scoreboard and winner calculation
  - Persistent timer preference in `localStorage`
  
  (`script.js`) :contentReference[oaicite:46]{index=46}

No frameworks. No build tooling. Just open the HTML file.

---

## How to Run Locally

You can run this locally with zero setup.

Option 1, easiest:
1. Download or clone this repo.
2. Open `index.html` in a modern browser.

Option 2, with a tiny static server:
```bash
# from the repo directory
python3 -m http.server 8080
# then open http://localhost:8080 in your browser
