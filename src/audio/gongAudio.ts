export class AntiqueBronzeGongSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.4;

  constructor() {
    // AudioContext will initialize on first user gesture
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public strike(frequency: number = 312, duration: number = 2.4) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, now);
    masterGain.connect(this.ctx.destination);

    // Antique tin-bronze gong overtone ratios (non-harmonic bell modes)
    const overtones = [
      { ratio: 1.00, gain: 0.8, decay: 1.0 },
      { ratio: 1.41, gain: 0.5, decay: 0.8 },
      { ratio: 2.13, gain: 0.35, decay: 0.6 },
      { ratio: 2.74, gain: 0.25, decay: 0.4 },
      { ratio: 3.48, gain: 0.15, decay: 0.3 },
      { ratio: 4.25, gain: 0.10, decay: 0.2 }
    ];

    overtones.forEach(mode => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency * mode.ratio, now);

      gain.gain.setValueAtTime(mode.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * mode.decay);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration * mode.decay + 0.1);
    });
  }
}
