// Som 100% sintetizado em WebAudio (efeitos + loop chiptune). Sem arquivo de áudio.
let ac = null, master, sfxG, musG, muted = false, silent = false, step = 0, nextT = 0;

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
  sfxG = ac.createGain(); sfxG.gain.value = 0.9; sfxG.connect(master);
  musG = ac.createGain(); musG.gain.value = 0.22; musG.connect(master);
  startMusic();
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ac.currentTime, 0.02);
  return muted;
}
export const isMuted = () => muted;
export function setSilent(v) { silent = v; }   // usado pela simulação de partidas (sem som)

function tone(type, f0, f1, dur, vol, dest = sfxG, at = 0) {
  if (!ac) return;
  const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
}
let noiseBuf = null;
function getNoise() {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
// rugido da torcida: ruído filtrado que cresce e some (sem voz gravada)
function roar(dur, vol, at = 0) {
  if (!ac) return;
  const t = ac.currentTime + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = getNoise(); s.loop = true; f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.6;
  g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.25); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + dur + 0.05);
}
function noise(dur, vol, freq, ftype = 'lowpass', at = 0, dest = sfxG) {
  if (!ac) return;
  const t = ac.currentTime + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = getNoise(); f.type = ftype; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
}

const SFX = {
  light() { noise(0.07, 0.6, 2600); tone('square', 240, 70, 0.07, 0.25); },
  heavy() { noise(0.16, 0.9, 1400); tone('square', 160, 40, 0.18, 0.4); },
  block() { tone('square', 1300, 900, 0.05, 0.18); noise(0.05, 0.3, 5000, 'highpass'); },
  whoosh() { noise(0.1, 0.25, 1100, 'bandpass'); },
  jump() { tone('square', 200, 420, 0.08, 0.08); },
  land() { noise(0.06, 0.25, 500); },
  proj() { tone('sawtooth', 280, 900, 0.22, 0.2); noise(0.2, 0.2, 2000, 'bandpass'); },
  super() { for (let i = 0; i < 4; i++) tone('square', 330 * (1 + i * 0.25), 660 * (1 + i * 0.25), 0.12, 0.18, sfxG, i * 0.07); noise(0.5, 0.4, 3000, 'bandpass', 0.2); },
  ko() { tone('sawtooth', 700, 40, 1.1, 0.4); noise(0.7, 0.6, 900); tone('square', 120, 30, 0.9, 0.3); },
  round() { tone('square', 523, 523, 0.12, 0.2); tone('square', 659, 659, 0.18, 0.2, sfxG, 0.12); },
  fight() { [262, 330, 392, 523].forEach((f, i) => tone('sawtooth', f, f * 1.01, 0.5, 0.12, sfxG, 0)); noise(0.3, 0.5, 4000, 'highpass'); tone('square', 1046, 2093, 0.25, 0.12, sfxG, 0.05); },
  select() { tone('square', 880, 880, 0.04, 0.12); },
  confirm() { tone('square', 660, 660, 0.06, 0.15); tone('square', 990, 990, 0.1, 0.15, sfxG, 0.06); },
  deny() { tone('square', 200, 150, 0.12, 0.15); },
  charge() { tone('sawtooth', 200, 1200, 0.35, 0.15); tone('square', 400, 1600, 0.35, 0.08, sfxG, 0.05); },
  wave() { noise(0.5, 0.6, 1800, 'bandpass'); tone('sawtooth', 900, 120, 0.5, 0.25); },
  rise() { tone('square', 300, 1100, 0.15, 0.18); noise(0.12, 0.3, 3000, 'bandpass'); },
  nomana() { tone('square', 180, 120, 0.08, 0.12); tone('square', 140, 100, 0.1, 0.12, sfxG, 0.09); },
  finish() { [392, 370, 349, 330].forEach((f, i) => tone('sawtooth', f, f, 0.22, 0.14, sfxG, i * 0.2)); noise(0.6, 0.3, 600, 'lowpass', 0); },
  cheer() { roar(1.4, 0.35); },
  triumph() {
    [523, 659, 784, 1046].forEach((f, i) => tone('square', f, f, 0.18, 0.14, sfxG, i * 0.13));
    [523, 659, 784].forEach(f => tone('square', f, f * 1.002, 1.4, 0.07, sfxG, 0.55));
    roar(2.4, 0.4, 0.3);
  },
  heal() { [660, 880, 1100, 1320].forEach((f, i) => tone('sine', f, f, 0.2, 0.12, sfxG, i * 0.07)); },
  shield() { tone('triangle', 500, 1000, 0.3, 0.18); noise(0.3, 0.15, 6000, 'highpass'); },
  pause() { tone('square', 523, 523, 0.06, 0.12); tone('square', 392, 392, 0.08, 0.12, sfxG, 0.07); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone('square', f, f, 0.16, 0.15, sfxG, i * 0.12)); },
};
export function sfx(name) { if (ac && !silent && SFX[name]) SFX[name](); }

// ---------- música: loop de 4 compassos, 16 passos por compasso ----------
// tema heroico em Dó maior (I–V–vi–IV), marcha de vitória
const BPM = 132, STEP = 60 / BPM / 4;
const ROOTS = [48, 43, 45, 41];                       // Dó, Sol, Lá, Fá
const BASS = [0, -1, 0, 12, -1, 0, 12, -1, 0, -1, 0, 12, -1, 0, 7, 12];
const LEAD = [
  67, -1, 72, -1, 76, -1, 79, -1, 79, -1, 76, -1, 79, -1, -1, -1,
  67, -1, 71, -1, 74, -1, 79, -1, 74, -1, 71, -1, 74, -1, -1, -1,
  69, -1, 72, -1, 76, -1, 81, -1, 79, -1, 76, -1, 72, -1, -1, -1,
  65, -1, 69, -1, 72, -1, 77, -1, 76, -1, 74, -1, 72, -1, 71, -1,
];
const freq = m => 440 * Math.pow(2, (m - 69) / 12);

function note(type, m, at, dur, vol) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq(m);
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  o.connect(g); g.connect(musG); o.start(at); o.stop(at + dur + 0.02);
}
function schedule() {
  while (nextT < ac.currentTime + 0.12) {
    const bar = (step >> 4) & 3, s = step & 15;
    const b = BASS[s];
    if (b >= 0) note('triangle', ROOTS[bar] + b - 12, nextT, STEP * 0.9, 0.5);
    if (b >= 0 && s % 4 === 0) note('square', ROOTS[bar] + b, nextT, STEP * 0.5, 0.12);
    const l = LEAD[step & 63];
    if (l > 0) note('square', l, nextT, STEP * 1.6, 0.1);
    if (s % 2 === 1) { // chimbal
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = getNoise(); f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(0.12, nextT); g.gain.exponentialRampToValueAtTime(0.001, nextT + 0.04);
      src.connect(f); f.connect(g); g.connect(musG); src.start(nextT); src.stop(nextT + 0.05);
    }
    if (s % 8 === 0) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, nextT); o.frequency.exponentialRampToValueAtTime(40, nextT + 0.12); g.gain.setValueAtTime(0.5, nextT); g.gain.exponentialRampToValueAtTime(0.001, nextT + 0.14); o.connect(g); g.connect(musG); o.start(nextT); o.stop(nextT + 0.16); }
    nextT += STEP; step++;
  }
}
function startMusic() { nextT = ac.currentTime + 0.1; setInterval(schedule, 30); }
