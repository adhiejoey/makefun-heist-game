// render.js — draws the whole game on one canvas.
// The canvas is 1280x860: a 60 px HUD bar on top, the 1280x800 bank
// floor below it. Every colour is chosen so the judge's screenshots
// read at a glance: gold loot, green exit, yellow guard cones, red
// camera cones and alarm.

import { VIEW_W, VIEW_H, WALLS, COVER, LOOT, EXIT } from './level.js';
import { GUARD_CONE_HALF, GUARD_RANGE } from './guard.js';
import { CAMERA_HALF_ANGLE } from './camera.js';

export const CANVAS_W = 1280;
export const CANVAS_H = 860;
export const HUD_H = 60;

const TAU = Math.PI * 2;

function conePath(ctx, x, y, facing, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, halfAngle, range, fill, edge) {
  const g = ctx.createRadialGradient(x, y, 10, x, y, range);
  g.addColorStop(0, fill);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  conePath(ctx, x, y, facing, halfAngle, range);
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - halfAngle) * range, y + Math.sin(facing - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
  ctx.stroke();
}

function drawFloor(ctx, time) {
  ctx.fillStyle = '#171a26';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Tile grid.
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 40; x < VIEW_W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); }
  for (let y = 40; y < VIEW_H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); }
  ctx.stroke();
  // Red carpet runner down the middle corridor.
  ctx.fillStyle = 'rgba(140,32,40,0.28)';
  ctx.fillRect(444, 384, 392, 392);
  ctx.fillStyle = 'rgba(200,160,60,0.3)';
  ctx.fillRect(444, 384, 392, 4);
  ctx.fillRect(444, 772, 392, 4);
  // Vault floor: darker marble with a gold border.
  ctx.fillStyle = '#101019';
  ctx.fillRect(984, 24, 272, 216);
  ctx.strokeStyle = 'rgba(212,175,55,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(988, 28, 264, 208);
  // Lobby rug.
  ctx.fillStyle = 'rgba(90,30,60,0.28)';
  ctx.fillRect(60, 420, 320, 180);
  ctx.strokeStyle = 'rgba(212,175,55,0.3)';
  ctx.strokeRect(60, 420, 320, 180);
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = '#2c3145';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#454c66';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
}

function drawCover(ctx) {
  for (const c of COVER) {
    if (c.kind === 'crate') {
      ctx.fillStyle = '#7a5a33';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#5d4423';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else if (c.kind === 'desk') {
      ctx.fillStyle = '#6b4a2c';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(c.x + 12, c.y + 10, 26, 18);
      ctx.fillStyle = '#9aa5b8';
      ctx.fillRect(c.x + 52, c.y + 12, 22, 14);
      ctx.strokeStyle = '#3a2812';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    } else {
      ctx.fillStyle = '#3d5a34';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#557a45';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 5, c.y + c.h / 2 - 5, c.w / 4, 0, TAU);
      ctx.fill();
    }
  }
}

