// Cenário: Copacabana à noite em alta resolução (768×432), parallax de 2 camadas + calçadão.
// Tudo desenhado por código — sem imagem externa. As coordenadas internas são do canvas (hi-res); a entrada
// (camX) vem em unidades lógicas de 384×216 e o contexto chega com escala 2.
import { STAGE_W } from './fighter.js';

const W = 768, H = 432, SW = STAGE_W * 2;
const FAR_F = 0.3, MID_F = 0.6, HORIZON = 224;
const MID_W = Math.ceil(W + (SW - W) * MID_F);
const TAU = Math.PI * 2;

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const rr = (c, x, y, w, h, r, f) => { c.fillStyle = f; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };

const twinkles = [], blinkers = [], cars = [];

function buildSky() {
  const cv = canvas(W, HORIZON + 4), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, '#04031a'); g.addColorStop(0.3, '#0b0824'); g.addColorStop(0.55, '#1c1240'); g.addColorStop(0.78, '#3b1d56'); g.addColorStop(0.92, '#6a2c60'); g.addColorStop(1, '#a8485e');
  c.fillStyle = g; c.fillRect(0, 0, W, HORIZON + 4);
  for (let i = 0; i < 170; i++) {                               // estrelas
    const y = rnd() * 170, a = 0.3 + rnd() * 0.7, r = rnd() > 0.93 ? 1.6 : 0.9;
    c.fillStyle = `rgba(${rnd() > 0.7 ? '255,236,200' : '210,210,255'},${a})`; c.beginPath(); c.arc(rnd() * W, y, r, 0, TAU); c.fill();
  }
  for (let i = 0; i < 22; i++) twinkles.push({ x: rnd() * W, y: rnd() * 140, ph: rnd() * 6 });
  for (let i = 0; i < 5; i++) {                                 // nuvens finas
    const cx = rnd() * W, cy = 60 + rnd() * 120, w = 140 + rnd() * 200;
    const cg = c.createRadialGradient(cx, cy, 4, cx, cy, w / 2); cg.addColorStop(0, 'rgba(120,80,150,.22)'); cg.addColorStop(1, 'rgba(120,80,150,0)');
    c.save(); c.translate(cx, cy); c.scale(1, 0.14); c.translate(-cx, -cy); c.fillStyle = cg; c.beginPath(); c.arc(cx, cy, w / 2, 0, TAU); c.fill(); c.restore();
  }
  // lua com halo
  const mx = 612, my = 58;
  const halo = c.createRadialGradient(mx, my, 20, mx, my, 120); halo.addColorStop(0, 'rgba(255,244,200,.35)'); halo.addColorStop(0.4, 'rgba(255,230,170,.1)'); halo.addColorStop(1, 'rgba(255,230,170,0)');
  c.fillStyle = halo; c.fillRect(mx - 130, my - 130, 260, 260);
  const mg = c.createRadialGradient(mx - 6, my - 6, 2, mx, my, 22); mg.addColorStop(0, '#fffbe8'); mg.addColorStop(0.7, '#f3ecc8'); mg.addColorStop(1, '#d6cb9c');
  c.fillStyle = mg; c.beginPath(); c.arc(mx, my, 22, 0, TAU); c.fill();
  c.fillStyle = 'rgba(190,176,130,.55)'; for (const [dx, dy, r] of [[-7, -5, 5], [8, 6, 6], [-2, 11, 3.4], [10, -9, 3]]) { c.beginPath(); c.arc(mx + dx, my + dy, r, 0, TAU); c.fill(); }
  return cv;
}

