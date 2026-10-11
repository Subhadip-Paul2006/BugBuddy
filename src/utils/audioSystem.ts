/**
 * BugBuddy 8-Bit Web Audio Synthesizer & Chiptune Music Engine
 * 
 * 100% Pure Web Audio API — Zero external audio files or dependencies.
 * Synthesizes authentic retro 8-bit square, triangle, sawtooth, and noise waves.
 */

// Global Web Audio Context singleton (lazily initialized on first user interaction)
let audioCtx: AudioContext | null = null;
let musicInterval: number | null = null;
let currentTrackIndex = 0;
let isMusicActive = false;
let isSfxMuted = false;
let isMusicMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/* ==========================================================================
   Sound Effects (SFX) Synthesizers
   ========================================================================== */

let lastClickTime = 0;

/**
 * Play a crisp 8-bit button press blip
 */
export function playClickSound(): void {
  if (isSfxMuted) return;
  const nowMs = Date.now();
  if (nowMs - lastClickTime < 25) return;
  lastClickTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * Play an authentic 8-bit typewriter / keystroke tick
 */
export function playKeyStrokeSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  const now = ctx.currentTime;
  // Subtle pitch jitter between 700Hz and 950Hz
  const freq = 750 + Math.random() * 200;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
}

/**
 * Play a high-tech 8-bit weapon / language equip chime
 */
export function playEquipSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [330, 440, 660]; // E4 -> A4 -> E5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    const noteStart = now + idx * 0.045;
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.09, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 0.07);
  });
}

/**
 * Play a magical 8-bit sample bug code load arpeggio
 */
export function playLoadSampleSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Fast 5-note ascending arpeggio
  const chord = [261.63, 329.63, 392.00, 523.25, 659.25]; // C, E, G, C, E

  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const noteStart = now + idx * 0.04;
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.12, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 0.1);
  });
}

/**
 * Play a retro sweep down when clearing code
 */
export function playClearSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}

/**
 * Play a high-pitched double-chime XP or diamond pickup sound
 */
export function playXpGainSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [987.77, 1318.51]; // B5 -> E6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const noteStart = now + idx * 0.08;
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.14, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 0.13);
  });
}

/**
 * Play triumphant 8-bit level up celebration fanfare
 */
export function playLevelUpSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Classic fanfare notes: C4, E4, G4, C5, G4, C5
  const notes = [
    { f: 261.63, d: 0.09 },
    { f: 329.63, d: 0.09 },
    { f: 392.00, d: 0.09 },
    { f: 523.25, d: 0.18 },
    { f: 392.00, d: 0.09 },
    { f: 523.25, d: 0.35 },
  ];

  let offset = 0;
  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    const noteStart = now + offset;
    osc.frequency.setValueAtTime(n.f, noteStart);

    gain.gain.setValueAtTime(0.12, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + n.d);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + n.d + 0.01);

    offset += n.d;
  });
}

/**
 * Play a low glitch / compiler panic buzz
 */
export function playErrorSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.setValueAtTime(110, now + 0.06);

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

/**
 * Play a futuristic scanner / secret redaction blip
 */
export function playScanSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.linearRampToValueAtTime(1200, now + 0.07);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * Play a menacing boss roar sound (synthesized sawtooth sweep with resonance)
 */
export function playBossRoarSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'triangle';

  // Deep pitch sweep downwards with guttural growl
  osc1.frequency.setValueAtTime(140, now);
  osc1.frequency.linearRampToValueAtTime(65, now + 0.6);

  osc2.frequency.setValueAtTime(70, now);
  osc2.frequency.linearRampToValueAtTime(45, now + 0.6);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.65);
  osc2.stop(now + 0.65);
}

/**
 * Play dragon breath attack sound (filtered white noise burst)
 */
export function playDragonBreathSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.45);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.linearRampToValueAtTime(300, now + 0.45);
  filter.Q.setValueAtTime(3.0, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.45);
}

/**
 * Play crisp sword slash sound
 */
export function playSwordSlashSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.14);
}

/**
 * Play boss victory fanfare (triumphant retro arpeggio)
 */
export function playBossVictoryFanfare(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 261.63, time: 0.0, dur: 0.12 }, // C4
    { freq: 329.63, time: 0.12, dur: 0.12 }, // E4
    { freq: 392.00, time: 0.24, dur: 0.12 }, // G4
    { freq: 523.25, time: 0.36, dur: 0.22 }, // C5
    { freq: 659.25, time: 0.58, dur: 0.18 }, // E5
    { freq: 783.99, time: 0.76, dur: 0.45 }, // G5
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.12, now + time);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
  });
}

/**
 * Play cute companion chirp / poke sound
 */
export function playPetChirpSound(): void {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // First chirp
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

  gain1.gain.setValueAtTime(0.12, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.08);

  // Second chirp (higher pitched)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1320, now + 0.09);
  osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.18);

  gain2.gain.setValueAtTime(0.12, now + 0.09);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.09);
  osc2.stop(now + 0.18);
}

/* ==========================================================================
   Chiptune Music Engine (Short Retro Melodies & Themes)
   ========================================================================== */

export interface MusicTrack {
  id: string;
  name: string;
  tempo: number; // in BPM
  notes: { note: number; duration: number; type?: OscillatorType }[];
}

