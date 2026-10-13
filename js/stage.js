// Cenário: Copacabana à noite, pixel art procedural, parallax de 2 camadas + chão.
import { STAGE_W, GROUND } from './fighter.js';

const W = 384, H = 216;
const FAR_F = 0.3, MID_F = 0.6;
const MID_W = Math.ceil(W + (STAGE_W - W) * MID_F);
const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

const twinkles = [], blinkers = [];
function buildSky() {
  const cv = canvas(W, 140), c = cv.getContext('2d');
  const bands = ['#07061a', '#0b0922', '#100c2c', '#161036', '#1e1440', '#291849', '#371d52', '#482458', '#5a2b5c'];
  const bh = 13;
  for (let i = 0; i < bands.length; i++) {
    px(c, 0, i * bh, W, bh, bands[i]);
    if (i + 1 < bands.length) for (let x = 0; x < W; x += 2) { px(c, x + (i & 1), (i + 1) * bh - 2, 1, 1, bands[i + 1]); px(c, x + 1 - (i & 1), (i + 1) * bh - 4, 1, 1, bands[i + 1]); }
  }
  px(c, 0, bands.length * bh, W, 140 - bands.length * bh, bands[bands.length - 1]);
  for (let i = 0; i < 80; i++) px(c, (rnd() * W) | 0, (rnd() * 85) | 0, 1, 1, rnd() > 0.7 ? '#ffffff' : '#7f76b9');
  for (let i = 0; i < 18; i++) twinkles.push({ x: (rnd() * W) | 0, y: (rnd() * 70) | 0, ph: rnd() * 6 });
  // lua com halo pontilhado
  const mx = 306, my = 28;
  for (let y = -18; y <= 18; y++) for (let x = -18; x <= 18; x++) {
    const d = x * x + y * y;
    if (d > 100 && d <= 324 && ((x + y) & 1) && d < 170 + rnd() * 140) px(c, mx + x, my + y, 1, 1, '#3a3060');
  }
  for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) if (x * x + y * y <= 100) px(c, mx + x, my + y, 1, 1, x + y < -6 ? '#fffbe0' : x + y > 8 ? '#d9cfa4' : '#f3ecc8');
  px(c, mx - 4, my - 3, 3, 3, '#d9cfa4'); px(c, mx + 3, my + 2, 4, 3, '#d9cfa4'); px(c, mx - 1, my + 5, 2, 2, '#d9cfa4'); px(c, mx + 5, my - 5, 2, 2, '#e2d8ae');
  return cv;
}

function buildFar() {
  const w = Math.ceil(W + (STAGE_W - W) * FAR_F), cv = canvas(w, H), c = cv.getContext('2d');
  const hill = (cx, r, base, col, hi, sh) => {
    for (let x = -r; x <= r; x++) {
      const hgt = Math.round(Math.sqrt(1 - (x / r) ** 2) * r * 1.25);
      px(c, cx + x, base - hgt, 1, hgt, x < -r * 0.3 ? sh : col);
      px(c, cx + x, base - hgt, 1, 1, hi);
      if (rnd() < 0.3) px(c, cx + x, base - hgt + 3 + (rnd() * 10 | 0), 1, 1, sh);   // vegetação
    }
  };
  hill(40, 46, 112, '#1a1233', '#2f2350', '#140e29');
  hill(330, 30, 112, '#1d1438', '#3a2b5c', '#160f2c');            // Pão de Açúcar
  hill(388, 18, 112, '#1a1233', '#2f2350', '#140e29');
  for (let x = 0; x < 58; x++) px(c, 330 + x, 75 + Math.round(x * 0.36 + Math.sin(x / 18) * 3), 1, 1, '#6c6290');   // cabo do bondinho
  // prédios da orla com janelas
  let x = 0;
  while (x < w) {
    const bw = 10 + (rnd() * 18 | 0), bh = 12 + (rnd() * 28 | 0);
    const col = rnd() > 0.5 ? '#231a3c' : '#2a2045';
    px(c, x, 112 - bh, bw, bh, col); px(c, x, 112 - bh, 1, bh, '#33285a'); px(c, x, 112 - bh, bw, 1, '#3a2e64');
    if (rnd() < 0.3) px(c, x + 2, 112 - bh - 3, 1, 3, '#555');                         // antena
    for (let wy = 112 - bh + 3; wy < 110; wy += 4) for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
      const r = rnd();
      if (r > 0.55) {
        const lit = rnd() > 0.3 ? '#ffd36b' : '#fff1c2';
        if (rnd() < 0.12) blinkers.push({ x: wx, y: wy, col: lit, ph: rnd() * 6, sp: 0.01 + rnd() * 0.03 });
        else px(c, wx, wy, 1, 2, lit);
      } else if (r > 0.45) px(c, wx, wy, 1, 2, '#6a8cff55');
    }
    x += bw + 1;
  }
  return cv;
}