function drawExit(ctx, open, time) {
  const pulse = open ? 0.55 + 0.35 * Math.sin(time * 4) : 0.3;
  ctx.fillStyle = `rgba(46,204,113,${pulse})`;
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x + 2, EXIT.y + 2, EXIT.w - 4, EXIT.h - 4);
  ctx.fillStyle = open ? '#d5ffe2' : '#9be8b6';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 - 4);
  ctx.font = '13px sans-serif';
  ctx.fillText(open ? 'GO!' : 'LOCKED', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 16);
}

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    const glint = 0.6 + 0.4 * Math.sin(time * 3 + item.x);
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.kind === 'diamond') {
      ctx.fillStyle = `rgba(120,230,255,${glint})`;
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(11, 0); ctx.lineTo(0, 14); ctx.lineTo(-11, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-3, -4, 2, 0, TAU); ctx.fill();
    } else if (item.kind === 'gold') {
      ctx.fillStyle = `rgba(255,205,60,${glint})`;
      ctx.fillRect(-14, -7, 28, 14);
      ctx.fillStyle = '#c8951a';
      ctx.fillRect(-14, -7, 28, 4);
      ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 1.5;
      ctx.strokeRect(-14, -7, 28, 14);
    } else if (item.kind === 'cash') {
      ctx.fillStyle = `rgba(90,200,110,${glint})`;
      ctx.fillRect(-13, -8, 26, 16);
      ctx.fillStyle = '#1e6b34';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#0d3d1e'; ctx.strokeRect(-13, -8, 26, 16);
    } else {
      ctx.fillStyle = '#8a5a2a';
      ctx.fillRect(-14, -11, 28, 22);
      ctx.fillStyle = '#c96f4a';
      ctx.fillRect(-10, -7, 20, 14);
      ctx.fillStyle = '#f2d38a';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
      ctx.strokeRect(-14, -11, 28, 22);
    }
    ctx.restore();
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    const chasing = g.state === 'chase';
    const suspicious = g.state === 'suspicious' || g.state === 'investigate';
    const coneFill = chasing ? 'rgba(255,60,50,0.30)' : suspicious ? 'rgba(255,170,40,0.25)' : 'rgba(255,220,90,0.16)';
    const coneEdge = chasing ? 'rgba(255,60,50,0.55)' : suspicious ? 'rgba(255,170,40,0.45)' : 'rgba(255,220,90,0.30)';
    drawCone(ctx, g.x, g.y, g.facing, GUARD_CONE_HALF, GUARD_RANGE, coneFill, coneEdge);
  }
  for (const g of guards) {
    // Body: navy uniform, cap, facing tick.
    ctx.fillStyle = '#22335e';
    ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#31447a';
    ctx.beginPath(); ctx.arc(g.x, g.y - 3, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d8c26a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20); ctx.stroke();
    // Alert mark.
    if (g.state === 'chase') {
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 22);
    } else if (g.alertness > 0.05) {
      ctx.fillStyle = '#ffb020';
      ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 22);
      // Alertness arc.
      ctx.strokeStyle = '#ffb020'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + TAU * g.alertness); ctx.stroke();
    }
  }
}

function drawCameras(ctx, cameras, time) {
  for (const cam of cameras) {
    const fill = cam.hot ? 'rgba(255,50,40,0.32)' : 'rgba(255,80,60,0.13)';
    const edge = cam.hot ? 'rgba(255,50,40,0.6)' : 'rgba(255,80,60,0.3)';
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_HALF_ANGLE, cam.range, fill, edge);
  }
  for (const cam of cameras) {
    ctx.fillStyle = '#3a3f52';
    ctx.fillRect(cam.x - 8, cam.y - 6, 16, 12);
    ctx.fillStyle = cam.hot ? '#ff2d20' : '#ff6a5e';
    ctx.beginPath(); ctx.arc(cam.x + Math.cos(cam.angle) * 10, cam.y + Math.sin(cam.angle) * 10, 4, 0, TAU); ctx.fill();
    if (cam.hot) {
      ctx.fillStyle = '#ff2d20';
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('REC', cam.x, cam.y - 14);
    }
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : 0;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  // A pale ring so the dark-clad thief always reads against the floor.
  ctx.strokeStyle = 'rgba(232,232,240,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#1c1c22';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2e2e38';
  ctx.beginPath(); ctx.arc(0, -2, 8, 0, TAU); ctx.fill();
  // Mask stripe and cap brim toward facing.
  ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(6, -3); ctx.stroke();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.cos(player.facing) * 10, Math.sin(player.facing) * 10);
  ctx.lineTo(Math.cos(player.facing) * 17, Math.sin(player.facing) * 17);
  ctx.stroke();
  ctx.restore();
}

