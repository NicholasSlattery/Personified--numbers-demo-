// -------------------------
// State
// -------------------------
let rangeMin = 1;
let rangeMax = 10;
let rounds = 5;
let avoidRepeats = false;

// Persisted "default" timer (starts at 180, becomes "whatever user last chose")
let defaultTimerSeconds = parseInt(localStorage.getItem('defaultTimer') || '180', 10);

// Initialize timer state from the persisted default
let timerSeconds = defaultTimerSeconds;

let p1 = { name: "Player 1", score: 0, totalGuesses: 0 };
let p2 = { name: "Player 2", score: 0, totalGuesses: 0 };

let isP1Guesser = false;      // possession
let currentNumber = null;
let seenNumbers = new Set();
let guessesThisRound = 0;    // includes the correct guess when it happens
let roundIndex = 0;
let halfTurn = 0; // 0 = P1 describes, 1 = P2 describes; two halves = one full round
let spinning = false;
let timerId = null;
let timeLeft = defaultTimerSeconds;
const EM_DASH = '\u2014'; // safe em dash for JS strings

// -------------------------
// Sound & Theme Logic
// -------------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSpinTick() {
  // Simple tick synth
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  // Random variance to make it sound mechanical
  osc.frequency.setValueAtTime(200 + Math.random() * 50, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.06);
}

const themes = {
  default: { bg1: '#0f1220', bg2: '#141933', acc1: '#4e54c8', acc2: '#8f94fb' },
  forest:  { bg1: '#0f2012', bg2: '#152e1b', acc1: '#2d8a4e', acc2: '#68d391' },
  crimson: { bg1: '#200f0f', bg2: '#2e1515', acc1: '#c53030', acc2: '#fc8181' },
  slate:   { bg1: '#1a202c', bg2: '#2d3748', acc1: '#4a5568', acc2: '#a0aec0' },
};

function applyTheme(key) {
  const t = themes[key] || themes.default;
  const root = document.documentElement;
  root.style.setProperty('--bg1', t.bg1);
  root.style.setProperty('--bg2', t.bg2);
  root.style.setProperty('--accent-1', t.acc1);
  root.style.setProperty('--accent-2', t.acc2);
  localStorage.setItem('theme', key);
}

