// camera.js — wall-mounted CCTV cameras.
// A camera sweeps its cone back and forth. While the thief is inside the
// cone with a clear line of sight, the camera is "hot": it feeds the
// alarm and flashes red. Cameras never move from their mount.

import { visibilityOf } from './vision.js';

export const CAMERA_HALF_ANGLE = 0.55; // ~31 degrees each side

export class Camera {
  constructor(def) {
    this.id = def.id;
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.range = def.range;
    this.period = def.period;
    this.phase = Math.random() * Math.PI * 2;
    this.angle = def.baseAngle;
    this.hot = false; // currently seeing the thief
    this.hotTime = 0;
  }

  update(dt, time, player, blocks) {
    // Smooth ping-pong sweep: sine easing between the sweep extremes.
    this.angle = this.baseAngle + this.sweep * Math.sin((time / this.period) * Math.PI * 2 + this.phase);
    const vis = visibilityOf(
      this.x, this.y, this.angle, CAMERA_HALF_ANGLE, this.range,
      player.x, player.y, blocks,
    );
    this.hot = vis > 0;
    if (this.hot) this.hotTime += dt;
    else this.hotTime = 0;
    return this.hot;
  }
}
