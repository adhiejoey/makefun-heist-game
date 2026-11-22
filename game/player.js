// player.js — the thief ("Rook").
// Walks with WASD / arrows, sprints with Shift (fast but loud), and
// throws coins with a mouse click to pull guards away. Loot is picked
// up by walking over it.

import { moveCircle } from './level.js';

export const PLAYER_RADIUS = 13;
export const WALK_SPEED = 178;
export const SPRINT_SPEED = 268;
export const SPRINT_NOISE_RADIUS = 150;
export const COIN_RANGE = 330;
export const COIN_NOISE_RADIUS = 210;

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.facing = -Math.PI / 2; // starts facing up, into the bank
    this.sprinting = false;
    this.moving = false;
    this.coins = 3;
    this.loot = []; // collected loot ids
    this.score = 0;
    this.stepPhase = 0;
  }

  // dx/dy is a unit direction (or 0,0). Returns the noise this move made.
  update(dt, dx, dy, sprint, blocks) {
    this.moving = dx !== 0 || dy !== 0;
    this.sprinting = sprint && this.moving;
    const speed = this.sprinting ? SPRINT_SPEED : WALK_SPEED;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      const nx = (dx / len) * speed * dt;
      const ny = (dy / len) * speed * dt;
      const moved = moveCircle(this.x, this.y, PLAYER_RADIUS, nx, ny, blocks);
      this.x = moved.x;
      this.y = moved.y;
      this.facing = Math.atan2(dy, dx);
      this.stepPhase += dt * (this.sprinting ? 13 : 9);
    }
    return this.sprinting ? SPRINT_NOISE_RADIUS : 0;
  }

  // Throw a coin toward (tx, ty). Returns the landing point, or null.
  throwCoin(tx, ty) {
    if (this.coins <= 0) return null;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) return null;
    const reach = Math.min(dist, COIN_RANGE);
    this.coins -= 1;
    return { x: this.x + (dx / dist) * reach, y: this.y + (dy / dist) * reach };
  }

  // Pick up any loot within reach. Returns the items collected.
  collectLoot(loot) {
    const got = [];
    for (const item of loot) {
      if (item.taken) continue;
      if (Math.hypot(item.x - this.x, item.y - this.y) < PLAYER_RADIUS + 18) {
        item.taken = true;
        this.loot.push(item.id);
        this.score += item.value;
        got.push(item);
      }
    }
    return got;
  }

  hasDiamond() {
    return this.loot.includes('diamond');
  }
}
