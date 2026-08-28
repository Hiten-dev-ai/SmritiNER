// Web Audio API Synthesizer for Dementia-Friendly Audio Feedback & Tactile Mahjong
// Provides soothing tactile ceramic clicks, wooden toks, warm bell flourishes, and calm ambient soundscapes.

import type { AudioPreferences, SoundEvent } from '../types';

export type MahjongSoundEvent =
  | 'tile-pick'
  | 'tile-blocked'
  | 'pair-match'
  | 'pair-mismatch'
  | 'exposed-tile'
  | 'hint'
  | 'undo'
  | 'shuffle'
  | 'journey-complete'
  | 'stage-unlocked'
  | 'tap'
  | 'reminder';

class AudioManager {
  private ctx: AudioContext | null = null;
  private ambientSource: { noiseNode?: AudioNode; filterNode?: BiquadFilterNode; gainNode?: GainNode } = {};
  private lastPlayTimes: Partial<Record<string, number>> = {};
  private pairMatchVariant = 0;
  private tilePickVariant = 0;

  public preferences: AudioPreferences = {
    effectsEnabled: true,
    effectsVolume: 'medium',
    ambienceEnabled: false,
    reminderEnabled: true,
  };

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences() {
    try {
      const savedEffects = localStorage.getItem('smriti-audio-effects');
      const savedVolume = localStorage.getItem('smriti-audio-volume');
      const savedAmbience = localStorage.getItem('smriti-audio-ambience');
      const savedReminder = localStorage.getItem('smriti-reminder-sound');

      if (savedEffects !== null) this.preferences.effectsEnabled = savedEffects === 'true';
      if (savedVolume === 'low' || savedVolume === 'medium' || savedVolume === 'high') {
        this.preferences.effectsVolume = savedVolume;
      }
      if (savedAmbience !== null) this.preferences.ambienceEnabled = savedAmbience === 'true';
      if (savedReminder !== null) this.preferences.reminderEnabled = savedReminder === 'true';
    } catch {
      // safe fallback
    }
  }

  public savePreferences() {
    try {
      localStorage.setItem('smriti-audio-effects', String(this.preferences.effectsEnabled));
      localStorage.setItem('smriti-audio-volume', this.preferences.effectsVolume);
      localStorage.setItem('smriti-audio-ambience', String(this.preferences.ambienceEnabled));
      localStorage.setItem('smriti-reminder-sound', String(this.preferences.reminderEnabled));
    } catch {
      // safe ignore
    }
  }