function buildFar() {
  const w = Math.ceil(W + (SW - W) * FAR_F), cv = canvas(w, H), c = cv.getContext('2d');
  const hill = (path, c1, c2, rim) => {
    const g = c.createLinearGradient(0, 100, 0, HORIZON); g.addColorStop(0, c1); g.addColorStop(1, c2);
    c.fillStyle = g; c.fill(path); c.strokeStyle = rim; c.lineWidth = 2; c.stroke(path);
  };
  // morros ao fundo (esquerda) — Dois Irmãos
  let p = new Path2D(); p.moveTo(-20, HORIZON); p.lineTo(-20, 150); p.bezierCurveTo(30, 140, 50, 70, 86, 66); p.bezierCurveTo(110, 66, 120, 100, 134, 98); p.bezierCurveTo(150, 94, 160, 120, 190, 150); p.bezierCurveTo(230, 170, 250, 200, 290, HORIZON); p.closePath();
  hill(p, '#251a48', '#150f30', '#3a2c66');
  // Pão de Açúcar e Morro da Urca (direita)
  p = new Path2D(); p.moveTo(560, HORIZON); p.bezierCurveTo(566, 170, 590, 150, 610, 150); p.bezierCurveTo(640, 150, 656, 190, 674, HORIZON); p.closePath();
  hill(p, '#2a1f50', '#18102f', '#43356f');
  p = new Path2D(); p.moveTo(640, HORIZON); p.bezierCurveTo(650, 140, 690, 64, 750, 56); p.bezierCurveTo(800, 56, 830, 120, 846, HORIZON); p.closePath();
  hill(p, '#2f2358', '#150e2c', '#4c3c7e');
  c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(752, 58); c.bezierCurveTo(800, 62, 826, 118, 834, 160); c.lineTo(796, 160); c.bezierCurveTo(790, 110, 776, 80, 752, 58); c.fill();
  c.strokeStyle = 'rgba(120,200,120,.18)'; c.lineWidth = 1.4;                       // vegetação
  for (let i = 0; i < 70; i++) { const x = 650 + rnd() * 190, y = 90 + rnd() * 120; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y + 4); c.stroke(); }
  c.strokeStyle = '#8c80b4'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(618, 152); c.quadraticCurveTo(690, 118, 752, 62); c.stroke();   // cabo do bondinho
  // orla: prédios com janelas
  let x = -4;
  while (x < w) {
    const bw = 22 + (rnd() * 34 | 0), bh = 26 + (rnd() * 70 | 0);
    const g = c.createLinearGradient(x, HORIZON - bh, x + bw, HORIZON); const base = rnd() > 0.5 ? ['#2a2046', '#1b1432'] : ['#31254f', '#1f1738'];
    g.addColorStop(0, base[0]); g.addColorStop(1, base[1]);
    c.fillStyle = g; c.fillRect(x, HORIZON - bh, bw, bh);
    c.fillStyle = 'rgba(140,120,220,.22)'; c.fillRect(x, HORIZON - bh, 2, bh); c.fillRect(x, HORIZON - bh, bw, 2);
    if (rnd() < 0.35) { c.fillStyle = '#555'; c.fillRect(x + bw / 2, HORIZON - bh - 8, 2, 8); blinkers.push({ x: x + bw / 2, y: HORIZON - bh - 10, col: '#ff3a3a', ph: rnd() * 6, sp: 0.04, r: 1.6 }); }
    for (let wy = HORIZON - bh + 7; wy < HORIZON - 5; wy += 9) for (let wx = x + 5; wx < x + bw - 5; wx += 7) {
      const r = rnd();
      if (r > 0.52) {
        const lit = rnd() > 0.3 ? '#ffd36b' : '#fff1c2';
        if (rnd() < 0.1) blinkers.push({ x: wx, y: wy, col: lit, ph: rnd() * 6, sp: 0.01 + rnd() * 0.03, r: 0 });
        else { c.fillStyle = lit; c.fillRect(wx, wy, 3, 4); c.fillStyle = 'rgba(255,200,100,.25)'; c.fillRect(wx - 1, wy - 1, 5, 6); }
      } else if (r > 0.42) { c.fillStyle = 'rgba(106,140,255,.35)'; c.fillRect(wx, wy, 3, 4); }
    }
    x += bw + 2 + (rnd() * 3 | 0);
  }
  return cv;
}

