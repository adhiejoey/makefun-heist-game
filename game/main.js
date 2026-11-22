// main.js — Vaultbreak: game state, input, the loop, win/lose and the
// staged ?shot= scenes for screenshots. ES module, no dependencies.

import { VIEW_W, VIEW_H, WALLS, COVER, LOOT, CAMERAS, GUARDS, PLAYER_START, EXIT, solids } from './level.js';
import { Guard } from './guard.js';
import { Camera } from './camera.js';
import { Player, COIN_NOISE_RADIUS } from './player.js';
import { SoundFX } from './audio.js';
import { render, CANVAS_W, CANVAS_H } from './render.js';

const ALARM_RISE_GUARD = 26;
const ALARM_RISE_CAMERA = 32;
const ALARM_FALL = 11;

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'); // cover | patrol | alert | exit | null

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const blocks = solids();
const sfx = new SoundFX();

function freshLoot() {
  return LOOT.map((l) => ({ ...l, taken: false }));
}

const state = {
  phase: 'title', // title | play | win | lose
  time: 0,
  alarm: 0,
  maxAlarm: 0,
  player: new Player(PLAYER_START),
  guards: GUARDS.map((g) => new Guard(g)),
  cameras: CAMERAS.map((c) => new Camera(c)),
  lootItems: freshLoot(),
  coinsThrown: [], // {x, y, age}
  loseReason: null,
  rating: '',
  anySeen: false,
  wasSeen: false,
};

function reset() {
  state.phase = 'play';
  state.time = 0;
  state.alarm = 0;
  state.maxAlarm = 0;
  state.player = new Player(PLAYER_START);
  state.guards = GUARDS.map((g) => new Guard(g));
  state.cameras = CAMERAS.map((c) => new Camera(c));
  state.lootItems = freshLoot();
  state.coinsThrown = [];
  state.loseReason = null;
  state.rating = '';
  state.anySeen = false;
  state.wasSeen = false;
}

function timeText(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function objectiveText() {
  if (!state.player.hasDiamond()) return 'Steal the Meridian Diamond';
  return 'Diamond secured — reach the EXIT';
}

// --- Staged scenes for screenshots (deterministic, frozen) ------------
function applyShot(name) {
  reset();
  state.phase = 'play';
  // Fixed camera sweep phase so every screenshot is reproducible.
  for (const cam of state.cameras) cam.phase = 0;
  state.time = 2.4;
  const p = state.player;
  const [g1, g2, g3] = state.guards;
  if (name === 'cover') {
    p.x = 280; p.y = 150; p.facing = Math.PI / 2;
    g1.x = 560; g1.y = 420; g1.facing = Math.PI; g1.state = 'patrol';
    g2.x = 700; g2.y = 300; g2.facing = Math.PI / 2; g2.state = 'patrol';
    g3.x = 1100; g3.y = 290; g3.facing = -Math.PI / 2; g3.state = 'patrol';
    state.alarm = 12;
  } else if (name === 'patrol') {
    p.x = 640; p.y = 640; p.facing = -Math.PI / 2;
    g1.x = 640; g1.y = 470; g1.facing = 0; g1.state = 'patrol';
    g2.x = 700; g2.y = 300; g2.facing = Math.PI; g2.state = 'patrol';
    g3.x = 1000; g3.y = 290; g3.facing = 0; g3.state = 'patrol';
    state.lootItems.find((l) => l.id === 'gold2').taken = true;
    p.loot.push('gold2');
    p.score = 150;
    state.alarm = 4;
  } else if (name === 'alert') {
    p.x = 700; p.y = 500; p.facing = -Math.PI / 2;
    g1.x = 640; g1.y = 470; g1.facing = Math.PI / 2; g1.state = 'chase'; g1.alertness = 1;
    g1.lastSeen = { x: p.x, y: p.y };
    g2.x = 760; g2.y = 300; g2.facing = Math.PI / 2; g2.state = 'suspicious'; g2.alertness = 0.6;
    g3.x = 1100; g3.y = 290; g3.facing = -Math.PI / 2; g3.state = 'patrol';
    state.cameras[1].hot = true;
    state.alarm = 78;
    state.maxAlarm = 78;
    state.anySeen = true;
  } else if (name === 'exit') {
    p.x = 80; p.y = 732; p.facing = Math.PI;
    state.lootItems.find((l) => l.id === 'diamond').taken = true;
    p.loot.push('diamond');
    p.score = 500;
    g1.x = 500; g1.y = 700; g1.facing = Math.PI; g1.state = 'patrol';
    g2.x = 640; g2.y = 300; g2.facing = 0; g2.state = 'patrol';
    g3.x = 1100; g3.y = 290; g3.facing = Math.PI; g3.state = 'patrol';
    state.alarm = 22;
  }
  // Refresh the cameras once at the frozen time so their cones are set.
  for (const cam of state.cameras) cam.update(0, state.time, p, blocks);
}

// --- Input ------------------------------------------------------------
const keys = new Set();
let mouse = { x: 0, y: 0 };

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / r.width;
  const scaleY = CANVAS_H / r.height;
  return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
}

addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  sfx.ensure();
  keys.add(e.key.toLowerCase());
  if (e.key === 'Enter' && state.phase === 'title') reset();
  if (e.key.toLowerCase() === 'r' && (state.phase === 'win' || state.phase === 'lose')) reset();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener('mousemove', (e) => { mouse = canvasPoint(e); });
canvas.addEventListener('mousedown', (e) => {
  sfx.ensure();
  if (state.phase === 'title') { reset(); return; }
  if (state.phase !== 'play') return;
  const pt = canvasPoint(e);
  // HUD is 60 px tall; convert to level coordinates.
  const lx = pt.x;
  const ly = pt.y - 60;
  if (ly < 0) return;
  const landing = state.player.throwCoin(lx, ly);
  if (landing) {
    state.coinsThrown.push({ x: landing.x, y: landing.y, age: 0 });
    sfx.coinThrow();
    setTimeout(() => {
      sfx.coinLand();
      for (const g of state.guards) {
        if (Math.hypot(g.x - landing.x, g.y - landing.y) < COIN_NOISE_RADIUS + 60) {
          g.hearNoise(landing.x, landing.y, state.time);
        }
      }
    }, 320);
  }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// --- Update -----------------------------------------------------------
let lastStepSound = 0;

function update(dt) {
  state.time += dt;
  const p = state.player;

  let dx = 0;
  let dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  const sprint = keys.has('shift');
  const noise = p.update(dt, dx, dy, sprint, blocks);

  if (p.moving && state.time - lastStepSound > (sprint ? 0.28 : 0.42)) {
    lastStepSound = state.time;
    sfx.footstep(sprint);
  }
  // Sprinting is loud: nearby guards come to look.
  if (noise > 0) {
    for (const g of state.guards) {
      if (g.state !== 'chase' && Math.hypot(g.x - p.x, g.y - p.y) < noise) {
        g.hearNoise(p.x, p.y, state.time);
      }
    }
  }

  let anySeen = false;
  for (const g of state.guards) {
    const sees = g.update(dt, p, blocks, state.time);
    if (sees) {
      anySeen = true;
      state.alarm = Math.min(100, state.alarm + ALARM_RISE_GUARD * dt);
    }
    if (g.caughtPlayer) return endGame('lose', 'caught');
  }
  for (const cam of state.cameras) {
    const hot = cam.update(dt, state.time, p, blocks);
    if (hot) {
      anySeen = true;
      state.alarm = Math.min(100, state.alarm + ALARM_RISE_CAMERA * dt);
      if (!state.wasSeen) sfx.cameraPing();
    }
  }
  if (anySeen && !state.wasSeen) sfx.spotted();
  state.wasSeen = anySeen;
  state.anySeen = anySeen;

  if (!anySeen) state.alarm = Math.max(0, state.alarm - ALARM_FALL * dt);
  state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
  sfx.alarmPulse(state.alarm);
  if (state.alarm >= 100) return endGame('lose', 'lockdown');

  const got = p.collectLoot(state.lootItems);
  for (const item of got) {
    if (item.kind === 'diamond') sfx.diamond();
    else sfx.pickup();
  }

  for (const c of state.coinsThrown) c.age += dt;
  state.coinsThrown = state.coinsThrown.filter((c) => c.age < 1.2);

  // Win: diamond in hand and standing in the exit.
  if (p.hasDiamond()
    && p.x > EXIT.x && p.x < EXIT.x + EXIT.w
    && p.y > EXIT.y && p.y < EXIT.y + EXIT.h) {
    return endGame('win');
  }
}

function endGame(phase, reason = null) {
  state.phase = phase;
  if (phase === 'win') {
    const all = state.lootItems.every((l) => l.taken);
    state.rating = state.maxAlarm < 50 && all ? 'Ghost — never even noticed'
      : state.maxAlarm < 80 ? 'Smooth Operator'
      : 'Loud & Proud';
    sfx.win();
  } else {
    state.loseReason = reason;
    sfx.caught();
  }
}

// --- Loop -------------------------------------------------------------
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.phase === 'play' && !SHOT) update(dt);
  render(ctx, {
    alarm: state.alarm,
    loot: state.player.loot,
    lootTotal: state.lootItems.length,
    lootItems: state.lootItems,
    coins: state.player.coins,
    score: state.player.score,
    timeText: timeText(state.time),
    time: state.time,
    objective: objectiveText(),
    phase: state.phase,
    loseReason: state.loseReason,
    rating: state.rating,
    anySeen: state.anySeen,
    player: state.player,
    guards: state.guards,
    cameras: state.cameras,
    coinsThrown: state.coinsThrown,
    exitOpen: state.player.hasDiamond(),
  });
  requestAnimationFrame(frame);
}

if (SHOT) {
  applyShot(SHOT);
  document.title = `Vaultbreak — shot ${SHOT}`;
} else {
  document.title = 'Vaultbreak — The Meridian Job';
}
// Debug handle for automated play-testing (read-only state).
window.__game = state;
requestAnimationFrame(frame);