function buildGround() {
  const h = H - 176, cv = canvas(STAGE_W, h), c = cv.getContext('2d');
  const img = c.createImageData(STAGE_W, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < STAGE_W; x++) {
    // calçadão de Copacabana: ondas pretas e brancas paralelas à praia
    const wave = (y * 1.6 + 4 * Math.sin(x * Math.PI * 2 / 28)) / 5;
    const v = Math.floor(wave) & 1, edge = wave - Math.floor(wave) < 0.18;
    const shade = 1 - y / h * 0.2;
    let [r, g, b] = v ? [28, 24, 32] : [196, 188, 170];
    if (edge && !v) [r, g, b] = [150, 142, 128];
    if (((x * 7 + y * 13) % 23) === 0) { r += 12; g += 12; b += 12; }      // textura das pedras
    const i = (y * STAGE_W + x) * 4;
    img.data[i] = r * shade; img.data[i + 1] = g * shade; img.data[i + 2] = b * shade; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  px(c, 0, 0, STAGE_W, 2, '#6f6458'); px(c, 0, 2, STAGE_W, 1, '#3a342e');
  return cv;
}

// camada do meio: trio, palmeiras, postes e público
const crowd = [], palms = [40, 470], lamps = [130, 360];
function buildCrowd() {
  const shirts = ['#c8102e', '#e02a3a', '#ffffff', '#a50f24', '#1d1d1d', '#e8e0d0', '#d81e30', '#c8102e', '#f2f2f2'];
  const skins = ['#f0c39c', '#d99b6c', '#a8704a', '#7a4a2a', '#5a3420', '#e8b48a'];
  const hairs = ['#1a120c', '#3a2a1a', '#6a4a2a', '#c8c8c0', '#1a1a1a'];
  for (const [row, base] of [[0, 148], [1, 158], [2, 170]]) {
    for (let x = 2 + row * 3; x < MID_W; x += 7 + (rnd() * 3 | 0)) {
      crowd.push({
        x, base, row, shirt: shirts[rnd() * shirts.length | 0], skin: skins[rnd() * skins.length | 0], hair: hairs[rnd() * hairs.length | 0],
        ph: rnd() * 6.28, flag: rnd() < 0.14, look: rnd() * 5 | 0, act: rnd() * 4 | 0, kid: row === 0 && rnd() < 0.08,
        cap: ['#c8102e', '#ffffff', '#1d3a8a'][rnd() * 3 | 0],
      });
    }
  }
}

let sky, far, ground;
export function initStage() {
  seed = 7; twinkles.length = 0; blinkers.length = 0; crowd.length = 0;
  sky = buildSky(); far = buildFar(); ground = buildGround(); buildCrowd();
}

function drawTrio(c, ox, t, cheer) {
  const x = 190 - ox, y = 92;
  if (x > W + 10 || x < -140) return;
  // feixes de luz
  c.save(); c.globalAlpha = 0.1;
  for (let i = 0; i < 4; i++) {
    const a = Math.sin(t * 0.02 + i * 1.7) * 0.6, bx = x + 14 + i * 30;
    c.fillStyle = ['#ff3a4a', '#ffd23a', '#ffffff', '#ff7a1a'][i];
    c.beginPath(); c.moveTo(bx, y - 22); c.lineTo(bx + Math.sin(a) * 160 - 18, -10); c.lineTo(bx + Math.sin(a) * 160 + 18, -10); c.fill();
  }
  c.restore();
  // treliça e luzes
  px(c, x + 4, y - 24, 2, 26, '#555b6a'); px(c, x + 114, y - 24, 2, 26, '#555b6a'); px(c, x + 4, y - 24, 112, 2, '#555b6a');
  for (let i = 0; i < 8; i++) {
    const on = ((t >> 3) + i) % 3 === 0;
    px(c, x + 10 + i * 14, y - 22, 5, 4, on ? ['#ff3a4a', '#ffd23a', '#ffffff'][i % 3] : '#3a3a44');
  }
  // caminhão
  px(c, x, y, 120, 46, '#23232e'); px(c, x, y, 120, 2, '#3a3a4a'); px(c, x, y + 44, 120, 2, '#121218');
  for (let s = 0; s < 2; s++) {                                     // caixas de som
    const sx = x + 4 + s * 92;
    px(c, sx, y + 4, 24, 38, '#16161c');
    for (let k = 0; k < 3; k++) { px(c, sx + 6, y + 7 + k * 12, 12, 9, '#2c2c36'); px(c, sx + 10, y + 10 + k * 12, 4, 3, (t >> 2) % 3 === k ? '#55556a' : '#3c3c4a'); }
  }
  // telão de LED com equalizador
  const lx = x + 32, ly = y + 6;
  px(c, lx - 1, ly - 1, 58, 32, '#000'); px(c, lx, ly, 56, 30, '#0a0812');
  for (let b = 0; b < 14; b++) {
    const base = 4 + Math.round((Math.sin(t * 0.21 + b * 0.9) + Math.sin(t * 0.13 + b * 2.3) + 2) * 5.5);
    const hgt = cheer > 0 ? Math.min(28, base + Math.round(cheer * 10)) : base;
    for (let k = 0; k < hgt; k += 2) px(c, lx + 1 + b * 4, ly + 28 - k, 3, 1, k > 16 ? '#ffffff' : k > 10 ? '#ffd23a' : '#e8202e');
  }
  // banda (silhuetas)
  for (let i = 0; i < 3; i++) {
    const bx = x + 30 + i * 26, bob = ((t >> 3) + i) & 1;
    px(c, bx, y - 14 - bob, 6, 14, '#101018'); px(c, bx + 1, y - 19 - bob, 4, 5, '#101018');
  }
}

function drawPalm(c, x, t) {
  for (let i = 0; i < 26; i++) {
    const tx = x + Math.round(Math.sin(i / 9) * 6), ty = 166 - i * 3;
    px(c, tx, ty, 4, 3, i & 1 ? '#4a3626' : '#5a4430'); px(c, tx, ty, 1, 3, '#2e2018');
  }
  const cx = x + 6, cy = 88, sway = Math.round(Math.sin(t * 0.03) * 1.5);
  for (let f = 0; f < 7; f++) {
    const a = -Math.PI + f * (Math.PI / 6);
    for (let k = 0; k < 22; k++) {
      const fx = cx + Math.round(Math.cos(a) * k * 1.1) + (k > 8 ? sway : 0), fy = cy + Math.round(Math.sin(a) * k * 0.6 + (k * k) / 40);
      px(c, fx, fy, 2, 2, k % 3 ? '#1f4a2c' : '#2f6a3a');
    }
  }
  px(c, cx - 2, cy - 1, 5, 4, '#3a2a18');
}

function drawLamp(c, x) {
  for (let r = 4; r > 0; r--) { c.fillStyle = `rgba(255,190,90,${0.05 * (5 - r)})`; c.fillRect(x - r * 5 + 6, 96 - r * 4, r * 10, r * 8); }
  px(c, x, 96, 2, 72, '#5a5a66'); px(c, x, 96, 10, 2, '#5a5a66'); px(c, x + 6, 98, 6, 3, '#ffd88a');
}

export function drawStage(c, camX, t, dim = 0, cheer = 0) {
  c.drawImage(sky, 0, 0);
  for (const s of twinkles) if (Math.sin(t * 0.05 + s.ph) > 0.6) { px(c, s.x - 1, s.y, 3, 1, '#ffffff'); px(c, s.x, s.y - 1, 1, 3, '#ffffff'); }
  const fo = Math.round(camX * FAR_F);
  c.drawImage(far, -fo, 0);
  for (const b of blinkers) px(c, b.x - fo, b.y, 1, 2, Math.sin(t * b.sp + b.ph) > -0.2 ? b.col : '#2a2045');
  const g = 330 + Math.round(((t * 0.15) % 58)) - fo;                   // bondinho andando
  px(c, g, 75 + Math.round((g + fo - 330) * 0.36 + Math.sin((g + fo - 330) / 18) * 3) + 1, 4, 3, '#ffd36b');
  // mar com reflexo da lua
  px(c, 0, 112, W, 30, '#0d1636');
  for (let y = 114; y < 141; y += 3) px(c, 0, y, W, 1, '#101c40');
  for (let y = 114; y < 140; y += 3) for (let i = 0; i < 6; i++) {
    const x = 296 + Math.round(Math.sin(t * 0.05 + y + i * 3) * 8) + (i - 3) * 4 - Math.round(camX * 0.4);
    px(c, x, y, 3, 1, y < 125 ? '#f3ecc8' : '#a9a385');
  }
  if ((t >> 5) & 1) px(c, 60 - Math.round(camX * 0.35), 114, 2, 1, '#ff4a4a');      // luzes de barcos
  px(c, 200 - Math.round(camX * 0.35), 115, 2, 1, (t >> 4) & 1 ? '#7aff8a' : '#2a6a3a');
  for (let x = 0; x < W; x += 6) px(c, x + Math.round(Math.sin(t * 0.03 + x) * 2), 139 + ((x >> 3) & 1), 4, 1, '#cfd8ff');
  px(c, 0, 141, W, 35, '#5b4a35');                                       // areia à noite
  for (let x = 0; x < W; x += 5) px(c, x, 143 + (x * 7 % 30), 1, 1, '#6e5b42');
  // camada do meio
  const off = Math.round(camX * MID_F);
  drawTrio(c, off, t, cheer);
  for (const p of palms) drawPalm(c, p - off, t);
  for (const l of lamps) drawLamp(c, l - off);
  for (const p of crowd) {
    const x = p.x - off;
    if (x < -14 || x > W + 14) continue;
    const s = p.row === 2 ? 1 : 0;
    // público vibra (pula e ergue os braços) quando o Lula acerta
    const jump = cheer > 0 ? Math.round(Math.max(0, Math.sin(t * 0.3 + p.ph)) * (2 + cheer * 4))
      : p.act === 0 ? Math.round(Math.max(0, Math.sin(t * 0.18 + p.ph)) * 3) : Math.round(Math.max(0, Math.sin(t * 0.1 + p.ph)) * 1);
    const by = p.base - jump;
    px(c, x - 1, by - 9 - s, 7 + s, 10 + s, p.shirt); px(c, x - 1, by - 9 - s, 1, 10 + s, '#00000044');
    px(c, x, by - 15 - s, 5, 5, p.skin);
    if (p.look === 1) px(c, x - 1, by - 17 - s, 7, 3, p.cap);                       // boné
    else if (p.look === 2) { px(c, x, by - 16 - s, 5, 2, p.hair); px(c, x - 1, by - 15 - s, 2, 6, p.hair); }   // cabelo comprido
    else if (p.look !== 3) px(c, x, by - 16 - s, 5, 2, p.hair);                      // look 3 = careca
    if (p.kid) { px(c, x, by - 24, 5, 6, '#ffd23a'); px(c, x + 1, by - 28, 3, 4, p.skin); }   // criança no ombro
    const armUp = cheer > 0 || (p.act === 1 ? Math.sin(t * 0.08 + p.ph) > 0.2 : p.act === 0);
    if (p.act === 2 && cheer <= 0) { const cl = (t >> 3) & 1; px(c, x + 1 + cl, by - 11 - s, 2, 2, p.skin); px(c, x + 3 - cl, by - 11 - s, 2, 2, p.skin); }   // palmas
    else if (armUp) { px(c, x - 2, by - 17 - s, 2, 7, p.skin); px(c, x + 6 + s, by - 17 - s, 2, 7, p.skin); }
    if (p.act === 3) { px(c, x + 6, by - 20, 2, 9, p.skin); if (Math.sin(t * 0.07 + p.ph) > 0.3) px(c, x + 6, by - 22, 2, 2, '#ffffff'); }   // celular
    if (p.flag) {
      px(c, x + 7, by - 36, 1, 28, '#c9c2b0');
      for (let fx = 0; fx < 15; fx++) {
        const wy = Math.round(Math.sin(t * (cheer > 0 ? 0.35 : 0.18) + fx * 0.6 + p.ph) * 1.5);
        px(c, x + 8 + fx, by - 36 + wy, 1, 10, fx < 1 ? '#8c0c1f' : wy > 0 ? '#a50f24' : wy < 0 ? '#e83040' : '#c8102e');
      }
    }
  }
  px(c, 0, 168, W, 1, '#9a9aaa'); px(c, 0, 173, W, 1, '#6a6a7a');       // grade
  for (let x = -(off % 12); x < W; x += 12) px(c, x, 166, 1, 10, '#7a7a8a');
  c.drawImage(ground, -Math.round(camX), 176);
  if (dim) { c.fillStyle = `rgba(0,0,0,${dim})`; c.fillRect(0, 0, W, H); }
}

export { GROUND };
