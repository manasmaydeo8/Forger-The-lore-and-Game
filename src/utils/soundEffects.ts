// Web Audio API Synthesizer for Immersive Sound Effects & Ambient Soundscapes

let audioCtx: AudioContext | null = null;
let ambientOsc1: OscillatorNode | null = null;
let ambientOsc2: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let isAmbientPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SoundFX = {
  // Skill dissolution or combat defeat
  playDissolve() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Physical impact punch/slash
  playPunch() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Barrier / Matrix activation pulse
  playMatrixPulse() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(640, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Player Level Up Fanfare
  playLevelUp() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.16, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.65);
      });
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Awakening Crystal resonance hum
  playCrystalPulse() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc2.type = 'triangle';

      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.2);

      osc2.frequency.setValueAtTime(220, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + 2.1);
      osc2.stop(ctx.currentTime + 2.1);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Transparent blue system window notification
  playSystemNotification() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.08); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Demonic / Error Glitch
  playDemonicAnomaly() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const noiseGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(45, now + 0.4);

      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Fireball ignition flame sound
  playFireballIgnition() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.4);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Mana Replenishment pulse chime
  playManaReplenish() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(784, now + 0.35); // E5 to G5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Skill Forging chime
  playSkillForged() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.18, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.85);
      });
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Ambient Dark Fantasy Drone
  toggleAmbient(enable?: boolean): boolean {
    try {
      const ctx = getAudioContext();
      if (enable === false || (enable === undefined && isAmbientPlaying)) {
        if (ambientGain) {
          ambientGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          setTimeout(() => {
            ambientOsc1?.stop();
            ambientOsc2?.stop();
            ambientOsc1 = null;
            ambientOsc2 = null;
            ambientGain = null;
            isAmbientPlaying = false;
          }, 600);
        }
        return false;
      } else {
        if (isAmbientPlaying) return true;

        ambientOsc1 = ctx.createOscillator();
        ambientOsc2 = ctx.createOscillator();
        ambientGain = ctx.createGain();

        ambientOsc1.type = 'sine';
        ambientOsc1.frequency.setValueAtTime(55, ctx.currentTime); // A1

        ambientOsc2.type = 'triangle';
        ambientOsc2.frequency.setValueAtTime(82.4, ctx.currentTime); // E2

        ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
        ambientGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2.0);

        ambientOsc1.connect(ambientGain);
        ambientOsc2.connect(ambientGain);
        ambientGain.connect(ctx.destination);

        ambientOsc1.start();
        ambientOsc2.start();
        isAmbientPlaying = true;
        return true;
      }
    } catch (e) {
      console.warn('Ambient toggle failed:', e);
      return false;
    }
  },

  isAmbientActive() {
    return isAmbientPlaying;
  },

  // Combat attack hit impact
  playAttackHit() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Critical hit sound
  playCritHit() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(600, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.25);

      osc2.frequency.setValueAtTime(900, now);
      osc2.frequency.exponentialRampToValueAtTime(240, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.32);
      osc2.stop(now + 0.32);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Shield block impact
  playShieldBlock() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Victory Fanfare
  playVictoryFanfare() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.95);
      });
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Defeat Collapse sound
  playDefeatGlitch() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const noise = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(35, now + 0.7);

      noise.gain.setValueAtTime(0.35, now);
      noise.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(noise);
      noise.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.95);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Spell cast magic chime
  playSpellChime() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [440, 660, 880, 1320];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.45);
      });
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Ethereal Mana Shrine Chime
  playShrineChime() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const freqs = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.09);
        gain.gain.setValueAtTime(0.12, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 1.25);
      });
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Dangerous Void Breach Rift
  playVoidBreach() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(25, now + 1.2);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(160, now);
      osc2.frequency.linearRampToValueAtTime(40, now + 1.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 1.45);
      osc2.stop(now + 1.45);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Unique Loot & Void Relic Fanfare
  playLootDrop() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.95);
      });
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Relic Equipment Chime
  playRelicEquip() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },

  // Void Radar / Ley-line Scanner Ping
  playVoidRadarPulse() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('Audio FX failed:', e);
    }
  },
};