function buildGround() {
  const h = H - 352, cv = canvas(SW, h), c = cv.getContext('2d');
  const img = c.createImageData(SW, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < SW; x++) {
    // calçadão de Copacabana: ondas pretas e brancas paralelas à praia, com borda suave
    const wave = (y * 0.8 + 4 * Math.sin(x * TAU / 56)) / 5, fr = wave - Math.floor(wave), v = Math.floor(wave) & 1;
    const edge = Math.min(fr, 1 - fr), aa = Math.min(1, edge / 0.07);
    const light = 1 - y / h * 0.32;
    let r, g, b;
    if (v) { r = 30; g = 26; b = 34; } else { r = 204; g = 196; b = 178; }
    if (edge < 0.1) { r = r * 0.8 + 20; g = g * 0.8 + 18; b = b * 0.8 + 16; }
    const grain = ((x * 7 + y * 13) % 11 === 0) ? 10 : (x * 3 + y * 5) % 7 === 0 ? -6 : 0;
    const i = (y * SW + x) * 4;
    img.data[i] = (r + grain) * light * (0.85 + aa * 0.15); img.data[i + 1] = (g + grain) * light * (0.85 + aa * 0.15); img.data[i + 2] = (b + grain) * light * (0.85 + aa * 0.15); img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, 30); g.addColorStop(0, 'rgba(10,6,20,.55)'); g.addColorStop(1, 'rgba(10,6,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, SW, 30);                                          // sombra da grade
  c.fillStyle = '#7a6f62'; c.fillRect(0, 0, SW, 3); c.fillStyle = '#3a342e'; c.fillRect(0, 3, SW, 2);
  // luz quente dos postes no chão
  for (const lx of [260, 720]) { const lg = c.createRadialGradient(lx, 18, 4, lx, 18, 160); lg.addColorStop(0, 'rgba(255,200,120,.22)'); lg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = lg; c.fillRect(lx - 170, 0, 340, h); }
  return cv;
}

function buildSand() {
  const cv = canvas(W, 70), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 70); g.addColorStop(0, '#6b573d'); g.addColorStop(1, '#3c2f21');
  c.fillStyle = g; c.fillRect(0, 0, W, 70);
  for (let i = 0; i < 500; i++) { c.fillStyle = rnd() > 0.5 ? 'rgba(150,126,90,.5)' : 'rgba(30,20,10,.4)'; c.fillRect(rnd() * W, rnd() * 70, 1.6, 1.6); }
  return cv;
}

// camada do meio: trio elétrico, palmeiras, postes e público
const crowd = [], palms = [80, 940], lamps = [260, 720];
function buildCrowd() {
  const shirts = ['#c8102e', '#e02a3a', '#ffffff', '#a50f24', '#2a2a30', '#e8e0d0', '#d81e30', '#c8102e', '#f2f2f2', '#2f5fb0'];
  const skins = ['#f0c39c', '#d99b6c', '#a8704a', '#7a4a2a', '#5a3420', '#e8b48a'];
  const hairs = ['#1a120c', '#3a2a1a', '#6a4a2a', '#c8c8c0', '#1a1a1a'];
  for (const [row, base] of [[0, 296], [1, 316], [2, 340]]) {
    for (let x = 4 + row * 6; x < MID_W; x += 15 + (rnd() * 6 | 0)) {
      crowd.push({
        x, base, row, shirt: shirts[rnd() * shirts.length | 0], skin: skins[rnd() * skins.length | 0], hair: hairs[rnd() * hairs.length | 0],
        ph: rnd() * 6.28, flag: rnd() < 0.14, look: rnd() * 5 | 0, act: rnd() * 4 | 0, kid: row === 0 && rnd() < 0.08,
        cap: ['#c8102e', '#ffffff', '#1d3a8a'][rnd() * 3 | 0],
      });
    }
  }
}

let sky, far, ground, sand;
export function initStage() {
  seed = 7; twinkles.length = 0; blinkers.length = 0; crowd.length = 0;
  sky = buildSky(); far = buildFar(); ground = buildGround(); sand = buildSand(); buildCrowd();
}

