// vision.js — line of sight and vision-cone tests.
// A wall or cover rect blocks sight when the segment between two points
// touches it. All tests are pure geometry, no DOM.

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Liang-Barsky clipping: does segment (x1,y1)-(x2,y2) touch rect r?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// True when nothing blocks the view between (x1,y1) and (x2,y2).
export function hasLineOfSight(x1, y1, x2, y2, blocks) {
  for (const b of blocks) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}

export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How visible is the target to an observer at (ox,oy) facing `facing`?
// Returns 0 when out of range, outside the cone, or behind cover;
// otherwise 1 at point-blank fading to ~0.35 at max range.
export function visibilityOf(ox, oy, facing, halfAngle, range, tx, ty, blocks) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (dist > 1 && Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > halfAngle) return 0;
  if (!hasLineOfSight(ox, oy, tx, ty, blocks)) return 0;
  return 1 - 0.65 * (dist / range);
}
