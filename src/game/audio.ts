// Moteur audio entièrement procédural via la Web Audio API.
// Aucune ressource externe : musique d'ambiance et effets sont synthétisés.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;

let musicTimer: number | null = null;
let musicStep = 0;
let musicPlaying = false;

let soundEnabled = true;
let musicEnabled = true;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0;
    musicGain.connect(masterGain);
  }
  return ctx;
}

export function resumeAudio() {
  const c = ensureContext();
  if (c && c.state === "suspended") {
    c.resume();
  }
}

export function setSoundEnabled(v: boolean) {
  soundEnabled = v;
}
export function setMusicEnabled(v: boolean) {
  musicEnabled = v;
  if (!musicGain || !ctx) return;
  const now = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.linearRampToValueAtTime(v ? 0.14 : 0.0, now + 0.6);
  if (v && !musicPlaying) startMusic();
}

export function isSoundEnabled() {
  return soundEnabled;
}
export function isMusicEnabled() {
  return musicEnabled;
}

// ---------- Effets sonores ----------

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.5,
  attack = 0.005,
  detune = 0
) {
  const c = ensureContext();
  if (!c || !sfxGain || !soundEnabled) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  osc.connect(g);
  g.connect(sfxGain);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

// Son de pose d'un pion
export function playPlace() {
  tone(330, 0.12, "triangle", 0.4, 0.004);
  tone(165, 0.18, "sine", 0.3, 0.004);
}

// Son d'un retournement (joué en cascade avec un décalage par pion)
export function playFlip(index = 0) {
  const c = ensureContext();
  if (!c || !soundEnabled) return;
  const base = 520 + index * 28;
  window.setTimeout(() => {
    tone(base, 0.09, "sine", 0.25, 0.003);
    tone(base * 1.5, 0.06, "triangle", 0.12, 0.003);
  }, index * 60);
}

// Coup de l'IA, légèrement plus grave
export function playAIPlace() {
  tone(220, 0.14, "sawtooth", 0.22, 0.004);
  tone(110, 0.2, "sine", 0.25, 0.004);
}

// Survol / coup invalide
export function playHover() {
  tone(660, 0.05, "sine", 0.08, 0.002);
}
export function playInvalid() {
  tone(140, 0.18, "square", 0.2, 0.004);
}

// Victoire : petit arpège ascendant
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) =>
    window.setTimeout(() => tone(f, 0.35, "triangle", 0.4, 0.01), i * 130)
  );
}
// Défaite : arpège descendant
export function playLose() {
  const notes = [440, 349.23, 293.66, 220];
  notes.forEach((f, i) =>
    window.setTimeout(() => tone(f, 0.4, "sine", 0.35, 0.01), i * 150)
  );
}
// Clic d'interface
export function playClick() {
  tone(880, 0.04, "square", 0.12, 0.002);
}

// ---------- Musique d'ambiance procédurale ----------
// Boucle douce et atmosphérique sur une gamme pentatonique mineure.

const SCALE = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25, 587.33];
// Progression d'accords (degrés de la gamme) façon ambient lo-fi.
const PROGRESSION = [
  [0, 2, 4],
  [1, 3, 5],
  [3, 5, 7],
  [2, 4, 6],
];

function playPad(freqs: number[], duration: number) {
  const c = ensureContext();
  if (!c || !musicGain) return;
  const now = c.currentTime;
  freqs.forEach((freq) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 8;
    osc.connect(filter);
    filter.connect(g);
    g.connect(musicGain!);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.18, now + duration * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  });
}

function playMelodyNote() {
  const c = ensureContext();
  if (!c || !musicGain) return;
  if (Math.random() < 0.4) return; // notes espacées
  const note = SCALE[Math.floor(Math.random() * SCALE.length)] * 2;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.value = note;
  osc.connect(g);
  g.connect(musicGain!);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
  osc.start(now);
  osc.stop(now + 1.5);
}

export function startMusic() {
  const c = ensureContext();
  if (!c || !musicGain) return;
  if (musicPlaying) return;
  musicPlaying = true;
  if (musicEnabled) {
    const now = c.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.linearRampToValueAtTime(0.14, now + 1.2);
  }
  const stepMs = 2600;
  const tick = () => {
    const chord = PROGRESSION[musicStep % PROGRESSION.length];
    const freqs = chord.map((d) => SCALE[d]);
    playPad(freqs, stepMs / 1000);
    // quelques notes de mélodie par accord
    playMelodyNote();
    window.setTimeout(playMelodyNote, 900);
    window.setTimeout(playMelodyNote, 1700);
    musicStep++;
  };
  tick();
  musicTimer = window.setInterval(tick, stepMs);
}

export function stopMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  musicPlaying = false;
  if (musicGain && ctx) {
    const now = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.linearRampToValueAtTime(0.0, now + 0.5);
  }
}