function drawTrio(c, ox, t, cheer) {
  const x = 380 - ox, y = 184;
  if (x > W + 20 || x < -280) return;
  c.save(); c.globalAlpha = 0.11;                                   // feixes de luz
  for (let i = 0; i < 5; i++) {
    const a = Math.sin(t * 0.02 + i * 1.7) * 0.6, bx = x + 30 + i * 46;
    c.fillStyle = ['#ff3a4a', '#ffd23a', '#ffffff', '#ff7a1a', '#7a9aff'][i];
    c.beginPath(); c.moveTo(bx, y - 44); c.lineTo(bx + Math.sin(a) * 320 - 34, -20); c.lineTo(bx + Math.sin(a) * 320 + 34, -20); c.fill();
  }
  c.restore();
  // treliça e luzes
  c.fillStyle = '#4a5060'; c.fillRect(x + 8, y - 50, 4, 52); c.fillRect(x + 228, y - 50, 4, 52); c.fillRect(x + 8, y - 50, 224, 4);
  c.strokeStyle = '#4a5060'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 11; i++) { c.moveTo(x + 10 + i * 20, y - 48); c.lineTo(x + 20 + i * 20, y - 6); } c.stroke();
  for (let i = 0; i < 12; i++) {
    const on = ((t >> 3) + i) % 3 === 0, col = ['#ff3a4a', '#ffd23a', '#ffffff'][i % 3];
    c.fillStyle = on ? col : '#2e2e38'; c.beginPath(); c.arc(x + 18 + i * 18, y - 44, 4, 0, TAU); c.fill();
    if (on) { const g = c.createRadialGradient(x + 18 + i * 18, y - 44, 1, x + 18 + i * 18, y - 44, 18); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = 0.5; c.fillStyle = g; c.fillRect(x + i * 18, y - 62, 36, 36); c.globalAlpha = 1; }
  }
  // caminhão
  const bg = c.createLinearGradient(0, y, 0, y + 92); bg.addColorStop(0, '#2c2c3a'); bg.addColorStop(1, '#14141c');
  c.fillStyle = bg; c.fillRect(x, y, 240, 92); c.fillStyle = '#44445a'; c.fillRect(x, y, 240, 3); c.fillStyle = '#0a0a10'; c.fillRect(x, y + 88, 240, 4);
  for (let s = 0; s < 2; s++) {                                     // caixas de som
    const sx = x + 8 + s * 184;
    c.fillStyle = '#0f0f15'; c.fillRect(sx, y + 8, 48, 76); c.strokeStyle = '#34343f'; c.lineWidth = 2; c.strokeRect(sx, y + 8, 48, 76);
    for (let k = 0; k < 3; k++) {
      const cy = y + 22 + k * 22, pulse = (t >> 2) % 3 === k ? 3 : 0;
      c.fillStyle = '#23232d'; c.beginPath(); c.arc(sx + 24, cy, 10, 0, TAU); c.fill(); c.fillStyle = '#3e3e4e'; c.beginPath(); c.arc(sx + 24, cy, 6 + pulse * 0.4, 0, TAU); c.fill();
      c.fillStyle = '#16161e'; c.beginPath(); c.arc(sx + 24, cy, 2.4, 0, TAU); c.fill();
    }
  }
  // telão de LED com equalizador
  const lx = x + 66, ly = y + 12;
  c.fillStyle = '#000'; c.fillRect(lx - 3, ly - 3, 114, 66); c.fillStyle = '#0a0812'; c.fillRect(lx, ly, 108, 60);
  for (let b = 0; b < 18; b++) {
    const base = 8 + Math.round((Math.sin(t * 0.21 + b * 0.9) + Math.sin(t * 0.13 + b * 2.3) + 2) * 11);
    const hgt = cheer > 0 ? Math.min(56, base + Math.round(cheer * 20)) : base;
    for (let k = 0; k < hgt; k += 4) { c.fillStyle = k > 34 ? '#ffffff' : k > 20 ? '#ffd23a' : '#e8202e'; c.fillRect(lx + 3 + b * 5.8, ly + 56 - k, 4.4, 3); }
  }
  c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(lx, ly, 108, 14);
  // banda (silhuetas)
  for (let i = 0; i < 4; i++) {
    const bx = x + 60 + i * 38, bob = ((t >> 3) + i) & 1;
    c.fillStyle = '#0c0c14'; c.beginPath(); c.roundRect(bx, y - 30 - bob * 2, 12, 28, 4); c.fill(); c.beginPath(); c.arc(bx + 6, y - 36 - bob * 2, 6, 0, TAU); c.fill();
    c.strokeStyle = '#0c0c14'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx + 11, y - 24 - bob * 2); c.lineTo(bx + 20, y - 34 - bob * 2 - ((t >> 2) & 1) * 4); c.stroke();
  }
  // faixa vermelha
  c.fillStyle = '#a50f24'; c.fillRect(x + 66, y + 74, 108, 10); c.fillStyle = '#ffd23a'; c.fillRect(x + 66, y + 74, 108, 2);
}

