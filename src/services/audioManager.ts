// Web Audio API Synthesizer for Dementia-Friendly Audio Feedback
// Provides calming chimes, tactile tap clicks, encouragement fanfare, and ambient nature soundscape

class AudioManager {
  private ctx: AudioContext | null = null;
  private ambientOscillators: { osc1?: OscillatorNode; osc2?: OscillatorNode; gainNode?: GainNode } = {};
  public isMuted: boolean = false;
  public isAmbientPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Gentle, tactile tap sound for buttons
  playTap() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio context fallback safe
    }
  }

  // Melodic soothing success chime (Major triad: C5 - E5 - G5)
  playSuccess() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.5);
      });
    } catch {
      // safe fallback
    }
  }

  // Gentle encouragement tone (non-punitive soft tone for minor mismatch)
  playTryAgain() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4
      osc.frequency.linearRampToValueAtTime(293.66, this.ctx.currentTime + 0.25); // D4

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // safe fallback
    }
  }

  // Celebratory victory fanfare for completing a cognitive game
  playVictory() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const chords = [
        { freqs: [261.63, 329.63, 392.00], time: 0 },       // C major
        { freqs: [293.66, 369.99, 440.00], time: 0.2 },     // D major
        { freqs: [329.63, 415.30, 493.88], time: 0.4 },     // E major
        { freqs: [523.25, 659.25, 783.99, 1046.50], time: 0.65 }, // High C major
      ];

      chords.forEach((chord) => {
        chord.freqs.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime + chord.time);

          gain.gain.setValueAtTime(0.08, this.ctx.currentTime + chord.time);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + chord.time + 0.6);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(this.ctx.currentTime + chord.time);
          osc.stop(this.ctx.currentTime + chord.time + 0.65);
        });
      });
    } catch {
      // safe fallback
    }
  }

  // Soothing Brahmaputra nature / meditative drone soundscape
  toggleAmbientSoundscape(): boolean {
    this.initCtx();
    if (!this.ctx) return false;

    if (this.isAmbientPlaying) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  private startAmbient() {
    if (!this.ctx) return;
    this.stopAmbient();

    try {
      // Calming low fundamental frequency (Brahmaputra river drone + gentle acoustic harmonics)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(196.00, this.ctx.currentTime); // G3

      // Gentle LFO filter effect to mimic gentle water waves
      gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.ambientOscillators = { osc1, osc2, gainNode };
      this.isAmbientPlaying = true;
    } catch {
      this.isAmbientPlaying = false;
    }
  }

  stopAmbient() {
    if (this.ambientOscillators.osc1) {
      try {
        this.ambientOscillators.osc1.stop();
        this.ambientOscillators.osc2?.stop();
      } catch {
        // safe ignore
      }
    }
    this.ambientOscillators = {};
    this.isAmbientPlaying = false;
  }
}

export const audioManager = new AudioManager();
