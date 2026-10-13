// Entrada: teclado + botões de toque (multitoque). Toques rápidos ficam "travados" 1 frame para não se perderem.
const capture = (el, id) => { try { el.setPointerCapture(id); } catch { /* id sintético */ } };
const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyA: 'lp', KeyS: 'hp',
  KeyZ: 'lk', KeyX: 'hk', KeyD: 'sp', KeyC: 'su', KeyL: 'L', KeyP: 'start', Enter: 'start', Space: 'start', Escape: 'back', Backspace: 'back' };
const ALL = ['left', 'right', 'up', 'down', 'lp', 'hp', 'lk', 'hk', 'sp', 'su', 'L', 'start', 'back', 'tapc'];

export class Controller {
  constructor() { this.held = {}; this.prev = {}; }
  pressed(k) { return !!this.held[k] && !this.prev[k]; }
  step() { this.prev = this.held; this.held = {}; }
}

export function setupInput({ onGesture, onMute }) {
  const kb = {}, tch = {}, tap = {}, dpad = {};
  addEventListener('keydown', e => {
    if (e.code === 'KeyM') { onMute(); return; }
    const k = KEYS[e.code];
    if (!k) return;
    e.preventDefault(); onGesture();
    if (!e.repeat) tap[k] = true;
    kb[k] = true;
  });
  addEventListener('keyup', e => { const k = KEYS[e.code]; if (k) kb[k] = false; });
  addEventListener('blur', () => { for (const k in kb) kb[k] = false; });

  const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (touch) document.body.classList.add('touch');

  // direcional de 8 posições
  const pad = document.getElementById('dpad'), knob = pad && pad.querySelector('.knob');
  let padId = null;
  const setDir = e => {
    const r = pad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    for (const k of ['left', 'right', 'up', 'down']) dpad[k] = false;
    const d = Math.hypot(dx, dy);
    if (d > r.width * 0.12) {
      const sec = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
      const map = [['right'], ['right', 'down'], ['down'], ['down', 'left'], ['left'], ['left', 'up'], ['up'], ['up', 'right']][sec];
      for (const k of map) { if (!dpad[k]) tap[k] = true; dpad[k] = true; }
    }
    const m = Math.min(d, r.width * 0.3) / (d || 1);
    if (knob) knob.style.transform = `translate(${dx * m}px, ${dy * m}px)`;
  };
  const padEnd = e => { if (e.pointerId !== padId) return; padId = null; for (const k of ['left', 'right', 'up', 'down']) dpad[k] = false; if (knob) knob.style.transform = ''; };
  if (pad) {
    pad.addEventListener('pointerdown', e => { e.preventDefault(); onGesture(); padId = e.pointerId; capture(pad, e.pointerId); setDir(e); });
    pad.addEventListener('pointermove', e => { if (e.pointerId === padId) setDir(e); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(ev, padEnd);
  }
  for (const b of document.querySelectorAll('[data-k]')) {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); onGesture(); capture(b, e.pointerId); tch[k] = (tch[k] || 0) + 1; tap[k] = true; b.classList.add('on'); });
    const up = () => { tch[k] = Math.max(0, (tch[k] || 0) - 1); if (!tch[k]) b.classList.remove('on'); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  }
  document.getElementById('game').addEventListener('pointerdown', () => { onGesture(); tap.tapc = true; });

  return {
    read(ctl) {
      const h = {};
      for (const k of ALL) h[k] = !!(kb[k] || tch[k] || dpad[k] || tap[k]);
      for (const k in tap) tap[k] = false;
      ctl.held = h;
    },
  };
}
