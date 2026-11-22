// level.js — "Aurum Bank": the floor plan for the heist.
// Walls, cover, loot, cameras, guard patrols, exit and player start.
// Canvas is 1280x800. All coordinates are in pixels; (0,0) is top-left.

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Rect helper: {x, y, w, h} with x/y the top-left corner.
export const WALLS = [
  // Outer border (24 px thick).
  { x: 0, y: 0, w: 1280, h: 24 },
  { x: 0, y: 776, w: 1280, h: 24 },
  { x: 0, y: 0, w: 24, h: 800 },
  { x: 1256, y: 0, w: 24, h: 800 },
  // Wall A (vertical, x=420, upper half) with a door gap at y 170..210.
  { x: 420, y: 24, w: 24, h: 146 },
  { x: 420, y: 210, w: 24, h: 150 },
  // Wall B (vertical, x=860, upper half) with a door gap at y 170..210.
  { x: 860, y: 24, w: 24, h: 146 },
  { x: 860, y: 210, w: 24, h: 150 },
  // Wall C (horizontal, y=360) with door gaps at x 200..240, 620..660, 1040..1080.
  { x: 24, y: 360, w: 176, h: 24 },
  { x: 240, y: 360, w: 380, h: 24 },
  { x: 660, y: 360, w: 380, h: 24 },
  { x: 1080, y: 360, w: 176, h: 24 },
  // Wall D (vertical, x=420, lower half) with a door gap at y 560..600.
  { x: 420, y: 384, w: 24, h: 176 },
  { x: 420, y: 600, w: 24, h: 176 },
  // Wall E (vertical, x=860, lower half) with a door gap at y 560..600.
  { x: 860, y: 384, w: 24, h: 176 },
  { x: 860, y: 600, w: 24, h: 176 },
  // Vault room (top-right, x 960..1256, y 24..240): left wall with a door
  // gap at y 120..168, solid bottom wall.
  { x: 960, y: 24, w: 24, h: 96 },
  { x: 960, y: 168, w: 24, h: 72 },
  { x: 960, y: 240, w: 296, h: 24 },
];

// Cover objects block both movement and line of sight.
// Keep every cover rect clear of the guard patrol lines: a guard walks
// straight at its next waypoint and a rect sitting exactly on that line
// pins it forever (the push-out is purely sideways there, so the guard
// can never slide around it). Patrol lines: G1's rectangle
// (500,700)-(800,700)-(800,420)-(500,420), G2's y=300 line x 470..820,
// G3's y=290 line x 980..1230.
// kind: 'crate' | 'desk' | 'planter' (planter is drawn round, r = w/2).
export const COVER = [
  { kind: 'crate', x: 300, y: 90, w: 44, h: 44 },
  { kind: 'crate', x: 700, y: 90, w: 44, h: 44 },
  { kind: 'crate', x: 110, y: 430, w: 44, h: 44 },
  { kind: 'crate', x: 560, y: 470, w: 44, h: 44 },
  { kind: 'crate', x: 1080, y: 470, w: 44, h: 44 },
  { kind: 'crate', x: 300, y: 660, w: 44, h: 44 },
  { kind: 'crate', x: 980, y: 660, w: 44, h: 44 },
  { kind: 'desk', x: 120, y: 240, w: 90, h: 44 },
  { kind: 'desk', x: 950, y: 430, w: 90, h: 44 },
  { kind: 'desk', x: 560, y: 650, w: 90, h: 44 },
  { kind: 'planter', x: 640, y: 200, w: 44, h: 44 },
  { kind: 'planter', x: 200, y: 300, w: 44, h: 44 },
  { kind: 'planter', x: 1080, y: 400, w: 44, h: 44 },
  { kind: 'planter', x: 640, y: 600, w: 44, h: 44 },
];

// Loot: the diamond is the job's target and is required to win;
// the rest is optional score.
export const LOOT = [
  { id: 'diamond', kind: 'diamond', x: 1108, y: 132, value: 500, required: true, label: 'Meridian Diamond' },
  { id: 'gold1', kind: 'gold', x: 720, y: 100, value: 150, required: false, label: 'Gold bars' },
  { id: 'cash1', kind: 'cash', x: 180, y: 500, value: 100, required: false, label: 'Cash stack' },
  { id: 'art1', kind: 'painting', x: 1180, y: 500, value: 120, required: false, label: 'Painting' },
  { id: 'gold2', kind: 'gold', x: 700, y: 720, value: 150, required: false, label: 'Gold bars' },
];

// Wall-mounted CCTV cameras: baseAngle is the centre of the sweep
// (radians, 0 = east, PI/2 = south), sweep is the half-range.
export const CAMERAS = [
  { id: 'cam1', x: 444, y: 60, baseAngle: 0, sweep: 0.96, range: 280, period: 5.0 },
  { id: 'cam2', x: 1108, y: 264, baseAngle: Math.PI / 2, sweep: 0.87, range: 280, period: 6.0 },
  { id: 'cam3', x: 640, y: 752, baseAngle: -Math.PI / 2, sweep: 0.87, range: 260, period: 5.0 },
];

// Guard patrols: waypoints the guard walks in order, then loops.
export const GUARDS = [
  { id: 'g1', name: 'Marco', x: 500, y: 700, waypoints: [[500, 700], [800, 700], [800, 420], [500, 420]] },
  { id: 'g2', name: 'Lena', x: 470, y: 300, waypoints: [[470, 300], [820, 300]] },
  { id: 'g3', name: 'Viktor', x: 980, y: 290, waypoints: [[980, 290], [1230, 290]] },
];

export const PLAYER_START = { x: 80, y: 720 };

// The getaway: stand here with the diamond to win.
export const EXIT = { x: 24, y: 690, w: 100, h: 86 };

// Every solid rect (walls + cover) for collision and sight tests.
export function solids() {
  return WALLS.concat(COVER.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })));
}

// Circle-vs-rect collision: push the circle out of a rect, or return null.
export function resolveCircleRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  if (d2 === 0) return { x: px, y: rect.y - r }; // centre inside: push up
  const d = Math.sqrt(d2);
  return { x: cx + (dx / d) * r, y: cy + (dy / d) * r };
}

// Move a circle by (dx, dy) with axis-separated collision against solids.
export function moveCircle(px, py, r, dx, dy, blocks) {
  let nx = px + dx;
  for (const s of blocks) {
    const hit = resolveCircleRect(nx, py, r, s);
    if (hit) nx = hit.x;
  }
  let ny = py + dy;
  for (const s of blocks) {
    const hit = resolveCircleRect(nx, ny, r, s);
    if (hit) ny = hit.y;
  }
  return { x: nx, y: ny };
}
