// ==========================================================================
// Game State
// ==========================================================================
const GameState = {
  rangeMin: 1,
  rangeMax: 10,
  rounds: 5,
  avoidRepeats: false,
  defaultTimerSeconds: 180,
  timerSeconds: 180,
  p1: { name: "Player 1", score: 0, totalGuesses: 0 },
  p2: { name: "Player 2", score: 0, totalGuesses: 0 },
  isP1Guesser: false,
  currentNumber: null,
  seenNumbers: new Set(),
  guessesThisRound: 0,
  roundIndex: 0,
  halfTurn: 0, // 0 = P1 describes, 1 = P2 describes
  spinning: false,
  timerId: null,
  timeLeft: 180,
};

const EM_DASH = '\u2014';

// ==========================================================================
// Sound & Theme
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (type === 'tick') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200 + Math.random() * 50, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  }
}

const themes = {
  default: { '--bg-default': '#f9fafb', '--bg-surface': '#ffffff', '--accent-primary': '#2563eb', '--text-default': '#111827' },
  forest:  { '--bg-default': '#f0fdf4', '--bg-surface': '#ffffff', '--accent-primary': '#16a34a', '--text-default': '#14532d' },
  crimson: { '--bg-default': '#fef2f2', '--bg-surface': '#ffffff', '--accent-primary': '#dc2626', '--text-default': '#991b1b' },
  slate:   { '--bg-default': '#f8fafc', '--bg-surface': '#ffffff', '--accent-primary': '#475569', '--text-default': '#1e293b' },
};

function applyTheme(key) {
  const theme = themes[key] || themes.default;
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(theme)) {
    root.style.setProperty(prop, value);
  }
  localStorage.setItem('theme', key);
}


// ==========================================================================
// DOM Elements
// ==========================================================================
const screens = {
  config: document.getElementById("screen-config"),
  htp: document.getElementById("screen-htp"),
  reveal: document.getElementById("screen-reveal"),
  guess: document.getElementById("screen-guess"),
  board: document.getElementById("screen-scoreboard"),
};

const p1NameEl = document.getElementById("p1Name");
const p2NameEl = document.getElementById("p2Name");
const p1ScoreEl = document.getElementById("p1Score");
const p2ScoreEl = document.getElementById("p2Score");
const p1GuessesEl = document.getElementById("p1Guesses");
const p2GuessesEl = document.getElementById("p2Guesses");
const p1RoleEl = document.getElementById("p1Role");
const p2RoleEl = document.getElementById("p2Role");
const inPlayText = document.getElementById("inPlayText");
const guessCountEl = document.getElementById("guessCount");
const timerDisplay = document.getElementById("timerDisplay");
const revealTitle = document.getElementById("revealTitle");
const guessTitle = document.getElementById("guessTitle");
const guessNumberEl = document.getElementById("guessNumber");

const slotViewport = document.getElementById("slotViewport");
const slotReel = document.getElementById("slotReel");
const spinBtn = document.getElementById("spinBtn");
const passBtn = document.getElementById("passBtn");
const giveUpBtn = document.getElementById("giveUpBtn");

// Config inputs
const p1Input = document.getElementById("p1Input");
const p2Input = document.getElementById("p2Input");
const minInput = document.getElementById("minInput");
const maxInput = document.getElementById("maxInput");
const roundsInput = document.getElementById("roundsInput");
const timerInput = document.getElementById("timerInput");
const avoidRepeatsInput = document.getElementById("avoidRepeats");
const themeSelect = document.getElementById("themeSelect");
const startBtn = document.getElementById('startBtn');
const rangeError = document.getElementById('rangeError');


// ==========================================================================
// Utility Functions
// ==========================================================================
function setLive(el, text) {
  if (el && el.textContent !== String(text)) el.textContent = String(text);
}

function announce(msg) {
  const live = document.getElementById('live');
  if (live) {
    live.textContent = '';
    requestAnimationFrame(() => live.textContent = msg);
  }
}

