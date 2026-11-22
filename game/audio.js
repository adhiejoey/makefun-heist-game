// audio.js — procedural sound, no audio files.
// Every sound is synthesized with the Web Audio API on first use.
// The context is created lazily on the first user gesture, so loading
// the page (or a screenshot run) stays silent.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.alarmOn = false;
    this.alarmTimer = null;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  tone(freq, dur, type = 'sine', vol = 0.5, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noiseBurst(dur, vol = 0.3, freq = 1200) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  footstep(sprint) {
    this.noiseBurst(0.05, sprint ? 0.16 : 0.08, sprint ? 900 : 600);
  }

  coinThrow() {
    this.tone(2400, 0.09, 'sine', 0.25, 0, 1800);
  }

  coinLand() {
    this.tone(3200, 0.07, 'sine', 0.3);
    this.tone(2100, 0.12, 'sine', 0.2, 0.05);
    this.noiseBurst(0.04, 0.12, 4000);
  }

  pickup() {
    this.tone(880, 0.09, 'sine', 0.4);
    this.tone(1318, 0.14, 'sine', 0.4, 0.08);
  }

  diamond() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.4, i * 0.07));
  }

  spotted() {
    this.tone(196, 0.22, 'sawtooth', 0.3, 0, 392);
  }

  cameraPing() {
    this.tone(1567, 0.1, 'square', 0.14);
  }

  caught() {
    [392, 311, 233, 155].forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.35, i * 0.13));
  }

  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.4, i * 0.09));
  }

  // A soft repeating beep while the alarm is high. Call every frame;
  // it schedules its own pulses.
  alarmPulse(alarm) {
    if (!this.ctx || this.muted || alarm < 55) return;
    if (this._nextBeep && this.ctx.currentTime < this._nextBeep) return;
    const interval = alarm > 85 ? 0.35 : 0.7;
    this._nextBeep = this.ctx.currentTime + interval;
    this.tone(987, 0.12, 'square', 0.12);
  }
}