function drawPalm(c, x, t) {
  const sway = Math.sin(t * 0.03) * 3;
  c.lineCap = 'round';
  for (let i = 0; i < 30; i++) {                                    // tronco com anéis
    const tx = x + Math.sin(i / 9) * 12, ty = 336 - i * 8.6;
    c.fillStyle = i & 1 ? '#4a3626' : '#5a4430'; c.beginPath(); c.roundRect(tx - 6, ty - 4, 12, 9, 3); c.fill();
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(tx - 6, ty - 4, 3, 9); c.fillStyle = 'rgba(255,220,170,.14)'; c.fillRect(tx + 3, ty - 4, 2, 9);
  }
  const cx = x + 12, cy = 78;
  for (let f = 0; f < 9; f++) {
    const a = -Math.PI + f * (Math.PI / 8), len = 82 + (f % 2) * 14;
    const ex = cx + Math.cos(a) * len + sway * 0.6, ey = cy + Math.sin(a) * len * 0.55 + 38 + (f % 2) * 6;
    const mx = cx + Math.cos(a) * len * 0.5, my = cy + Math.sin(a) * len * 0.75 - 6;
    c.strokeStyle = '#173a22'; c.lineWidth = 9; c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.strokeStyle = '#2a6a3a'; c.lineWidth = 6; c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.strokeStyle = '#3d8a4c'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy - 2); c.quadraticCurveTo(mx, my - 2, ex, ey - 2); c.stroke();
  }
  c.fillStyle = '#3a2a18'; for (const [dx, dy] of [[-6, 4], [4, 6], [10, 2]]) { c.beginPath(); c.arc(cx + dx, cy + dy, 5.5, 0, TAU); c.fill(); }
}

function drawLamp(c, x) {
  const g = c.createRadialGradient(x + 12, 196, 4, x + 12, 196, 90); g.addColorStop(0, 'rgba(255,200,110,.35)'); g.addColorStop(1, 'rgba(255,190,90,0)');
  c.fillStyle = g; c.fillRect(x - 80, 110, 200, 180);
  c.fillStyle = '#4a4a56'; c.fillRect(x, 190, 4, 150); c.fillRect(x, 190, 22, 4);
  c.fillStyle = '#ffe2a0'; c.beginPath(); c.roundRect(x + 14, 194, 14, 7, 3); c.fill();
}