function formatMMSS(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==========================================================================
// UI & Screen Logic
// ==========================================================================
function updateHUD() {
  setLive(p1NameEl, GameState.p1.name);
  setLive(p2NameEl, GameState.p2.name);
  setLive(p1ScoreEl, GameState.p1.score);
  setLive(p2ScoreEl, GameState.p2.score);
  setLive(p1GuessesEl, `${GameState.p1.totalGuesses} incorrect`);
  setLive(p2GuessesEl, `${GameState.p2.totalGuesses} incorrect`);
  setLive(inPlayText, `In Play: ${GameState.rangeMin}-${GameState.rangeMax}`);

  const p1Card = document.getElementById("p1Card");
  const p2Card = document.getElementById("p2Card");
  p1Card.classList.toggle("active", GameState.isP1Guesser);
  p2Card.classList.toggle("active", !GameState.isP1Guesser);
  
  setLive(p1RoleEl, GameState.isP1Guesser ? "Guesser" : "Describer");
  setLive(p2RoleEl, !GameState.isP1Guesser ? "Guesser" : "Describer");
}

function go(name) {
  stopTimer();
  Object.values(screens).forEach(s => s.classList.remove("active"));

  if (name === "guess") {
    GameState.guessesThisRound = 0;
    updateGuessUI();

    const describerName = GameState.isP1Guesser ? GameState.p2.name : GameState.p1.name;
    setLive(guessTitle, `${describerName} is Describing`);
    setLive(guessNumberEl, GameState.currentNumber ?? EM_DASH);

    if (GameState.currentNumber === null) {
      spinSlot(true); // Auto-spin if no number
      name = "reveal";
    } else {
      GameState.timeLeft = Math.max(1, GameState.timerSeconds);
      updateTimerDisplay();
      startTimer();
    }
  }

  if (name === "reveal") {
    const describerName = GameState.isP1Guesser ? GameState.p2.name : GameState.p1.name;
    setLive(revealTitle, `${describerName}: Spin to Select Number`);
  }

  if (screens[name]) screens[name].classList.add("active");
  updateHUD();
}

function validateSetup() {
  let isValid = true;
  const setInvalid = (el, isInvalid, message = '') => {
    const field = el.closest('.field');
    field?.classList.toggle('invalid', isInvalid);
    if (el === maxInput) rangeError.textContent = isInvalid ? message : '';
    isValid = isValid && !isInvalid;
  };
  
  const min = parseInt(minInput.value, 10);
  const max = parseInt(maxInput.value, 10);
  
  if (isNaN(min) || min < 1) setInvalid(minInput, true); else setInvalid(minInput, false);
  if (isNaN(max) || max <= min) setInvalid(maxInput, true, 'Max must be > min.'); else setInvalid(maxInput, false);
  
  startBtn.disabled = !isValid;
  return isValid;
}

// ==========================================================================
// Timer Logic
// ==========================================================================
function updateTimerDisplay() {
  setLive(timerDisplay, formatMMSS(GameState.timeLeft));
}

function startTimer() {
  stopTimer();
  GameState.timeLeft = Math.max(1, GameState.timerSeconds);
  updateTimerDisplay();
  GameState.timerId = setInterval(() => {
    GameState.timeLeft -= 1;
    updateTimerDisplay();
    if (GameState.timeLeft <= 0) {
      stopTimer();
      finishRound(false); // Timeout counts as incorrect
    }
  }, 1000);
}

function stopTimer() {
  if (GameState.timerId) {
    clearInterval(GameState.timerId);
    GameState.timerId = null;
  }
}

// ==========================================================================
// Slot Machine Logic
// ==========================================================================
function makeTile(n) {
  const div = document.createElement("div");
  div.className = "tile";
  div.textContent = n;
  return div;
}

function buildOrderedReel(target) {
  slotReel.innerHTML = "";
  const seq = Array.from({ length: GameState.rangeMax - GameState.rangeMin + 1 }, (_, i) => GameState.rangeMin + i);
  const combined = [...seq, ...seq, ...seq];
  combined.forEach(n => slotReel.appendChild(makeTile(n)));
  
  const targetIndex = seq.length + seq.indexOf(target);
  return slotReel.children[targetIndex];
}

async function centerOnTile(tile, durationMs = 1100) {
  const viewportCenter = slotViewport.getBoundingClientRect().width / 2;
  const tileCenter = tile.offsetLeft + tile.getBoundingClientRect().width / 2;
  const targetTx = viewportCenter - tileCenter;
  
  slotReel.style.transition = durationMs ? `transform ${durationMs}ms cubic-bezier(.2,.9,.2,1)` : 'none';
  slotReel.style.transform = `translateX(${targetTx}px)`;
  
  if (durationMs) {
    await new Promise(resolve => setTimeout(resolve, durationMs));
  }
}

function updateGuessUI() {
  setLive(guessCountEl, GameState.guessesThisRound);
}

async function spinSlot(auto = false) {
  if (GameState.spinning) return;
  GameState.spinning = true;
  spinBtn.disabled = true;
  passBtn.disabled = true;

  const target = nextNumber();
  GameState.currentNumber = target;
  GameState.seenNumbers.add(target);

  slotReel.querySelectorAll(".tile.selected").forEach(el => el.classList.remove("selected"));
  const targetTile = buildOrderedReel(target);
  
  await new Promise(r => requestAnimationFrame(r));
  
  slotReel.style.transition = "none";
  slotReel.style.transform = "translateX(0)";
  await new Promise(r => requestAnimationFrame(r));

  const spinDuration = auto ? 900 : 1100;
  const tickInterval = setInterval(() => playSound('tick'), 120);
  
  await centerOnTile(targetTile, spinDuration);
  
  clearInterval(tickInterval);
  playSound('tick'); // Final sound

  targetTile.classList.add("selected");
  GameState.spinning = false;
  spinBtn.disabled = false;
  passBtn.disabled = false;
}

// ==========================================================================
// Game Flow
// ==========================================================================
function startMatch() {
  if (!validateSetup()) {
    announce('Please fix the highlighted fields.');
    document.querySelector('.field.invalid input')?.focus();
    return;
  }
  
  GameState.p1.name = (p1Input.value || "Player 1").trim();
  GameState.p2.name = (p2Input.value || "Player 2").trim();
  GameState.p1.score = GameState.p2.score = 0;
  GameState.p1.totalGuesses = GameState.p2.totalGuesses = 0;
  
  GameState.rangeMin = parseInt(minInput.value, 10);
  GameState.rangeMax = parseInt(maxInput.value, 10);
  GameState.rounds = Math.max(1, parseInt(roundsInput.value, 10));
  GameState.timerSeconds = Math.max(10, parseInt(timerInput.value, 10));
  GameState.avoidRepeats = avoidRepeatsInput.checked;
  
  GameState.seenNumbers.clear();
  GameState.isP1Guesser = false; // P1 describes first
  GameState.roundIndex = 0;
  GameState.halfTurn = 0;
  GameState.currentNumber = null;
  
  go("reveal");
}

function nextNumber() {
  if (!GameState.avoidRepeats) return randomInt(GameState.rangeMin, GameState.rangeMax);
  
  const available = Array.from({ length: GameState.rangeMax - GameState.rangeMin + 1 }, (_, i) => GameState.rangeMin + i)
    .filter(n => !GameState.seenNumbers.has(n));
    
  if (available.length === 0) {
    GameState.seenNumbers.clear();
    return randomInt(GameState.rangeMin, GameState.rangeMax);
  }
  return available[Math.floor(Math.random() * available.length)];
}

function finishRound(wasCorrect) {
  stopTimer();
  const guesser = GameState.isP1Guesser ? GameState.p1 : GameState.p2;
  
  if (wasCorrect) guesser.score += 1;
  guesser.totalGuesses += GameState.guessesThisRound;

  GameState.isP1Guesser = !GameState.isP1Guesser;
  GameState.halfTurn = (GameState.halfTurn + 1) % 2;
  if (GameState.halfTurn === 0) GameState.roundIndex++;

  if (GameState.roundIndex >= GameState.rounds) {
    endMatch();
  } else {
    GameState.guessesThisRound = 0;
    GameState.currentNumber = null;
    go("reveal");
  }
}

function endMatch() {
  updateHUD();
  const { p1, p2 } = GameState;
  
  setLive(document.getElementById("finalP1Name"), p1.name);
  setLive(document.getElementById("finalP2Name"), p2.name);
  setLive(document.getElementById("finalP1Score"), p1.score);
  setLive(document.getElementById("finalP2Score"), p2.score);
  setLive(document.getElementById("finalP1Guess"), p1.totalGuesses);
  setLive(document.getElementById("finalP2Guess"), p2.totalGuesses);

  let winner = EM_DASH;
  if (p1.score !== p2.score) {
    winner = p1.score > p2.score ? p1.name : p2.name;
  } else if (p1.totalGuesses !== p2.totalGuesses) {
    winner = p1.totalGuesses < p2.totalGuesses ? p1.name : p2.name;
  } else {
    winner = "It's a tie!";
  }
  setLive(document.getElementById("winnerText"), `Winner: ${winner}`);
  
  go("board");
}

function returnToLobby() {
  stopTimer();
  p1Input.value = "";
  p2Input.value = "";
  minInput.value = "1";
  maxInput.value = "10";
  roundsInput.value = "5";
  timerInput.value = String(GameState.defaultTimerSeconds);
  avoidRepeatsInput.checked = false;
  
  Object.assign(GameState, {
    p1: { name: "Player 1", score: 0, totalGuesses: 0 },
    p2: { name: "Player 2", score: 0, totalGuesses: 0 },
    isP1Guesser: false,
    currentNumber: null,
    roundIndex: 0,
    halfTurn: 0,
  });
  GameState.seenNumbers.clear();
  
  go("config");
}


// ==========================================================================
// Event Listeners & Boot
// ==========================================================================
function init() {
  // Buttons
  startBtn.addEventListener('click', startMatch);
  spinBtn.addEventListener('click', () => spinSlot(false));
  passBtn.addEventListener('click', () => go("guess"));
  document.getElementById("correctBtn").addEventListener('click', () => finishRound(true));
  document.getElementById("incorrectBtn").addEventListener('click', () => {
    GameState.guessesThisRound++;
    updateGuessUI();
  });
  giveUpBtn.addEventListener('click', () => finishRound(false));
  document.getElementById("playAgainBtn")?.addEventListener('click', returnToLobby);
  document.getElementById("homeIcon")?.addEventListener('click', returnToLobby);
  document.getElementById("howToPlayBtn")?.addEventListener('click', () => go("htp"));
  document.getElementById("htpBackBtn")?.addEventListener('click', () => go("config"));
  
  // Config inputs
  [minInput, maxInput, roundsInput, timerInput].forEach(el => {
    el.addEventListener('input', validateSetup);
  });
  
  // Theme
  const savedTheme = localStorage.getItem('theme') || 'default';
  themeSelect.value = savedTheme;
  themeSelect.onchange = (e) => applyTheme(e.target.value);
  applyTheme(savedTheme);
  
  // Initial state
  updateHUD();
  validateSetup();
  go("config");
}

init();

// ==========================================================================
// Service Worker
// ==========================================================================
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            reg.waiting?.postMessage('SKIP_WAITING');
          }
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        location.reload();
      });
    } catch (e) {
      console.warn('SW registration failed:', e);
    }
  });
}