// Frequency helpers
const N = {
  REST: 0,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
};

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'base-camp',
    name: 'Base Camp Daybreak (8-Bit)',
    tempo: 136,
    notes: [
      { note: N.E4, duration: 1 }, { note: N.G4, duration: 1 }, { note: N.B4, duration: 1 }, { note: N.D5, duration: 1 },
      { note: N.C5, duration: 2 }, { note: N.A4, duration: 1 }, { note: N.REST, duration: 1 },
      { note: N.G4, duration: 1 }, { note: N.A4, duration: 1 }, { note: N.C5, duration: 1 }, { note: N.E5, duration: 1 },
      { note: N.D5, duration: 3 }, { note: N.REST, duration: 1 },
      { note: N.B4, duration: 1 }, { note: N.C5, duration: 1 }, { note: N.D5, duration: 1 }, { note: N.G4, duration: 1 },
      { note: N.E5, duration: 2 }, { note: N.C5, duration: 2 },
      { note: N.A4, duration: 1 }, { note: N.G4, duration: 1 }, { note: N.E4, duration: 1 }, { note: N.D4, duration: 1 },
      { note: N.C4, duration: 4 },
    ],
  },
  {
    id: 'confession-dungeon',
    name: 'Syntactic Crypt (Dungeon)',
    tempo: 110,
    notes: [
      { note: N.A3, duration: 2, type: 'triangle' }, { note: N.C4, duration: 1 }, { note: N.E4, duration: 1 },
      { note: N.D4, duration: 2 }, { note: N.B3, duration: 2 },
      { note: N.C4, duration: 1 }, { note: N.E4, duration: 1 }, { note: N.A4, duration: 2 },
      { note: N.G4, duration: 2 }, { note: N.E4, duration: 2 },
      { note: N.F4, duration: 2 }, { note: N.D4, duration: 2 },
      { note: N.E4, duration: 3 }, { note: N.REST, duration: 1 },
      { note: N.A3, duration: 4, type: 'triangle' },
    ],
  },
  {
    id: 'cyber-glitch',
    name: 'Cyber Voxel Pulse',
    tempo: 150,
    notes: [
      { note: N.C4, duration: 1 }, { note: N.C4, duration: 1 }, { note: N.G4, duration: 1 }, { note: N.A4, duration: 1 },
      { note: N.F4, duration: 1 }, { note: N.A4, duration: 1 }, { note: N.C5, duration: 2 },
      { note: N.B4, duration: 1 }, { note: N.G4, duration: 1 }, { note: N.E4, duration: 2 },
      { note: N.D4, duration: 1 }, { note: N.E4, duration: 1 }, { note: N.F4, duration: 1 }, { note: N.G4, duration: 1 },
      { note: N.A4, duration: 2 }, { note: N.C5, duration: 2 },
    ],
  },
];

let currentNoteIndex = 0;

/**
 * Play a single note in the background chiptune sequence
 */
function playChiptuneStep(): void {
  if (!isMusicActive || isMusicMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const track = MUSIC_TRACKS[currentTrackIndex];
  if (!track || !track.notes.length) return;

  const item = track.notes[currentNoteIndex];
  const beatDuration = (60 / track.tempo) * item.duration;

  if (item.note > 0) {
    const now = ctx.currentTime;
    
    // Lead Voice
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = item.type || 'square';
    osc.frequency.setValueAtTime(item.note, now);

    // Warm retro envelope
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 0.95);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + beatDuration);

    // Bass / Harmony arpeggio backing voice
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(item.note * 0.5, now);
    bassGain.gain.setValueAtTime(0.035, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 0.9);

    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + beatDuration);
  }

  currentNoteIndex = (currentNoteIndex + 1) % track.notes.length;
  musicInterval = window.setTimeout(playChiptuneStep, beatDuration * 1000);
}

/**
 * Start playing 8-bit background chiptune music
 */
export function startMusic(trackIdx?: number): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }

  if (typeof trackIdx === 'number' && trackIdx >= 0 && trackIdx < MUSIC_TRACKS.length) {
    currentTrackIndex = trackIdx;
    currentNoteIndex = 0;
  }

  stopMusic();
  isMusicActive = true;
  isMusicMuted = false;
  playChiptuneStep();
}

/**
 * Stop background chiptune music
 */
export function stopMusic(): void {
  isMusicActive = false;
  if (musicInterval !== null) {
    clearTimeout(musicInterval);
    musicInterval = null;
  }
}

/**
 * Toggle music playback (Start / Stop)
 */
export function toggleMusic(): boolean {
  if (isMusicActive) {
    stopMusic();
    return false;
  } else {
    startMusic();
    return true;
  }
}

/**
 * Cycle to next music track
 */
export function nextMusicTrack(): string {
  currentTrackIndex = (currentTrackIndex + 1) % MUSIC_TRACKS.length;
  currentNoteIndex = 0;
  if (isMusicActive) {
    startMusic(currentTrackIndex);
  }
  return MUSIC_TRACKS[currentTrackIndex].name;
}

/**
 * Get current track info
 */
export function getCurrentTrack(): MusicTrack {
  return MUSIC_TRACKS[currentTrackIndex];
}

/**
 * Is music currently playing
 */
export function isMusicPlaying(): boolean {
  return isMusicActive;
}

/**
 * Set SFX mute state
 */
export function setSfxMuted(muted: boolean): void {
  isSfxMuted = muted;
}

/**
 * Set Music mute state
 */
export function setMusicMuted(muted: boolean): void {
  isMusicMuted = muted;
  if (muted) {
    stopMusic();
  }
}
