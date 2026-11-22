// guard.js — guard AI: patrol, suspicion, chase and noise investigation.
// A guard's alertness grows while the thief is in its vision cone and
// falls when the thief breaks line of sight. Suspicion makes it walk to
// the last seen spot and look around; full alertness makes it chase.

import { visibilityOf, angleDiff, angleTo } from './vision.js';
import { moveCircle } from './level.js';

export const GUARD_CONE_HALF = 0.61; // ~35 degrees each side
export const GUARD_RANGE = 225;
export const GUARD_RADIUS = 15;

const PATROL_SPEED = 72;
const SUSPICIOUS_SPEED = 96;
const CHASE_SPEED = 168;

export class Guard {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.x = def.x;
    this.y = def.y;
    this.waypoints = def.waypoints;
    this.wp = 1 % def.waypoints.length;
    this.facing = 0;
    this.state = 'patrol'; // patrol | suspicious | chase | investigate
    this.alertness = 0; // 0..1, 1 = chasing
    this.lastSeen = null; // {x, y} of the thief, or null
    this.lastSeenAt = -99;
    this.investigateTarget = null;
    this.scanTimer = 0;
    this.pauseTimer = 0;
    this.caughtPlayer = false;
  }

  // Where the guard is heading right now (for drawing the cone).
  get coneFacing() {
    return this.facing;
  }

  update(dt, player, blocks, now) {
    const vis = visibilityOf(
      this.x, this.y, this.facing, GUARD_CONE_HALF, GUARD_RANGE,
      player.x, player.y, blocks,
    );
    const sees = vis > 0;
    if (sees) {
      this.lastSeen = { x: player.x, y: player.y };
      this.lastSeenAt = now;
      this.alertness = Math.min(1, this.alertness + dt * 1.25 * (0.6 + vis));
    } else {
      this.alertness = Math.max(0, this.alertness - dt * 0.45);
    }

    if (this.alertness >= 1) this.state = 'chase';
    else if (this.alertness >= 0.35) this.state = 'suspicious';
    else if (this.state === 'chase' || this.state === 'suspicious') this.state = 'patrol';

    let target = null;
    let speed = PATROL_SPEED;
    if (this.state === 'chase' && this.lastSeen) {
      target = this.lastSeen;
      speed = CHASE_SPEED;
      // Chase the live position when close enough to see; otherwise the
      // last seen spot. Re-acquire the player while chasing.
      if (sees) target = { x: player.x, y: player.y };
    } else if (this.state === 'suspicious' && this.lastSeen) {
      target = this.lastSeen;
      speed = SUSPICIOUS_SPEED;
    } else if (this.state === 'investigate' && this.investigateTarget) {
      target = this.investigateTarget;
      speed = SUSPICIOUS_SPEED;
    } else {
      target = { x: this.waypoints[this.wp][0], y: this.waypoints[this.wp][1] };
    }

    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const step = Math.min(dist, speed * dt);
        const moved = moveCircle(this.x, this.y, GUARD_RADIUS, (dx / dist) * step, (dy / dist) * step, blocks);
        this.x = moved.x;
        this.y = moved.y;
        this.facing = angleTo(this.x, this.y, target.x, target.y);
      } else if (this.state === 'patrol') {
        // Reached a waypoint: pause briefly, then walk to the next one.
        this.pauseTimer -= dt;
        if (this.pauseTimer <= 0) {
          this.wp = (this.wp + 1) % this.waypoints.length;
          this.pauseTimer = 0.9;
        }
        // Look down the corridor while waiting.
        this.facing += angleDiff(angleTo(this.x, this.y, this.waypoints[this.wp][0], this.waypoints[this.wp][1]), this.facing) * Math.min(1, dt * 3);
      } else if (this.state === 'suspicious' || this.state === 'investigate') {
        // Arrived at the suspicious spot: scan around for a while.
        this.scanTimer += dt;
        this.facing += dt * 1.6;
        if (this.scanTimer > 3.5) {
          this.scanTimer = 0;
          this.investigateTarget = null;
          this.state = 'patrol';
          this.alertness = Math.max(0, this.alertness - 0.2);
        }
      }
    }

    // A guard that gets close enough grabs the thief.
    if (Math.hypot(player.x - this.x, player.y - this.y) < GUARD_RADIUS + 13) {
      this.caughtPlayer = true;
    }
    return sees;
  }

  // A noise at (x, y): walk over and look, unless already chasing.
  hearNoise(x, y, now) {
    if (this.state === 'chase') return;
    this.investigateTarget = { x, y };
    this.state = 'investigate';
    this.scanTimer = 0;
    this.lastSeenAt = now;
  }
}