  public setPreferences(next: Partial<AudioPreferences>) {
    this.preferences = { ...this.preferences, ...next };
    this.savePreferences();
    if (!this.preferences.ambienceEnabled && this.isAmbientPlaying) {
      this.stopAmbient();
    } else if (this.preferences.ambienceEnabled && !this.isAmbientPlaying) {
      this.startAmbient();
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Prime AudioContext on first user interaction to satisfy browser autoplay policies.
   */
  public prime() {
    this.initCtx();
  }

  // --- Convenience Wrappers ---
  public playTap() {
    this.play('tap');
  }

  public playSuccess() {
    this.play('pair-match');
  }

  public playTryAgain() {
    this.play('gentle-nudge');
  }

  public playVictory() {
    this.play('journey-complete');
  }

  public duckAmbient(duck: boolean) {
    if (!this.ambientSource.gainNode || !this.ctx) return;
    const target = duck ? 0.005 : 0.02;
    try {
      this.ambientSource.gainNode.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.3);
    } catch {
      // safe ignore
    }
  }

  private getVolumeMultiplier(): number {
    switch (this.preferences.effectsVolume) {
      case 'low':
        return 0.35;
      case 'high':
        return 1.0;
      case 'medium':
      default:
        return 0.65;
    }
  }

  /**
   * Play a sound event with rate-limiting and gentle frequency shaping.
   */
  public play(event: SoundEvent | MahjongSoundEvent) {
    if (!this.preferences.effectsEnabled) return;

    // Rate-limit high frequency triggers
    const now = Date.now();
    const lastTime = this.lastPlayTimes[event] || 0;
    const cooldown = event === 'tile-pick' || event === 'tile-blocked' ? 70 : 150;
    if (now - lastTime < cooldown) return;
    this.lastPlayTimes[event] = now;

    const ctx = this.initCtx();
    if (!ctx) return;

    const vol = this.getVolumeMultiplier();

    try {
      switch (event) {
        case 'tap':
          this.synthesizeSoftTap(ctx, vol);
          break;
        case 'tile-pick':
          this.synthesizeTactileCeramicClick(ctx, vol);
          break;
        case 'tile-blocked':
          this.synthesizeDampWoodenTok(ctx, vol);
          break;
        case 'tile-reveal':
        case 'exposed-tile':
          this.synthesizeExposedTileShimmer(ctx, vol);
          break;
        case 'pair-match':
          this.synthesizeTactilePairMatch(ctx, vol);
          break;
        case 'gentle-nudge':
        case 'pair-mismatch':
          this.synthesizeTactilePairMismatch(ctx, vol);
          break;
        case 'hint':
          this.synthesizeTactileHintBell(ctx, vol);
          break;
        case 'undo':
          this.synthesizeTactileUndo(ctx, vol);
          break;
        case 'shuffle':
          this.synthesizeTileRustle(ctx, vol);
          break;
        case 'round-complete':
          this.synthesizeRoundCompleteBloom(ctx, vol);
          break;
        case 'stage-unlocked':
          this.synthesizeStageUnlockedPhrase(ctx, vol);
          break;
        case 'journey-complete':
          this.synthesizeJourneyCompleteCelebration(ctx, vol);
          break;
        case 'reminder':
          if (this.preferences.reminderEnabled) {
            this.synthesizeReminderAlert(ctx, vol);
          }
          break;
      }
    } catch {
      // safe fallback if audio pipeline fails
    }
  }

  // -----------------------------------------------------------------
  // TACTILE MAHJONG SOUND SYNTHESIZERS
  // -----------------------------------------------------------------

  /**
   * Short tactile ivory/ceramic click with subtle randomized pitch variation.
   */
  private synthesizeTactileCeramicClick(ctx: AudioContext, vol: number) {
    const pitchPivots = [540, 580, 620];
    const baseFreq = pitchPivots[this.tilePickVariant % pitchPivots.length];
    this.tilePickVariant += 1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.045);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, ctx.currentTime);