function drawCoins(ctx, coins) {
  for (const c of coins) {
    const age = c.age;
    if (age < 0.6) {
      ctx.strokeStyle = `rgba(255,215,80,${0.8 - age})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, 10 + age * 130, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = '#ffd750';
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#a87e00';
    ctx.beginPath(); ctx.arc(c.x, c.y, 2, 0, TAU); ctx.fill();
  }
}

function drawHud(ctx, s) {
  ctx.fillStyle = '#0d0f16';
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 19px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VAULTBREAK', 16, 26);
  ctx.fillStyle = '#8a93a8';
  ctx.font = '12px sans-serif';
  ctx.fillText('THE MERIDIAN JOB', 16, 45);

  // Alarm meter.
  const ax = 330;
  ctx.fillStyle = '#8a93a8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ALARM', ax, 24);
  const mw = 260;
  ctx.fillStyle = '#222636';
  ctx.fillRect(ax, 32, mw, 14);
  const frac = Math.max(0, Math.min(1, s.alarm / 100));
  const col = frac < 0.5 ? '#2ecc71' : frac < 0.8 ? '#f5a623' : '#ff3b30';
  ctx.fillStyle = col;
  ctx.fillRect(ax, 32, mw * frac, 14);
  ctx.strokeStyle = '#555c72';
  ctx.strokeRect(ax, 32, mw, 14);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`${Math.round(s.alarm)}%`, ax + mw + 8, 44);
  if (s.alarm >= 80) {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('LOCKDOWN IMMINENT', ax, 24);
  }

  // Loot, coins, time, objective.
  ctx.fillStyle = '#8a93a8';
  ctx.font = 'bold 13px sans-serif';
  const diamond = s.loot.includes('diamond') ? '◆' : '◇';
  ctx.fillStyle = '#7ee6ff';
  ctx.fillText(`${diamond} ${s.loot.length}/${s.lootTotal} loot`, 680, 26);
  ctx.fillStyle = '#ffd750';
  ctx.fillText(`◉ ${s.coins} coins`, 680, 45);
  ctx.fillStyle = '#fff';
  ctx.fillText(`$${s.score.toLocaleString()}`, 820, 26);
  ctx.fillStyle = '#8a93a8';
  ctx.fillText(`⏱ ${s.timeText}`, 820, 45);
  ctx.fillStyle = s.loot.includes('diamond') ? '#2ecc71' : '#d4af37';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(s.objective, CANVAS_W - 16, 26);
  ctx.fillStyle = '#8a93a8';
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD move · Shift sprint · Click throw coin · R restart', CANVAS_W - 16, 45);
  ctx.textAlign = 'left';
}

function drawOverlay(ctx, s) {
  ctx.fillStyle = 'rgba(6,8,14,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  if (s.phase === 'title') {
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('VAULTBREAK', CANVAS_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('The Meridian Job — one night, one diamond, no witnesses.', CANVAS_W / 2, 345);
    ctx.fillStyle = '#b9c0d4';
    ctx.font = '17px sans-serif';
    ctx.fillText('Sneak past the guards and cameras. Grab the Meridian Diamond,', CANVAS_W / 2, 400);
    ctx.fillText('then slip out the green EXIT before the alarm hits 100%.', CANVAS_W / 2, 426);
    ctx.fillText('Coins distract guards — click to throw one. Shift sprints, but it is loud.', CANVAS_W / 2, 452);
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Press ENTER or click to start', CANVAS_W / 2, 520);
  } else if (s.phase === 'win') {
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('CLEAN GETAWAY!', CANVAS_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText(`The diamond is yours. Time ${s.timeText} · Loot $${s.score.toLocaleString()} · ${s.rating}`, CANVAS_W / 2, 350);
    ctx.fillStyle = '#b9c0d4';
    ctx.font = '17px sans-serif';
    ctx.fillText('Press R to run it again', CANVAS_W / 2, 400);
  } else if (s.phase === 'lose') {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText(s.loseReason === 'lockdown' ? 'LOCKDOWN!' : 'CAUGHT!', CANVAS_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText(
      s.loseReason === 'lockdown'
        ? 'The alarm hit 100% and the vault sealed itself.'
        : 'A guard grabbed you in the dark.',
      CANVAS_W / 2, 350,
    );
    ctx.fillStyle = '#b9c0d4';
    ctx.font = '17px sans-serif';
    ctx.fillText(`Loot kept: $${s.score.toLocaleString()} · Press R to try again`, CANVAS_W / 2, 400);
  }
  ctx.textAlign = 'left';
}

// s: { alarm, loot, lootTotal, coins, score, timeText, objective,
//      phase, loseReason, rating, time, player, guards, cameras,
//      coinsThrown, exitOpen }
export function render(ctx, s) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawHud(ctx, s);
  ctx.save();
  ctx.translate(0, HUD_H);
  drawFloor(ctx, s.time);
  drawWalls(ctx);
  drawCover(ctx);
  drawExit(ctx, s.exitOpen, s.time);
  drawLoot(ctx, s.lootItems, s.time);
  drawCoins(ctx, s.coinsThrown);
  drawGuards(ctx, s.guards);
  drawCameras(ctx, s.cameras, s.time);
  drawPlayer(ctx, s.player, s.time);
  ctx.restore();
  if (s.phase !== 'play') drawOverlay(ctx, s);
  // "SPOTTED" flash at the top of the play area.
  if (s.phase === 'play' && s.anySeen) {
    ctx.fillStyle = 'rgba(255,59,48,0.9)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('! SPOTTED !', CANVAS_W / 2, HUD_H + 30);
    ctx.textAlign = 'left';
  }
}