// -------------------------
// DOM
// -------------------------
const screens = {
  config: document.getElementById("screen-config"),
  htp:    document.getElementById("screen-htp"),
  reveal: document.getElementById("screen-reveal"),
  guess:  document.getElementById("screen-guess"),
  board:  document.getElementById("screen-scoreboard"),
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
const guessTitle  = document.getElementById("guessTitle");
const guessNumberEl = document.getElementById("guessNumber");

const slotViewport = document.getElementById("slotViewport");
const slotReel = document.getElementById("slotReel");
const spinBtn = document.getElementById("spinBtn");
const passBtn = document.getElementById("passBtn");
const giveUpBtn = document.getElementById("giveUpBtn");

// config inputs
const p1Input = document.getElementById("p1Input");
const p2Input = document.getElementById("p2Input");
const minInput = document.getElementById("minInput");
const maxInput = document.getElementById("maxInput");
const roundsInput = document.getElementById("roundsInput");
const timerInput = document.getElementById("timerInput");
const avoidRepeatsInput = document.getElementById("avoidRepeats");
const themeSelect = document.getElementById("themeSelect");

// buttons
const homeIcon = document.getElementById("homeIcon");
if (homeIcon) homeIcon.onclick = goHomeImmediate;
const howToPlayBtn = document.getElementById("howToPlayBtn");
const htpBackBtn   = document.getElementById("htpBackBtn");
if (howToPlayBtn) howToPlayBtn.onclick = () => go("htp");
if (htpBackBtn)   htpBackBtn.onclick   = () => go("config");

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'default';
if (themeSelect) {
  themeSelect.value = savedTheme;
  themeSelect.onchange = (e) => applyTheme(e.target.value);
}
applyTheme(savedTheme);

// lightweight accessibility announcer
function announce(msg){
  const live = document.getElementById('live');
  if (live){ live.textContent = ''; requestAnimationFrame(()=> live.textContent = msg); }
}

function validateSetup(){
  const minEl = document.getElementById('minInput');
  const maxEl = document.getElementById('maxInput');
  const roundsEl = document.getElementById('roundsInput');
  const timerEl = document.getElementById('timerInput');
  const startBtn = document.getElementById('startBtn');
  const rangeError = document.getElementById('rangeError');

  let isValid = true;

  const setInvalid = (el, isInvalid, message) => {
    const field = el.closest('.field');
    field?.classList.toggle('invalid', isInvalid);
    el.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
    if (message && rangeError && el === maxEl) {
      rangeError.textContent = isInvalid ? message : '';
    }
    if (isInvalid) isValid = false;
  };

  const min = parseInt(minEl.value, 10);
  const max = parseInt(maxEl.value, 10);
  const rounds = parseInt(roundsEl.value, 10);
  const timer = parseInt(timerEl.value, 10);

  // Validate min/max range
  if (!Number.isFinite(min) || min < 1) {
    setInvalid(minEl, true, 'Range Min must be 1 or greater');
  } else {
    setInvalid(minEl, false);
  }

  if (!Number.isFinite(max) || max < min) {
    setInvalid(maxEl, true, 'Range Max must be greater than Range Min');
  } else {
    setInvalid(maxEl, false);
  }

  // Validate rounds
  if (!Number.isFinite(rounds) || rounds < 1) {
    setInvalid(roundsEl, true);
  } else {
    setInvalid(roundsEl, false);
  }

  // Validate timer
  if (!Number.isFinite(timer) || timer < 10) {
    setInvalid(timerEl, true);
  } else {
    setInvalid(timerEl, false);
  }

  // Enable/disable start button based on overall validity
  if (startBtn) {
    startBtn.disabled = !isValid;
  }

  return isValid;
}

document.getElementById("startBtn").addEventListener('click', (e) => {
  if (!validateSetup()){
    e.preventDefault();
    announce('Please fix the highlighted fields.');
    const firstInvalid = document.querySelector('[aria-invalid="true"]');
    firstInvalid?.scrollIntoView({behavior:'smooth', block:'center'});
    firstInvalid?.focus();
    return;
  }
  // Ensure audio context is ready on user gesture
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // call existing startMatch
  startMatch();
});

spinBtn.onclick = () => spinSlot();
passBtn.onclick = () => go("guess");
document.getElementById("correctBtn").onclick = () => { stopTimer(); finishRound(true); };
document.getElementById("incorrectBtn").onclick = () => { guessesThisRound++; updateGuessUI(); };
giveUpBtn.onclick = () => { stopTimer(); finishRound(false); };

const playAgainBtn = document.getElementById("playAgainBtn");
if (playAgainBtn) playAgainBtn.onclick = returnToLobby;

const finalP1Name = document.getElementById("finalP1Name");
const finalP2Name = document.getElementById("finalP2Name");
const finalP1Score = document.getElementById("finalP1Score");
const finalP2Score = document.getElementById("finalP2Score");
const finalP1Guess = document.getElementById("finalP1Guess");
const finalP2Guess = document.getElementById("finalP2Guess");
const winnerText = document.getElementById("winnerText");

// -------------------------
// Analytics
// -------------------------
function track(event, props = {}) {
  if (window.analytics?.track) {
    window.analytics.track(event, props);
  } else {
    console.debug('[analytics]', event, props);
  }
}

// -------------------------
// Helpers
// -------------------------
// === Dynamic slot sizing so tiles never clip or poke out ===
// Computes CSS vars so exactly 3 full tiles are visible (left, center, right)
function layoutSlot() {
  if (!slotViewport) return;

  // Measured viewport width for the slot
  const vw = Math.floor(slotViewport.getBoundingClientRect().width);

  // These must mirror CSS variables
  const GAP = 12;   // --slot-gap
  const PAD = 24;   // --slot-pad
  const H_PADDING = PAD * 2;

  // Available content width inside the reel between paddings
  const contentW = Math.max(0, vw - H_PADDING);

  // We want 3 tiles and 2 gaps: [tile][gap][tile][gap][tile]
  const tileW = Math.max(56, Math.floor((contentW - 2 * GAP) / 3));

  // Height and font scale with width, clamped for legibility
  const tileH = Math.max(44, Math.min(92, Math.round(tileW * 0.7)));
  const tileFont = Math.max(28, Math.min(44, Math.round(tileW * 0.48)));

  const root = document.documentElement;
  root.style.setProperty('--slot-w', `${vw}px`);
  root.style.setProperty('--tile-w', `${tileW}px`);
  root.style.setProperty('--tile-h', `${tileH}px`);
  root.style.setProperty('--tile-font', `${tileFont}px`);

  // After a resize/orientation change, re-center the selected tile if present
  const selected = slotReel?.querySelector('.tile.selected');
  if (selected) {
    // cancel any in-flight transition; then recentre without animation
    slotReel.style.transition = 'none';
    // use rAF twice to ensure styles have applied before centering
    requestAnimationFrame(() => {
      centerOnTile(selected, 0);
    });
  }
}

// Recompute tile sizes on load, resize, rotation, and when the slot's box changes
window.addEventListener('load', layoutSlot);
window.addEventListener('resize', layoutSlot);
window.addEventListener('orientationchange', layoutSlot);

if (window.ResizeObserver && slotViewport) {
  const ro = new ResizeObserver(layoutSlot);
  ro.observe(slotViewport);
}

function setDefaultTimer(seconds){
  defaultTimerSeconds = Math.max(10, parseInt(seconds, 10));
  localStorage.setItem('defaultTimer', String(defaultTimerSeconds));
}

function setLive(el, text) {
  if (el && el.textContent !== String(text)) el.textContent = String(text);
}

function go(name){
  stopTimer();
  Object.values(screens).forEach(s => { if (s) s.classList.remove("active"); });

  if (name === "guess"){
    // entering guess screen: reset per-round counters
    guessesThisRound = 0;
    setLive(guessCountEl, "0");
    updateGuessUI();

    const describerName = isP1Guesser ? p2.name : p1.name;
  if (guessTitle) guessTitle.textContent = describerName;
  if (guessNumberEl) guessNumberEl.textContent = currentNumber ?? EM_DASH;

    if (currentNumber === null){
      // ensure a number exists; if not, auto-spin and stay on reveal
      spinSlot(true);
      name = "reveal";
    } else {
      // start the round timer as soon as we land on Guesser
      timeLeft = Math.max(1, timerSeconds);
      updateTimerDisplay();
      startTimer();
    }
  }

  if (name === "reveal"){
    // auto-spin at the start of every round to avoid "Roll first"
    if (currentNumber === null) spinSlot(true);
    const describerName = isP1Guesser ? p2.name : p1.name;
    if (revealTitle) revealTitle.textContent = `${describerName}: Spin to Select Random Number`;
  }

  if (screens[name]) screens[name].classList.add("active");
  updateHUD();
}

function updateHUD(){
  p1NameEl.textContent = p1.name;
  p2NameEl.textContent = p2.name;
  p1ScoreEl.textContent = String(p1.score);
  p2ScoreEl.textContent = String(p2.score);
  p1GuessesEl.textContent = `${p1.totalGuesses} incorrect`;
  p2GuessesEl.textContent = `${p2.totalGuesses} incorrect`;
  setLive(inPlayText, `In Play: ${rangeMin}-${rangeMax}`);

  const p1Card = document.getElementById("p1Card");
  const p2Card = document.getElementById("p2Card");
  p1Card.classList.toggle("active", isP1Guesser);
  p2Card.classList.toggle("active", !isP1Guesser);

  // roles above names
  p1RoleEl.textContent = "";
  p2RoleEl.textContent = "";
}

function randomInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextNumber(){
  if (!avoidRepeats) return randomInt(rangeMin, rangeMax);
  const tries = (rangeMax - rangeMin + 1) * 2;
  for (let i = 0; i < tries; i++){
    const n = randomInt(rangeMin, rangeMax);
    if (!seenNumbers.has(n)) return n;
  }
  // exhausted -> clear and roll
  seenNumbers.clear();
  return randomInt(rangeMin, rangeMax);
}

// New scoring: 1.00 - 0.05 for every 2 incorrect guesses; floor at 0.25
function formatMMSS(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function updateTimerDisplay() {
  setLive(timerDisplay, formatMMSS(timeLeft));
}

function startTimer() {
  stopTimer();
  timeLeft = Math.max(1, timerSeconds);
  updateTimerDisplay();
  timerId = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      stopTimer();
      // auto-reveal on timeout, then player taps "End Round (Incorrect)"
      finishRound(false);
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function makeTile(n){
  const div = document.createElement("div");
  div.className = "tile";
  div.textContent = n;
  return div;
}

// Build an ordered, wrap-around reel and return the TARGET tile element
function buildOrderedReel(target){
  slotReel.innerHTML = "";

  // base ordered sequence [min..max]
  const seq = [];
  for (let n = rangeMin; n <= rangeMax; n++) seq.push(n);

  // triple it so there are numbers before & after the target (wrap illusion)
  const combined = seq.concat(seq, seq);
  combined.forEach(n => slotReel.appendChild(makeTile(n)));

  // pick the target in the MIDDLE copy so neighbors exist on both sides
  const baseIndex   = seq.indexOf(target);
  const targetIndex = seq.length + baseIndex; // middle sequence
  return slotReel.children[targetIndex];
}

function centerOnTile(tile, durationMs = 1100){
  const viewportRect = slotViewport.getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();

  const viewportCenter = viewportRect.left + viewportRect.width / 2;
  const tileCenter = tileRect.left + tileRect.width / 2;

  const currentTx = new DOMMatrixReadOnly(
    getComputedStyle(slotReel).transform
  ).m41 || 0;

  const delta = viewportCenter - tileCenter;
  const targetTx = currentTx + delta;

  // Allow instant re-centering after layout changes
  const ms = Math.max(0, durationMs);
  slotReel.style.transition = ms ? `transform ${ms}ms cubic-bezier(.2,.9,.2,1)` : 'none';
  slotReel.style.transform = `translateX(${targetTx}px)`;

  return new Promise(resolve => {
    if (!ms) return resolve(); // no transition, resolve immediately
    const onEnd = () => {
      slotReel.removeEventListener("transitionend", onEnd);
      resolve();
    };
    slotReel.addEventListener("transitionend", onEnd);
  });
}

function updateGuessUI(){
  setLive(guessCountEl, guessesThisRound);
}

// -------------------------
// Flow
// -------------------------
function startMatch(){
  const p1n = (p1Input.value || "Player 1").trim();
  const p2n = (p2Input.value || "Player 2").trim();
  
  // Track match start
  track('match_start', {
    p1_name: p1n,
    p2_name: p2n,
    range_min: parseInt(minInput.value || "1", 10),
    range_max: parseInt(maxInput.value || "10", 10),
    rounds: parseInt(roundsInput.value || "5", 10),
    timer_seconds: parseInt(timerInput?.value || String(defaultTimerSeconds), 10),
    avoid_repeats: !!avoidRepeatsInput.checked
  });

  p1.name = p1n; p2.name = p2n;
  p1.score = p2.score = 0;
  p1.totalGuesses = p2.totalGuesses = 0;

  rangeMin = parseInt(minInput.value || "1", 10);
  rangeMax = parseInt(maxInput.value || "10", 10);
  rounds   = Math.max(1, parseInt(roundsInput.value || "5", 10));
  timerSeconds = Math.max(10, parseInt(timerInput?.value || String(defaultTimerSeconds), 10));
  setDefaultTimer(timerSeconds);
  avoidRepeats = !!avoidRepeatsInput.checked;

  if (isNaN(rangeMin) || isNaN(rangeMax) || rangeMin >= rangeMax){
    alert("Please provide a valid numeric range where Min < Max.");
    return;
  }

  // init round
  seenNumbers.clear();
  isP1Guesser = false; // P1 describes (spins) first; P2 guesses first
  roundIndex = 0;      // counts FULL rounds (both players have had a turn)
  halfTurn = 0;
  guessesThisRound = 0;
  currentNumber = null;

  // reset reel visuals
  slotReel.style.transition = "none";
  slotReel.style.transform = "translateX(0px)";

  go("reveal"); // auto-spins
}

async function spinSlot(auto = false){
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  passBtn.disabled = true;

  layoutSlot(); // ensure up-to-date tile sizes for current viewport

  // choose target and remember
  const target = nextNumber();
  currentNumber = target;
  seenNumbers.add(target);

  // clear any previous selection glow
  slotReel.querySelectorAll(".tile.selected").forEach(el => el.classList.remove("selected"));

  // build the ordered wrap-around reel and get the target tile
  const targetTile = buildOrderedReel(target);

  // allow DOM to paint before we animate
  await new Promise(r => requestAnimationFrame(r));

  // start slightly offset so we scroll left across numbers
  slotReel.style.transition = "none";
  slotReel.style.transform = "translateX(24px)";
  await new Promise(r => requestAnimationFrame(r));
  
  // Start ticking sound loop
  const spinDuration = auto ? 900 : 1100;
  const tickInterval = setInterval(() => {
    // Play tick randomly during spin
    if (Math.random() > 0.3) playSpinTick();
  }, 120);

  // animate the reel so the target tile centers in the viewport
  await centerOnTile(targetTile, spinDuration);
  
  // Stop sound
  clearInterval(tickInterval);
  playSpinTick(); // Final lock sound

  // done: glow the selected number
  targetTile.classList.add("selected");

  spinning = false;
  spinBtn.disabled = false;
  passBtn.disabled = false;
}

function finishRound(wasCorrect){
  stopTimer();
  const guesser = isP1Guesser ? p1 : p2;
  
  track('round_complete', {
    round: roundIndex + 1,
    half_turn: halfTurn,
    was_correct: wasCorrect,
    guesses: guessesThisRound,
    time_left: timeLeft,
    number: currentNumber,
    guesser: guesser.name
  });

  if (wasCorrect) {
    guesser.score += 1;
  }
  guesser.totalGuesses += guessesThisRound; // only counts incorrect guesses

  // toggle who guesses next (swap roles)
  isP1Guesser = !isP1Guesser;
  halfTurn = (halfTurn + 1) % 2;  // two halves per full round
  if (halfTurn === 0) {
    roundIndex++;
  }

  if (roundIndex >= rounds) {
    endMatch();
    return;
  }

  // prepare next turn
  guessesThisRound = 0;
  currentNumber = null;
  slotReel.style.transition = "none";
  slotReel.style.transform = "translateX(0px)";
  go("reveal");
}

function endMatch(){
  updateHUD();
  
  track('match_complete', {
    p1_name: p1.name,
    p2_name: p2.name,
    p1_score: p1.score,
    p2_score: p2.score,
    p1_guesses: p1.totalGuesses,
    p2_guesses: p2.totalGuesses,
    rounds_played: roundIndex,
    winner: p1.score > p2.score ? p1.name : 
           p2.score > p1.score ? p2.name : 
           p1.totalGuesses < p2.totalGuesses ? p1.name :
           p2.totalGuesses < p1.totalGuesses ? p2.name : 'tie'
  });
  
  finalP1Name.textContent = p1.name;
  finalP2Name.textContent = p2.name;
  finalP1Score.textContent = String(p1.score);
  finalP2Score.textContent = String(p2.score);
  finalP1Guess.textContent = p1.totalGuesses;
  finalP2Guess.textContent = p2.totalGuesses;

  let winner = EM_DASH;
  if (p1.score !== p2.score){
    winner = p1.score > p2.score ? p1.name : p2.name;
  } else if (p1.totalGuesses !== p2.totalGuesses){
    winner = p1.totalGuesses < p2.totalGuesses ? p1.name : p2.name;
  } else {
    winner = "Sudden Death (play one more round)";
  }
  winnerText.textContent = `Winner: ${winner}`;
  go("board");
}

function returnToLobby(){
  stopTimer();

  // Input controls (fresh setup)
  p1Input.value = "";
  p2Input.value = "";
  minInput.value = "1";
  maxInput.value = "10";
  roundsInput.value = "5";
  timerInput.value = String(defaultTimerSeconds);
  avoidRepeatsInput.checked = false;

  // Game state (fresh)
  rangeMin = 1; rangeMax = 10; rounds = 5; avoidRepeats = false;
  timerSeconds = defaultTimerSeconds;
  timeLeft = defaultTimerSeconds;
  updateTimerDisplay();

  // Names/scores (fresh)
  p1 = { name: "Player 1", score: 0, totalGuesses: 0 };
  p2 = { name: "Player 2", score: 0, totalGuesses: 0 };

  seenNumbers.clear?.();
  isP1Guesser = false;    // nobody highlighted in lobby
  roundIndex = 0;
  halfTurn = 0;
  currentNumber = null;

  // Reel visuals
  slotReel.style.transition = "none";
  slotReel.style.transform = "translateX(0px)";

  // Go to the Config screen (lobby)
  go("config");
}

function goHomeImmediate() { returnToLobby(); }

function resetNamesScores(){
  p1Input.value = ""; p2Input.value = "";
  p1 = { name: "Player 1", score: 0, totalGuesses: 0 };
  p2 = { name: "Player 2", score: 0, totalGuesses: 0 };
  isP1Guesser = false;
  updateHUD();
}

function resetToConfig(){
  stopTimer();
  p1.score = p2.score = 0;
  p1.totalGuesses = p2.totalGuesses = 0;
  roundIndex = 0;
  guessesThisRound = 0;
  currentNumber = null;
  seenNumbers.clear();
  isP1Guesser = false;
  timeLeft = timerSeconds;
  updateTimerDisplay();
  updateHUD();
  go("config");
}

function resetHard(){
  stopTimer();
  p1Input.value = ""; p2Input.value = "";
  minInput.value = "1"; maxInput.value = "10"; roundsInput.value = "5";
  timerInput.value = "180";
  avoidRepeatsInput.checked = false;
  p1 = { name: "Player 1", score: 0, totalGuesses: 0 };
  p2 = { name: "Player 2", score: 0, totalGuesses: 0 };
  isP1Guesser = false;
  seenNumbers.clear();
  currentNumber = null;
  guessesThisRound = 0;
  roundIndex = 0;
  timeLeft = 180;
  updateTimerDisplay();

  // reset reel transform
  slotReel.style.transition = "none";
  slotReel.style.transform = "translateX(0px)";

  updateHUD();
}

// -------------------------
// Orientation hooks
// -------------------------
const mqPortrait = window.matchMedia('(orientation: portrait)');
function onOrientationChange(e){
  const mode = e.matches ? 'portrait' : 'landscape';
  if (typeof track === 'function') track('orientation_change', { mode });
  // Reflow wheel sizes on orientation switch
  layoutSlot();
  // Example: tweak reveal/guess helper copy if desired
  // const help = document.querySelector('.microhelp');
  // if (help) help.textContent = mode === 'portrait'
  //   ? 'Tip: Bigger buttons in portrait; great for one-handed play.'
  //   : 'Tip: Landscape fits more controls side-by-side.';
}
if (mqPortrait.addEventListener) {
  mqPortrait.addEventListener('change', onOrientationChange);
} else if (mqPortrait.addListener) {
  // Safari < 14 fallback
  mqPortrait.addListener(onOrientationChange);
}
// Fire once on load
onOrientationChange(mqPortrait);

// -------------------------
// Orientation Detection
// -------------------------
const mq = window.matchMedia('(orientation: portrait)');
function logOrientation(e){
  const mode = e.matches ? 'portrait' : 'landscape';
  console.debug('[ui] orientation ->', mode);
}
if (mq.addEventListener) mq.addEventListener('change', logOrientation);
else if (mq.addListener) mq.addListener(logOrientation);
logOrientation(mq);

// -------------------------
// Boot
// -------------------------
updateHUD();

// Run once on boot
layoutSlot();

// Recompute on resize (covers URL bar show/hide + split-view changes)
window.addEventListener('resize', layoutSlot);

// Keep In Play text updated when config inputs change
[minInput, maxInput].forEach(inp => {
  inp.addEventListener("input", () => {
    const a = parseInt(minInput.value || "1", 10);
    const b = parseInt(maxInput.value || "10", 10);
    if (!isNaN(a) && !isNaN(b) && a < b){
      setLive(inPlayText, `In Play: ${a}-${b}`);
    }
  });
});

// -------------------------
// Portrait Orientation Lock & Overlay
// -------------------------
(function(){
  const overlay = document.getElementById('rotate-overlay');
  const tryBtn  = document.getElementById('try-lock');

  function isPortrait(){
    // Fallback-friendly check
    return (window.matchMedia && window.matchMedia("(orientation: portrait)").matches)
           || (window.innerHeight > window.innerWidth);
  }

  function updateOrientationUI(){
    const portrait = isPortrait();
    document.body.classList.toggle('portrait', portrait);

    if (overlay) {
      overlay.hidden = !portrait;
    }
  }

  // Try locking to landscape when the user taps the button
  async function tryLockLandscape(){
    try{
      // Some browsers require fullscreen before lock; attempt politely
      if (document.documentElement.requestFullscreen && !document.fullscreenElement){
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock){
        await screen.orientation.lock('landscape');
      }
    }catch(e){
      // Silently ignore; overlay will remain until user rotates device
      // console.debug('Orientation lock not available:', e);
    }finally{
      updateOrientationUI();
    }
  }

  window.addEventListener('orientationchange', updateOrientationUI);
  window.addEventListener('resize', updateOrientationUI);
  window.addEventListener('load', updateOrientationUI);

  if (tryBtn) tryBtn.addEventListener('click', tryLockLandscape);
})();

// -------------------------
// Service Worker Registration & Update Handling
// -------------------------
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js'); // RELATIVE path
      await reg.update(); // check immediately

      // If a new SW is found, activate it ASAP
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            reg.waiting?.postMessage?.('SKIP_WAITING');
          }
        });
      });

      // When the new SW takes control, reload to pick up fresh HTML/CSS/JS
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        location.reload();
      });
    } catch (e) {
      console.warn('SW registration/update failed:', e);
    }
  });
}