    gain.gain.setValueAtTime(0.16 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.046);
  }

  /**
   * Damp wooden "tok" for blocked tiles (low, non-alarming 180Hz thump).
   */
  private synthesizeDampWoodenTok(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.06);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(260, ctx.currentTime);
    filter.Q.value = 2.0;

    gain.gain.setValueAtTime(0.12 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.065);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.066);
  }

  /**
   * Two gentle ceramic taps for mismatches (no harsh buzzer).
   */
  private synthesizeTactilePairMismatch(ctx: AudioContext, vol: number) {
    const taps = [
      { freq: 360, time: 0 },
      { freq: 300, time: 0.07 },
    ];

    taps.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.time);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + t.time + 0.04);

      const st = ctx.currentTime + t.time;
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.1 * vol, st + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.051);
    });
  }

  /**
   * Ceramic double click followed by warm two-note harmonic chime (440Hz -> 660Hz).
   */
  private synthesizeTactilePairMatch(ctx: AudioContext, vol: number) {
    // 1. Initial tactile click
    this.synthesizeTactileCeramicClick(ctx, vol * 0.9);

    // 2. Harmonic warm bell chime
    const chordVariants = [
      [440.0, 659.25], // A4, E5
      [523.25, 783.99], // C5, G5
      [587.33, 880.0], // D5, A5
    ];
    const notes = chordVariants[this.pairMatchVariant % chordVariants.length];
    this.pairMatchVariant += 1;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.04 + idx * 0.05);

      const st = ctx.currentTime + 0.04 + idx * 0.05;
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.12 * vol, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + 0.39);
    });
  }

  /**
   * Subtle airy chime shimmer for newly exposed tiles.
   */
  private synthesizeExposedTileShimmer(ctx: AudioContext, vol: number) {
    if (this.preferences.effectsVolume === 'low') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
    osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.1); // E6

    gain.gain.setValueAtTime(0.005 * vol, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04 * vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  /**
   * Rounded marimba / bell tone at comfortable mid frequency (520Hz).
   */
  private synthesizeTactileHintBell(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.14 * vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.46);
  }

  /**
   * Reversed soft click for Undo.
   */
  private synthesizeTactileUndo(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.01 * vol, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08 * vol, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  /**
   * 600ms multi-impulse tile rustle simulation for Shuffle.
   */
  private synthesizeTileRustle(ctx: AudioContext, vol: number) {
    const offsets = [0, 0.08, 0.16, 0.25, 0.35, 0.46];
    offsets.forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 380 + (idx % 3) * 90;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + offset + 0.04);

      const st = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.08 * vol, st + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + 0.052);
    });
  }

  private synthesizeSoftTap(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.09 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.051);
  }

  private synthesizeRoundCompleteBloom(ctx: AudioContext, vol: number) {
    const notes = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

      const startTime = ctx.currentTime + idx * 0.09;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12 * vol, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.56);
    });
  }

  private synthesizeStageUnlockedPhrase(ctx: AudioContext, vol: number) {
    const phrase = [
      { freq: 440.0, time: 0 },
      { freq: 554.37, time: 0.11 },
      { freq: 659.25, time: 0.22 },
      { freq: 880.0, time: 0.35 },
    ];
    phrase.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.freq, ctx.currentTime + item.time);

      const startTime = ctx.currentTime + item.time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.14 * vol, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.51);
    });
  }

  private synthesizeJourneyCompleteCelebration(ctx: AudioContext, vol: number) {
    const chords = [
      { freqs: [261.63, 329.63, 392.0], time: 0 }, // C maj
      { freqs: [329.63, 392.0, 523.25], time: 0.2 }, // E min/C
      { freqs: [523.25, 659.25, 783.99, 1046.5], time: 0.42 }, // High C maj
    ];
    chords.forEach((chord) => {
      chord.freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + chord.time);

        const startTime = ctx.currentTime + chord.time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.07 * vol, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.66);
      });
    });
  }

  private synthesizeReminderAlert(ctx: AudioContext, vol: number) {
    const notes = [587.33, 880.0, 587.33, 880.0];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);

      const startTime = ctx.currentTime + idx * 0.16;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12 * vol, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  }

  // -----------------------------------------------------------------
  // PROCEDURAL CALM AMBIENCE (Soft filtered water / breeze texture)
  // -----------------------------------------------------------------

  public get isAmbientPlaying(): boolean {
    return Boolean(this.ambientSource.noiseNode);
  }

  public toggleAmbientSoundscape(): boolean {
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      this.preferences.ambienceEnabled = false;
      this.savePreferences();
      return false;
    } else {
      this.startAmbient();
      this.preferences.ambienceEnabled = true;
      this.savePreferences();
      return true;
    }
  }

  public startAmbient() {
    const ctx = this.initCtx();
    if (!ctx || this.isAmbientPlaying) return;

    try {
      // 2-second white noise buffer filtered to soothing stream/breeze texture
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise integrator filter
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.8;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 1.2); // Smooth 1.2s fade-in

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      this.ambientSource = { noiseNode: whiteNoise, filterNode: filter, gainNode: gain };
    } catch {
      // ambient fallback
    }
  }

  public stopAmbient() {
    if (!this.ambientSource.noiseNode) return;
    try {
      const { noiseNode, gainNode } = this.ambientSource;
      if (this.ctx && gainNode) {
        gainNode.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
      }
      setTimeout(() => {
        try {
          (noiseNode as AudioBufferSourceNode)?.stop();
          (noiseNode as AudioBufferSourceNode)?.disconnect();
        } catch {
          // safe ignore
        }
        this.ambientSource = {};
      }, 850);
    } catch {
      this.ambientSource = {};
    }
  }

  /**
   * Preview a tactile sound for the settings UI.
   */
  public previewSound() {
    this.play('tile-pick');
    setTimeout(() => this.play('pair-match'), 220);
  }
}

export const audioManager = new AudioManager();
