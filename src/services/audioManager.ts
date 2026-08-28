// Web Audio API Synthesizer for Dementia-Friendly Audio Feedback
// Provides soothing tactile chimes, soft card reveals, warm bell flourishes, and ambient soundscapes.

import type { AudioPreferences, SoundEvent } from '../types';

class AudioManager {
  private ctx: AudioContext | null = null;
  private ambientOscillators: { osc1?: OscillatorNode; osc2?: OscillatorNode; gainNode?: GainNode } = {};
  private lastPlayTimes: Partial<Record<SoundEvent, number>> = {};
  private isDucked: boolean = false;
  private pairMatchVariant = 0;

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

  private getVolumeMultiplier(): number {
    switch (this.preferences.effectsVolume) {
      case 'low':
        return 0.4;
      case 'high':
        return 1.2;
      case 'medium':
      default:
        return 0.8;
    }
  }

  public play(event: SoundEvent) {
    if (!this.preferences.effectsEnabled && event !== 'reminder') return;
    if (event === 'reminder' && !this.preferences.reminderEnabled) return;

    // Debounce rapid tap / clicks
    const now = Date.now();
    const lastTime = this.lastPlayTimes[event] || 0;
    if (event === 'tap' || event === 'tile-pick') {
      if (now - lastTime < 50) return;
    }
    this.lastPlayTimes[event] = now;

    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const baseVol = this.getVolumeMultiplier();

      switch (event) {
        case 'tap':
          this.synthesizeSoftTap(ctx, baseVol);
          break;
        case 'tile-pick':
          this.synthesizeTilePick(ctx, baseVol);
          break;
        case 'tile-reveal':
          this.synthesizeTileReveal(ctx, baseVol);
          break;
        case 'pair-match':
          this.synthesizePairMatchChime(ctx, baseVol);
          break;
        case 'gentle-nudge':
          this.synthesizeGentleNudge(ctx, baseVol);
          break;
        case 'hint':
          this.synthesizeHintBell(ctx, baseVol);
          break;
        case 'round-complete':
          this.synthesizeRoundCompleteBloom(ctx, baseVol);
          break;
        case 'stage-unlocked':
          this.synthesizeStageUnlockedPhrase(ctx, baseVol);
          break;
        case 'journey-complete':
          this.synthesizeJourneyCompleteCelebration(ctx, baseVol);
          break;
        case 'reminder':
          this.synthesizeReminderAlert(ctx, baseVol);
          break;
      }
    } catch {
      // Audio context synthesis fallback
    }
  }

  // --- Web Audio Synthesizers ---

  private synthesizeSoftTap(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.1 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  private synthesizeTilePick(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.12 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  private synthesizeTileReveal(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5

    gain.gain.setValueAtTime(0.01 * vol, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1 * vol, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  private synthesizePairMatchChime(ctx: AudioContext, vol: number) {
    // 3 lightly varied warm pentatonic bell chimes
    const variants = [
      [523.25, 659.25, 783.99], // C5, E5, G5
      [587.33, 739.99, 880.00], // D5, F#5, A5
      [659.25, 783.99, 1046.50], // E5, G5, C6
    ];
    const notes = variants[this.pairMatchVariant % variants.length];
    this.pairMatchVariant += 1;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

      const startTime = ctx.currentTime + idx * 0.07;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12 * vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.46);
    });
  }

  private synthesizeGentleNudge(ctx: AudioContext, vol: number) {
    // Non-punitive, calm gentle tone (E4 -> D4)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(329.63, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(293.66, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.08 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  private synthesizeHintBell(ctx: AudioContext, vol: number) {
    const freqs = [880.00, 1318.51]; // A5, E6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

      const startTime = ctx.currentTime + idx * 0.05;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1 * vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.51);
    });
  }

  private synthesizeRoundCompleteBloom(ctx: AudioContext, vol: number) {
    const notes = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

      const startTime = ctx.currentTime + idx * 0.09;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12 * vol, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.62);
    });
  }

  private synthesizeStageUnlockedPhrase(ctx: AudioContext, vol: number) {
    const phrase = [
      { freq: 440.00, time: 0 },
      { freq: 554.37, time: 0.12 },
      { freq: 659.25, time: 0.24 },
      { freq: 880.00, time: 0.38 },
    ];
    phrase.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.freq, ctx.currentTime + item.time);

      const startTime = ctx.currentTime + item.time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.14 * vol, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.56);
    });
  }

  private synthesizeJourneyCompleteCelebration(ctx: AudioContext, vol: number) {
    const chords = [
      { freqs: [261.63, 329.63, 392.00], time: 0 },
      { freqs: [329.63, 415.30, 493.88], time: 0.22 },
      { freqs: [523.25, 659.25, 783.99, 1046.50], time: 0.45 },
    ];
    chords.forEach((chord) => {
      chord.freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + chord.time);

        const startTime = ctx.currentTime + chord.time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08 * vol, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.72);
      });
    });
  }

  private synthesizeReminderAlert(ctx: AudioContext, vol: number) {
    const notes = [587.33, 880.00, 587.33, 880.00];
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

  // --- Ambient Brahmaputra Drone Soundscape ---

  public get isAmbientPlaying(): boolean {
    return Boolean(this.ambientOscillators.osc1);
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
    if (!ctx) return;
    this.stopAmbient();

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(130.81, ctx.currentTime); // C3 fundamental drone

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(196.00, ctx.currentTime); // G3 harmonic

      const targetVol = this.isDucked ? 0.008 : 0.035;
      gainNode.gain.setValueAtTime(targetVol, ctx.currentTime);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();

      this.ambientOscillators = { osc1, osc2, gainNode };
    } catch {
      this.ambientOscillators = {};
    }
  }

  public stopAmbient() {
    if (this.ambientOscillators.osc1) {
      try {
        this.ambientOscillators.osc1.stop();
        this.ambientOscillators.osc2?.stop();
      } catch {
        // safe ignore
      }
    }
    this.ambientOscillators = {};
  }

  public duckAmbient(duck: boolean) {
    this.isDucked = duck;
    if (this.ambientOscillators.gainNode && this.ctx) {
      const target = duck ? 0.006 : 0.035;
      this.ambientOscillators.gainNode.gain.linearRampToValueAtTime(
        target,
        this.ctx.currentTime + 0.2
      );
    }
  }

  public stopAll() {
    this.stopAmbient();
  }

  // --- Legacy helpers ---
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
}

export const audioManager = new AudioManager();