export function drawStage(cx, camXLogic, t, dim = 0, cheer = 0) {
  const c = cx, camX = camXLogic * 2;
  c.save(); c.scale(0.5, 0.5);
  c.drawImage(sky, 0, 0);
  for (const s of twinkles) if (Math.sin(t * 0.05 + s.ph) > 0.6) { c.fillStyle = '#fff'; c.fillRect(s.x - 3, s.y, 7, 1.6); c.fillRect(s.x - 0.8, s.y - 3, 1.6, 7); }
  const fo = Math.round(camX * FAR_F);
  c.drawImage(far, -fo, 0);
  for (const b of blinkers) {
    const on = Math.sin(t * b.sp + b.ph) > -0.2;
    if (b.r) { c.fillStyle = on ? b.col : '#3a1020'; c.beginPath(); c.arc(b.x - fo, b.y, b.r, 0, TAU); c.fill(); }
    else { c.fillStyle = on ? b.col : '#2a2045'; c.fillRect(b.x - fo, b.y, 3, 4); }
  }
  const gp = ((t * 0.3) % 130);                                      // bondinho andando
  const gx = 618 + gp - fo, gy = 152 - gp * (90 / 130) - Math.sin(gp / 20) * 2;
  c.fillStyle = '#ffd36b'; c.fillRect(gx - 5, gy + 2, 10, 7); c.fillStyle = '#7a5a20'; c.fillRect(gx - 5, gy + 8, 10, 2);
  // mar com reflexo da lua
  const sg = c.createLinearGradient(0, HORIZON, 0, 284); sg.addColorStop(0, '#2a2552'); sg.addColorStop(0.2, '#0f1838'); sg.addColorStop(1, '#070d22');
  c.fillStyle = sg; c.fillRect(0, HORIZON, W, 60);
  c.fillStyle = 'rgba(255,170,150,.2)'; c.fillRect(0, HORIZON, W, 2);
  for (let y = HORIZON + 5; y < 282; y += 5) {
    const k = (y - HORIZON) / 58;
    for (let i = 0; i < 7; i++) {
      const xx = 612 - fo * 0.4 + Math.round(Math.sin(t * 0.05 + y + i * 3) * 12 * (0.4 + k)) + (i - 3) * (7 + k * 8);
      c.fillStyle = `rgba(243,236,200,${0.65 - k * 0.35})`; c.fillRect(xx, y, 3 + k * 8, 1.6);
    }
    for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(190,210,255,.10)'; c.fillRect((i * 211 + y * 17 + t * (0.3 + k * 0.4)) % (W + 40) - 20, y + 1, 18 + k * 20, 1.4); }
  }
  c.fillStyle = (t >> 5) & 1 ? '#ff4a4a' : '#7a2030'; c.fillRect(120 - Math.round(camX * 0.35), 232, 4, 2);          // luzes de barcos
  c.fillStyle = (t >> 4) & 1 ? '#7aff8a' : '#2a6a3a'; c.fillRect(400 - Math.round(camX * 0.35), 234, 4, 2);
  c.fillStyle = 'rgba(207,216,255,.55)';
  for (let x = 0; x < W; x += 12) { const wv = Math.sin(t * 0.03 + x) * 4; c.fillRect(x + wv, 278 + ((x >> 3) & 1) * 2, 9, 2); }   // espuma
  c.drawImage(sand, 0, 282);
  // camada do meio
  const off = Math.round(camX * MID_F);
  drawTrio(c, off, t, cheer);
  for (const p of palms) drawPalm(c, p - off, t);
  for (const l of lamps) drawLamp(c, l - off);
  c.lineCap = 'round';
  for (const p of crowd) {
    const x = p.x - off;
    if (x < -30 || x > W + 30) continue;
    const z = [0.9, 1.05, 1.25][p.row];
    const jump = cheer > 0 ? Math.max(0, Math.sin(t * 0.3 + p.ph)) * (4 + cheer * 9)
      : p.act === 0 ? Math.max(0, Math.sin(t * 0.18 + p.ph)) * 6 : Math.max(0, Math.sin(t * 0.1 + p.ph)) * 2;
    const by = p.base - jump, bw = 15 * z, bh = 20 * z, hr = 5.6 * z;
    const armUp = cheer > 0 || (p.act === 1 ? Math.sin(t * 0.08 + p.ph) > 0.2 : p.act === 0);
    c.strokeStyle = p.skin; c.lineWidth = 3.2 * z;
    if (armUp) { c.beginPath(); c.moveTo(x - bw / 2 + 1, by - bh + 4); c.lineTo(x - bw / 2 - 3, by - bh - 12 * z); c.moveTo(x + bw / 2 - 1, by - bh + 4); c.lineTo(x + bw / 2 + 3, by - bh - 12 * z); c.stroke(); }
    c.fillStyle = p.shirt; c.beginPath(); c.roundRect(x - bw / 2, by - bh, bw, bh + 2, 5 * z); c.fill();
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x - bw / 2, by - bh, 3, bh);
    if (p.act === 2 && cheer <= 0) { const cl = (t >> 3) & 1; c.fillStyle = p.skin; c.beginPath(); c.arc(x - 2 + cl * 2, by - bh * 0.6, 2.4 * z, 0, TAU); c.arc(x + 2 - cl * 2, by - bh * 0.6, 2.4 * z, 0, TAU); c.fill(); }
    c.fillStyle = p.skin; c.beginPath(); c.arc(x, by - bh - hr + 2, hr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.arc(x - hr * 0.35, by - bh - hr + 2, hr * 0.7, Math.PI * 0.5, Math.PI * 1.5); c.fill();
    c.fillStyle = p.hair;
    if (p.look === 1) { c.fillStyle = p.cap; c.beginPath(); c.arc(x, by - bh - hr + 1, hr + 0.6, Math.PI, TAU); c.fill(); c.fillRect(x, by - bh - hr, hr + 3, 2.4); }
    else if (p.look === 2) { c.beginPath(); c.arc(x, by - bh - hr + 1, hr + 0.4, Math.PI, TAU); c.fill(); c.fillRect(x - hr, by - bh - hr, 3, hr * 2.2); }
    else if (p.look !== 3) { c.beginPath(); c.arc(x, by - bh - hr + 1, hr + 0.4, Math.PI * 1.05, TAU * 0.98); c.fill(); }
    if (p.kid) { c.fillStyle = '#ffd23a'; c.fillRect(x - 4, by - bh - hr * 2 - 11, 8, 12); c.fillStyle = p.skin; c.beginPath(); c.arc(x, by - bh - hr * 2 - 14, 4.6, 0, TAU); c.fill(); }
    if (p.act === 3) { c.strokeStyle = p.skin; c.lineWidth = 3; c.beginPath(); c.moveTo(x + bw / 2, by - bh + 4); c.lineTo(x + bw / 2 + 5, by - bh - 14); c.stroke(); c.fillStyle = '#10101a'; c.fillRect(x + bw / 2 + 2, by - bh - 24, 7, 11); if (Math.sin(t * 0.07 + p.ph) > 0.3) { c.fillStyle = '#fff'; c.fillRect(x + bw / 2 + 3.5, by - bh - 22, 4, 7); } }
    if (p.flag) {
      c.fillStyle = '#c9c2b0'; c.fillRect(x + bw / 2 + 2, by - bh - 54, 2.4, 52);
      for (let fx = 0; fx < 30; fx += 2) {
        const wy = Math.sin(t * (cheer > 0 ? 0.35 : 0.18) + fx * 0.3 + p.ph) * 3;
        c.fillStyle = fx < 2 ? '#8c0c1f' : wy > 1 ? '#a50f24' : wy < -1 ? '#e83040' : '#c8102e'; c.fillRect(x + bw / 2 + 4 + fx, by - bh - 54 + wy, 2.4, 20);
      }
    }
  }
  // grade de proteção
  c.fillStyle = '#3c3c4a'; c.fillRect(0, 346, W, 4); c.fillStyle = '#9a9aaa'; c.fillRect(0, 336, W, 3); c.fillStyle = '#6a6a7a'; c.fillRect(0, 346, W, 2);
  c.fillStyle = '#7a7a8a'; for (let x = -(off % 24); x < W; x += 24) c.fillRect(x, 334, 3, 20);
  c.drawImage(ground, -Math.round(camX), 352);
  if (dim) { c.fillStyle = `rgba(0,0,0,${dim})`; c.fillRect(0, 0, W, H); }
  c.restore();
}
