// Lutadores em alta resolução, desenhados por código (sem foto, sem imagem externa, sem IA imitando rosto).
// Unidade de desenho = 1 pixel do canvas 768×432 (o jogo calcula em unidades lógicas de 384×216; aqui se desenha a 0,5×).
// Membros articulados (rig.js) com contorno, 4 tons de sombreamento e luz de recorte; roupas por personagem.
import { CHARS } from './chars.js';
import { rigFor, joints } from './rig.js';
import { layer, makePalette, quantize, mix } from './pixel.js';
import { pixelHead } from './heads.js';

const OUT = '#140d18', TAU = Math.PI * 2, OW = 2.6;
const LX = 0.45, LY = -0.89;                               // luz vem de cima e da frente

const circ = (c, x, y, r, f) => { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
const ell = (c, x, y, rx, ry, f, rot = 0) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
const poly = (c, pts, f) => { c.fillStyle = f; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fill(); };
const P = (x, y) => ({ x, y });
function line(c, a, b, w, col, cap = 'round') { c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }

function capsule(c, a, b, ra, rb, fill) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  poly(c, [P(a.x + nx * ra, a.y + ny * ra), P(b.x + nx * rb, b.y + ny * rb), P(b.x - nx * rb, b.y - ny * rb), P(a.x - nx * ra, a.y - ny * ra)], fill);
  circ(c, a.x, a.y, ra, fill); circ(c, b.x, b.y, rb, fill);
}
// faixas de sombra (lado oposto à luz) e de luz (lado da luz) ao longo de um segmento
function strips(c, a, b, ra, rb, pal) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
  let nx = -dy / d, ny = dx / d;
  if (nx * LX + ny * LY < 0) { nx = -nx; ny = -ny; }                         // n aponta para a luz
  poly(c, [P(a.x - nx * ra, a.y - ny * ra), P(b.x - nx * rb, b.y - ny * rb), P(b.x - nx * rb * 0.1, b.y - ny * rb * 0.1), P(a.x - nx * ra * 0.1, a.y - ny * ra * 0.1)], pal.shade);
  poly(c, [P(a.x + nx * ra * 0.45, a.y + ny * ra * 0.45), P(b.x + nx * rb * 0.45, b.y + ny * rb * 0.45), P(b.x + nx * rb * 0.78, b.y + ny * rb * 0.78), P(a.x + nx * ra * 0.78, a.y + ny * ra * 0.78)], pal.light);
  if (pal.rim) {                                                             // luz de recorte, fininha, na borda iluminada
    c.strokeStyle = pal.rim; c.lineWidth = 1.4; c.globalAlpha = 0.7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(a.x + nx * ra * 0.9, a.y + ny * ra * 0.9); c.lineTo(b.x + nx * rb * 0.9, b.y + ny * rb * 0.9); c.stroke(); c.globalAlpha = 1;
  }
  if (pal.stripe) {
    c.strokeStyle = pal.stripe; c.globalAlpha = 0.34; c.lineWidth = 1.3; c.lineCap = 'butt';
    for (const o of [-0.5, -0.17, 0.17, 0.5]) { c.beginPath(); c.moveTo(a.x + nx * ra * o, a.y + ny * ra * o); c.lineTo(b.x + nx * rb * o, b.y + ny * rb * o); c.stroke(); }
    c.globalAlpha = 1;
  }
}
function limb(c, pts, rads, pal) {
  for (let i = 0; i < pts.length - 1; i++) capsule(c, pts[i], pts[i + 1], rads[i] + OW, rads[i + 1] + OW, OUT);
  for (let i = 0; i < pts.length - 1; i++) capsule(c, pts[i], pts[i + 1], rads[i], rads[i + 1], pal.base);
  for (let i = 0; i < pts.length - 1; i++) strips(c, pts[i], pts[i + 1], rads[i], rads[i + 1], pal);
}

// ---------------- paletas ----------------
function dk(hex, k) {                                       // escurece uma cor #rrggbb
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * k).toString(16).padStart(2, '0')).join('');
}
function palettes(C) {
  return {
    suit: { base: C.suit, shade: C.suitShade, light: C.suitLight, stripe: null, rim: C.suitLight },
    pants: { base: C.pants, shade: C.pantsShade, light: C.pantsLight, stripe: null, rim: C.pantsLight },
    skin: { base: C.skin, shade: C.skinShade, light: C.skinLight, rim: C.skinLight },
    back: { base: dk(C.suit, 0.58), shade: dk(C.suit, 0.38), light: dk(C.suit, 0.85) },
    legBack: { base: dk(C.pants, 0.62), shade: dk(C.pants, 0.42), light: dk(C.pants, 0.86) },
  };
}

// ---------------- pé, mão, bengala ----------------
function shoe(c, C, ankle, knee) {
  let dx = ankle.x - knee.x, dy = ankle.y - knee.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  const ang = Math.atan2(-dx, dy);                                   // eixo da ponta = (dy,-dx)
  c.save(); c.translate(ankle.x, ankle.y); c.rotate(ang);
  const body = [P(-10, -9), P(-11, 8), P(-9, 12), P(26, 12), P(33, 8), P(31, 2), P(20, -3), P(8, -8)];
  c.lineJoin = 'round';
  c.strokeStyle = OUT; c.lineWidth = OW * 2; c.beginPath(); body.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.stroke();
  poly(c, body, C.shoes);
  poly(c, [P(-10, -9), P(8, -8), P(20, -3), P(14, 0), P(-6, -3)], C.shoeLight);               // cabedal iluminado
  poly(c, [P(-11, 8), P(-9, 12), P(26, 12), P(33, 8), P(31, 5), P(-11, 5)], '#0a0707');          // sola
  c.strokeStyle = C.shoeLight; c.lineWidth = 1.4; c.globalAlpha = 0.6; c.beginPath(); c.moveTo(8, -7); c.lineTo(22, -2); c.stroke(); c.globalAlpha = 1;
  c.restore();
}
function hand(c, C, h, shape, front) {
  const sk = C.skin, sh = C.skinShade;
  if (shape === 'L') {                                               // mão do "L": indicador para cima, polegar para a frente
    const f = (rx, ry, w, hh) => { c.fillStyle = OUT; c.fillRect(h.x + rx - 2.5, h.y + ry - 2.5, w + 5, hh + 5); };
    f(2, -46, 8, 38); f(8, -6, 24, 9);
    circ(c, h.x, h.y, 13, OUT);
    c.fillStyle = sk; c.fillRect(h.x + 2, h.y - 46, 8, 38); c.fillStyle = sh; c.fillRect(h.x + 2, h.y - 46, 3, 38);
    c.fillStyle = sk; c.fillRect(h.x + 8, h.y - 6, 24, 9); c.fillStyle = sh; c.fillRect(h.x + 8, h.y + 1, 24, 2);
    circ(c, h.x, h.y, 10.5, sk); ell(c, h.x - 3, h.y + 3, 6, 7, sh);
    circ(c, h.x + 3, h.y - 4, 3, C.skinLight);
    return;
  }
  circ(c, h.x, h.y, 10.5 + OW, OUT); circ(c, h.x, h.y, 10.5, sk);
  ell(c, h.x - 3, h.y + 3, 7, 7, sh);
  circ(c, h.x + 3, h.y - 4, 3.2, C.skinLight);
  c.strokeStyle = sh; c.lineWidth = 1.6; c.lineCap = 'round';                          // dobras dos dedos
  for (const o of [-4, 0, 4]) { c.beginPath(); c.moveTo(h.x + 4, h.y + o); c.lineTo(h.x + 9, h.y + o); c.stroke(); }
}
function cuff(c, C, e, h, col, pal) {                                 // punho da manga + punho da camisa
  const dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const a = P(h.x - ux * 12, h.y - uy * 12), b = P(h.x - ux * 5, h.y - uy * 5);
  capsule(c, a, b, 11.5, 11, col); strips(c, a, b, 11.5, 11, pal);
}
function cane(c, C, h, raised) {
  const ang = raised ? -0.5 : 1.35, len = 112;                         // bengala: ponta para baixo/frente, ou erguida na vitória
  const a = P(h.x - Math.cos(ang) * 6, h.y - Math.sin(ang) * 6), b = P(h.x + Math.cos(ang) * len, h.y + Math.sin(ang) * len);
  line(c, a, b, 9, OUT); line(c, a, b, 5, '#2a1810'); line(c, P(a.x + 1, a.y - 1), P(b.x + 1, b.y - 1), 1.6, '#7a5a40');
  circ(c, a.x - Math.cos(ang) * 4, a.y - Math.sin(ang) * 4, 9 + OW, OUT); circ(c, a.x - Math.cos(ang) * 4, a.y - Math.sin(ang) * 4, 9, C.gold);
  circ(c, a.x - Math.cos(ang) * 4 + 2, a.y - Math.sin(ang) * 4 - 3, 3, '#fff6c0');
}

// ---------------- cabeça ----------------
// ---------------- tronco ----------------
function smooth(pts) {                                            // curva fechada suave (pontos médios + quadráticas)
  const p = new Path2D(), n = pts.length, m = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2), s0 = m(pts[n - 1], pts[0]);
  p.moveTo(s0.x, s0.y);
  for (let i = 0; i < n; i++) { const q = m(pts[i], pts[(i + 1) % n]); p.quadraticCurveTo(pts[i].x, pts[i].y, q.x, q.y); }
  p.closePath(); return p;
}
function torso(c, C, J, R, id) {
  const { S, hip, up, nf } = J, pal = palettes(C);
  const Lp = (t, u) => P(S.x - up.x * t + nf.x * u, S.y - up.y * t + nf.y * u);
  const lula = id === 'lula';
  // cauda da casaca (Flávio) — atrás das pernas e do corpo
  if (!lula) {
    const tail = smooth([Lp(30, -22), Lp(70, -27), Lp(112, -34), Lp(122, -22), Lp(112, -6), Lp(80, 2), Lp(44, -2)]);
    c.strokeStyle = OUT; c.lineWidth = OW * 2; c.stroke(tail); c.fillStyle = C.suitShade; c.fill(tail);
    c.save(); c.clip(tail); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-300, -300, 600, 600); c.restore();
  }
  const pts = lula
    ? [Lp(-6, -14), Lp(8, -22), Lp(34, -22), Lp(60, -20), Lp(86, -21), Lp(89, 0), Lp(86, 23), Lp(62, 20), Lp(38, 21), Lp(14, 25), Lp(-2, 20), Lp(-8, 6)]
    : [Lp(-6, -14), Lp(8, -23), Lp(34, -23), Lp(60, -22), Lp(98, -28), Lp(102, -6), Lp(94, 20), Lp(62, 19), Lp(38, 20), Lp(14, 25), Lp(-2, 20), Lp(-8, 6)];
  const body = smooth(pts);
  c.strokeStyle = OUT; c.lineWidth = OW * 2; c.lineJoin = 'round'; c.stroke(body);
  c.fillStyle = C.suit; c.fill(body);
  c.save(); c.clip(body);
  const band = (t0, t1, u0, u1, col, a = 1) => { c.globalAlpha = a; poly(c, [Lp(t0, u0), Lp(t1, u0), Lp(t1, u1), Lp(t0, u1)], col); c.globalAlpha = 1; };
  band(-20, 130, -40, -11, C.suitShade);                                    // lado de trás
  band(-20, 130, -40, -19, 'rgba(0,0,0,.28)');
  band(-20, 70, 12, 16, C.suitLight, 0.55); band(-20, 70, 16, 40, C.suitLight, 0.35);                  // luz da frente
  band(60, 130, -20, 40, 'rgba(0,0,0,.18)');                                // barra mais escura
  if (false) {
    c.strokeStyle = C.stripe; c.globalAlpha = 0.34; c.lineWidth = 1.3;
    for (let u = -19; u <= 24; u += 6.5) { const a = Lp(-10, u), b = Lp(110, u); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    c.globalAlpha = 1;
  }
  c.restore();
  const rim = Lp(0, 24), rim2 = Lp(78, 22);
  c.strokeStyle = C.suitLight; c.globalAlpha = 0.7; c.lineWidth = 1.6; c.beginPath(); c.moveTo(rim.x, rim.y); c.lineTo(rim2.x, rim2.y); c.stroke(); c.globalAlpha = 1;
  if (lula) {
    // camisa escura aberta no V + corrente dourada + lapelas
    const v = [Lp(-2, 12), Lp(-2, 25), Lp(38, 23), Lp(42, 15), Lp(24, 11)];
    poly(c, v, C.shirt);
    c.strokeStyle = OUT; c.lineWidth = 2; c.lineJoin = 'round'; c.beginPath(); v.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
    poly(c, [Lp(2, 21), Lp(8, 24), Lp(26, 22), Lp(18, 20)], C.shirtLight);
    poly(c, [Lp(-2, 10), Lp(3, 12), Lp(32, 4), Lp(44, 13), Lp(40, 16), Lp(35, 10), Lp(8, 18), Lp(-2, 14)], C.suitLight);             // lapela
    c.strokeStyle = OUT; c.lineWidth = 1.8; c.beginPath(); c.moveTo(Lp(0, 14).x, Lp(0, 14).y); c.lineTo(Lp(38, 6).x, Lp(38, 6).y); c.stroke();
    const a = Lp(2, 19), b = Lp(32, 21), m = Lp(22, 28);
    c.strokeStyle = OUT; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(m.x, m.y, b.x, b.y); c.stroke();
    c.strokeStyle = C.gold; c.lineWidth = 3.4; c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(m.x, m.y, b.x, b.y); c.stroke();
    c.strokeStyle = C.goldShade; c.lineWidth = 1.2; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(m.x, m.y, b.x, b.y); c.stroke(); c.setLineDash([]);
    const mdx = Lp(30, 23); circ(c, mdx.x, mdx.y, 5.6, OUT); circ(c, mdx.x, mdx.y, 4.2, C.gold); circ(c, mdx.x - 1, mdx.y - 1, 1.5, '#fff6c0');    // medalhão
    // lenço vermelho no bolso do peito
    const pk = Lp(34, 21);
    poly(c, [P(pk.x - 5, pk.y - 8), P(pk.x + 1, pk.y - 12), P(pk.x + 7, pk.y - 7), P(pk.x + 5, pk.y), P(pk.x - 5, pk.y)], OUT);
    poly(c, [P(pk.x - 4, pk.y - 7), P(pk.x + 1, pk.y - 10), P(pk.x + 5, pk.y - 6), P(pk.x + 4, pk.y - 1), P(pk.x - 4, pk.y - 1)], C.tie);
    poly(c, [P(pk.x - 1, pk.y - 8), P(pk.x + 1, pk.y - 10), P(pk.x + 5, pk.y - 6), P(pk.x + 1, pk.y - 5)], '#ff5a6a');
    const bt = Lp(56, 22); circ(c, bt.x, bt.y, 2.8, OUT); circ(c, bt.x, bt.y, 1.8, C.suitLight);                // botão
    line(c, Lp(60, 21), Lp(84, 22), 1.8, C.suitShade);                                                          // abertura do paletó
  } else {
    // colete dourado + gravata borboleta turquesa + camisa
    poly(c, [Lp(-2, 8), Lp(-2, 23), Lp(60, 21), Lp(58, 8)], C.vest);
    c.save(); c.beginPath(); [Lp(-2, 8), Lp(-2, 23), Lp(60, 21), Lp(58, 8)].forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.clip();
    for (let t = 8; t < 62; t += 9) line(c, Lp(t, 8), Lp(t + 3, 24), 2.6, C.vestShade);
    line(c, Lp(0, 22), Lp(58, 20), 3, C.vestLight);
    c.restore();
    poly(c, [Lp(-4, 10), Lp(-4, 23), Lp(8, 24), Lp(14, 12)], C.shirt);                       // gola
    c.strokeStyle = OUT; c.lineWidth = 1.8; c.beginPath(); [Lp(-4, 10), Lp(-4, 23), Lp(8, 24), Lp(14, 12)].forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.stroke();
    poly(c, [Lp(-2, 9), Lp(6, 9), Lp(34, 3), Lp(46, 12), Lp(40, 15), Lp(32, 10), Lp(6, 14)], C.suitLight);      // lapela vinho
    c.strokeStyle = OUT; c.lineWidth = 1.8; c.beginPath(); c.moveTo(Lp(0, 12).x, Lp(0, 12).y); c.lineTo(Lp(40, 8).x, Lp(40, 8).y); c.stroke();
    line(c, Lp(40, 12), Lp(96, 14), 2, C.suitShade);                                           // abertura da casaca
    const bw = Lp(7, 21);                                                                     // gravata borboleta
    poly(c, [P(bw.x, bw.y), P(bw.x - 12, bw.y - 9), P(bw.x - 12, bw.y + 9)], OUT); poly(c, [P(bw.x, bw.y), P(bw.x + 12, bw.y - 9), P(bw.x + 12, bw.y + 9)], OUT);
    poly(c, [P(bw.x, bw.y), P(bw.x - 10, bw.y - 7), P(bw.x - 10, bw.y + 7)], C.tie); poly(c, [P(bw.x, bw.y), P(bw.x + 10, bw.y - 7), P(bw.x + 10, bw.y + 7)], C.tieShade);
    circ(c, bw.x, bw.y, 4.4, OUT); circ(c, bw.x, bw.y, 3.2, C.tie);
    for (const t of [24, 36, 48]) { const b = Lp(t, 21); circ(c, b.x, b.y, 2.8, OUT); circ(c, b.x, b.y, 1.8, C.gold); }   // botões do colete
    line(c, Lp(44, 15), Lp(44, 2), 1.4, C.gold);                                                // corrente do relógio
  }
}

function neck(c, C, J, R) {
  const a = P(J.S.x + J.up.x * 2, J.S.y + J.up.y * 2), b = P(J.head.x - J.up.x * 8, J.head.y - J.up.y * 8);
  limb(c, [a, b], [9.5, 9], { base: C.skinShade, shade: C.skinDeep, light: C.skin });
}

// ---------------- efeitos de energia (alta resolução) ----------------
function drawBigL(c, k, t, H) {
  const s = 14 + k * 90, v = 30 + k * 130, cx = H.x + 52, cy = H.y - 14, th = 22 + k * 8;
  c.save(); c.lineJoin = 'miter';
  const L = (g, col) => { c.fillStyle = col; c.fillRect(cx - g, cy - v - g, th + g * 2, v + g * 2); c.fillRect(cx - g, cy - th - g, s + th + g * 2, th + g * 2); };
  L(7, '#e8202e'); L(3, '#ff9a1a'); L(-3, (t >> 1) & 1 ? '#ffffff' : '#fff3a0');
  c.restore();
}
function drawAura(c, k, t, J) {
  const cx = J.S.x, cy = J.S.y + 30;
  c.save();
  const g = c.createRadialGradient(cx, cy, 4, cx, cy, 130 * k + 10);
  g.addColorStop(0, 'rgba(255,243,160,.55)'); g.addColorStop(0.5, 'rgba(255,210,58,.22)'); g.addColorStop(1, 'rgba(255,210,58,0)');
  c.fillStyle = g; c.fillRect(cx - 160, cy - 200, 320, 360);
  c.globalAlpha = 0.6 * k;
  for (let i = 0; i < 9; i++) {
    const x = cx - 54 + i * 13 + Math.sin(t * 0.2 + i) * 3, h = 40 + ((t * 5 + i * 31) % 92);
    const gg = c.createLinearGradient(0, cy + 70 - h, 0, cy + 70); gg.addColorStop(0, 'rgba(255,243,160,0)'); gg.addColorStop(1, i & 1 ? '#fff3a0' : '#ffd23a');
    c.fillStyle = gg; c.fillRect(x, cy + 70 - h, 4, h);
  }
  c.restore();
}
function drawPillar(c, t, J) {
  const x = J.hip.x, base = 0;
  c.save();
  const g = c.createLinearGradient(x - 26, 0, x + 26, 0);
  g.addColorStop(0, 'rgba(200,144,26,0)'); g.addColorStop(0.5, 'rgba(255,243,160,.75)'); g.addColorStop(1, 'rgba(200,144,26,0)');
  c.fillStyle = g; c.fillRect(x - 26, -380, 52, 380 + base);
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 5, -380, 10, 380);
  c.fillStyle = '#fff';
  for (let k = 0; k < 6; k++) { const y = -((t * 5 + k * 70) % 380); c.globalAlpha = 0.9; c.fillRect(x - 12 + (k * 7) % 22, y, 3, 3); }
  c.restore();
}
function drawShieldFront(c, t, J) {
  const y0 = J.hip.y - 118, y1 = -10, cx = J.hip.x + 82, cy = (y0 + y1) / 2, half = (y1 - y0) / 2;
  c.save();
  const g = c.createLinearGradient(cx - 6, 0, cx + 30, 0); g.addColorStop(0, 'rgba(159,216,255,0)'); g.addColorStop(1, 'rgba(159,216,255,.5)');
  c.fillStyle = g; c.beginPath();
  for (let y = y0; y <= y1; y += 4) { const xo = Math.sqrt(Math.max(0, 1 - ((y - cy) / half) ** 2)) * 16; if (y === y0) c.moveTo(cx - 6, y); c.lineTo(cx + xo, y); }
  c.lineTo(cx - 6, y1); c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.globalAlpha = 0.8 + 0.2 * ((t >> 1) & 1); c.beginPath();
  for (let y = y0; y <= y1; y += 4) { const xo = Math.sqrt(Math.max(0, 1 - ((y - cy) / half) ** 2)) * 16; y === y0 ? c.moveTo(cx + xo, y) : c.lineTo(cx + xo, y); }
  c.stroke(); c.restore();
}
function drawDome(c, t, J) {
  const cx = J.hip.x + 2, cy = -104;
  c.save();
  const g = c.createRadialGradient(cx, cy, 20, cx, cy, 118); g.addColorStop(0, 'rgba(122,255,200,.0)'); g.addColorStop(1, 'rgba(122,255,200,.16)');
  c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, 70, 116, 0, 0, TAU); c.fill();
  c.strokeStyle = '#baffe0'; c.lineWidth = 3; c.globalAlpha = 0.9; c.beginPath(); c.ellipse(cx, cy, 70, 116, 0, 0, TAU); c.stroke();
  c.fillStyle = '#fff';
  for (let a = 0; a < 20; a++) { const an = a / 20 * TAU + t * 0.03; c.globalAlpha = 0.7; c.fillRect(cx + Math.cos(an) * 70 - 2, cy + Math.sin(an) * 116 - 2, 4, 4); }
  c.restore();
}
// ---------------- lutador completo ----------------
// c já está em unidades lógicas (384×216); camX em unidades lógicas.
// Camadas de pixel art: G = brilho atrás, A = corpo + cabeça, B = braço da frente, F = efeitos na frente.
// 1 px da camada = 1 unidade lógica (2 px do canvas); o desenho vetorial entra a 0,5× e é reduzido à paleta do personagem.
const KW = 288, KH = 240, OX = 144, OY = 214;
const LAY = { G: layer(KW, KH), A: layer(KW, KH), B: layer(KW, KH), F: layer(KW, KH) };
const begin = L => { const c = L.c; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, KW, KH); c.translate(OX, OY); c.scale(0.5, 0.5); c.lineJoin = 'round'; return c; };
const HL = layer(96, 96);
const FP = {};
function fighterPal(C) {
  if (FP[C.id]) return FP[C.id];
  const list = [OUT, '#ffffff', '#0b0b14', '#8f8f90', '#e8e8ea', '#ff5a6a', '#8a0a1e', '#e8202e', '#ff9a1a', '#fff3a0', '#ffd23a', '#c8901a', '#9fd8ff', '#baffe0', '#7affc8', '#5d4636', '#3a3644'];
  for (const k in C) if (typeof C[k] === 'string') list.push(C[k]);
  for (const k of ['suit', 'pants']) for (const m of [0.38, 0.42, 0.45, 0.58, 0.62, 0.85, 0.86]) list.push(dk(C[k], m));
  const sS = C.stripe ? mix(C.suit, C.stripe, 0.32) : null, sP = C.stripe ? mix(C.pants, C.stripe, 0.32) : null;
  if (sS) list.push(sS, sP);
  const pal = makePalette(list), ix = h => pal.cols.findIndex(c => c.join() === [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)].join());
  let post;
  if (sS) {                                                                  // riscas de giz do terno: colunas fixas no corpo
    const iS = ix(C.suit), iP = ix(C.pants), jS = ix(sS), jP = ix(sP);
    post = (x, y, k) => (((x - OX) & 3) === 0 ? (k === iS ? jS : k === iP ? jP : k) : k);
  }
  return (FP[C.id] = { pal, post });
}

export function drawFighter(c, f, camX, ox = 0, oy = 0) {
  if (f.state === 'gone') return;
  const C = f.C, R = rigFor(f), J = joints(R), pal = palettes(C), id = C.id, fp = fighterPal(C);
  const { G, A, B, F } = LAY, hasG = R.aura > 0 || R.pillar, hasF = R.L > 0 || R.shieldFront || R.dome || f.state === 'dizzy';
  const done = (L, o) => { L.c.setTransform(1, 0, 0, 1, 0, 0); quantize(L, fp.pal, o); };
  if (hasG) {
    const g = begin(G);
    if (R.aura > 0) drawAura(g, R.aura, f.t, J);
    if (R.pillar) drawPillar(g, f.t, J);
    done(G, { dither: true });
  }
  const a = begin(A);
  const armLimb = (cc, Ar, front) => {
    limb(cc, [Ar.s, Ar.e, Ar.h], [13.5, 11.5, 10.5], front ? pal.suit : pal.back);
    cuff(cc, C, Ar.e, Ar.h, C.shirt, { base: C.shirt, shade: '#8f8f90', light: '#fff' });
  };
  armLimb(a, J.armB, false);
  if (id === 'flavio') cane(a, C, J.armB.h, f.state === 'win' || f.state === 'triumph');
  hand(a, C, J.armB.h, 'fist', false);
  const leg = (L, back) => {
    limb(a, [L.h, L.k, L.a], [18.5, 14.5, 10.5], back ? pal.legBack : pal.pants);
    shoe(a, C, L.a, L.k);
    const dx = L.a.x - L.k.x, dy = L.a.y - L.k.y, d = Math.hypot(dx, dy) || 1;
    capsule(a, P(L.a.x - dx / d * 14, L.a.y - dy / d * 14), P(L.a.x - dx / d * 8, L.a.y - dy / d * 8), 12, 12, back ? dk(C.pants, 0.45) : C.pantsShade);
  };
  leg(J.legB, true); leg(J.legF, false);
  torso(a, C, J, R, id);
  neck(a, C, J, R);
  done(A, { post: fp.post });
  const hx = OX + Math.round(J.head.x / 2), hy = OY + Math.round(J.head.y / 2);
  if (R.lying) {                                                             // caído: a cabeça gira 90° (rotação exata, sem borrar)
    const h = HL.c; h.setTransform(1, 0, 0, 1, 0, 0); h.clearRect(0, 0, 96, 96);
    pixelHead(h, C, 30, 40, R.face, R);
    A.c.save(); A.c.translate(hx, hy); A.c.rotate(-Math.PI / 2); A.c.drawImage(HL.cv, -40, -52); A.c.restore();
  } else pixelHead(A.c, C, hx - 9, hy - 12, R.face, R);
  const b = begin(B);
  armLimb(b, J.armF, true);
  hand(b, C, J.armF.h, R.shape, true);
  done(B, { post: fp.post });
  if (hasF) {
    const e = begin(F);
    if (R.L > 0) drawBigL(e, R.L, f.t, J.armF.h);
    if (R.shieldFront) drawShieldFront(e, f.t, J);
    if (R.dome) drawDome(e, f.t, J);
    if (f.state === 'dizzy') {
      for (let i = 0; i < 3; i++) {
        const an = f.t * 0.1 + i * TAU / 3, x = J.head.x + Math.cos(an) * 36, y = J.head.y - (id === 'flavio' ? 76 : 58) + Math.sin(an) * 8;
        e.save(); e.translate(x, y); e.rotate(an); e.fillStyle = '#ffd23a'; e.beginPath();
        for (let k = 0; k < 5; k++) { const aa = k * TAU / 5 - Math.PI / 2; e.lineTo(Math.cos(aa) * 9, Math.sin(aa) * 9); e.lineTo(Math.cos(aa + TAU / 10) * 3.8, Math.sin(aa + TAU / 10) * 3.8); }
        e.closePath(); e.fill(); e.restore();
      }
    }
    done(F, { dither: true });
  }
  c.save(); c.imageSmoothingEnabled = false;
  c.translate(Math.round(f.x - camX + ox), Math.round(f.y + oy)); c.scale(f.facing, 1);
  for (const L of [hasG && G, A, B, hasF && F]) if (L) c.drawImage(L.cv, -OX, -OY);
  c.restore();
}

export function drawShadow(c, f, camX, groundY) {
  if (f.state === 'gone') return;
  const lying = f.state === 'ko' && f.onGround;
  const air = Math.min(1, (groundY - f.y) / 90);
  const w = (lying ? 58 : 22) * (1 - air * 0.3), cx = f.x - camX + (lying ? -f.facing * 10 : 0);
  c.save(); c.translate(cx, groundY + 1); c.scale(1, 0.16);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, w); g.addColorStop(0, `rgba(0,0,0,${0.62 - air * 0.3})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, w, 0, TAU); c.fill(); c.restore();
}

// Retrato (cabeça + busto) para seleção/VS/HUD. (x,y) = centro da cabeça em unidades lógicas; s=1 → cabeça com ~24 de largura.
const PORT = layer(104, 84), PX = 52, PY = 34;
export function drawPortrait(c, id, x, y, s, flip = 1, face = 'normal', hat = true) {
  const C = CHARS[id], fp = fighterPal(C), L = PORT, k = L.c;
  k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, L.w, L.h); k.translate(PX, PY); k.scale(0.5, 0.5);
  { const c = k;
  // ombros/paletó
  const sh = [P(-60, 80), P(-30, 36), P(6, 36), P(44, 52), P(66, 80)];
  poly(c, [P(-64, 90), P(-44, 38), P(-6, 30), P(20, 38), P(50, 54), P(70, 90)], OUT);
  poly(c, [P(-60, 90), P(-42, 40), P(-6, 33), P(18, 41), P(47, 56), P(66, 90)], C.suit);
  poly(c, [P(-60, 90), P(-42, 40), P(-20, 36), P(-26, 90)], C.suitShade);
  if (false) {
    c.save(); c.beginPath(); [P(-60, 90), P(-42, 40), P(-6, 33), P(18, 41), P(47, 56), P(66, 90)].forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.clip();
    c.strokeStyle = C.stripe; c.globalAlpha = 0.3; c.lineWidth = 1.4; for (let i = -60; i < 70; i += 11) { c.beginPath(); c.moveTo(i, 34); c.lineTo(i + 2, 92); c.stroke(); } c.globalAlpha = 1; c.restore();
  }
  if (C.id === 'lula') {
    poly(c, [P(-2, 36), P(30, 42), P(34, 90), P(14, 90)], C.shirt);
    c.strokeStyle = C.gold; c.lineWidth = 3.4; c.beginPath(); c.moveTo(0, 40); c.quadraticCurveTo(20, 62, 34, 46); c.stroke();
    poly(c, [P(-6, 34), P(4, 38), P(16, 90), P(0, 90)], C.suitLight); poly(c, [P(32, 44), P(46, 56), P(40, 90), P(34, 90)], C.suitLight);
  } else {
    poly(c, [P(-2, 36), P(30, 42), P(34, 90), P(10, 90)], C.vest);
    poly(c, [P(0, 36), P(20, 40), P(18, 52), P(2, 48)], C.shirt);
    const bw = P(14, 50); poly(c, [bw, P(bw.x - 14, bw.y - 9), P(bw.x - 14, bw.y + 9)], C.tie); poly(c, [bw, P(bw.x + 14, bw.y - 9), P(bw.x + 14, bw.y + 9)], C.tieShade);
    poly(c, [P(-8, 34), P(2, 38), P(8, 90), P(-6, 90)], C.suitLight);
  }
  capsule(c, P(2, 22), P(2, 40), 10, 11, C.skinShade);
  }
  k.setTransform(1, 0, 0, 1, 0, 0); quantize(L, fp.pal, { post: fp.post });
  pixelHead(k, C, PX - 9, PY - 12, face, { glasses: false, hat });
  const m = Math.max(0.5, Math.round(s * 2) / 2);                       // inteiro em pixels do canvas, para não borrar o pixel
  c.save(); c.imageSmoothingEnabled = false; c.translate(x, y); c.scale(m * flip, m); c.drawImage(L.cv, -PX, -PY); c.restore();
}

// ---------------- projéteis ----------------
const GOLD = ['#ffffff', '#fff3a0', '#ffd23a', '#c8901a'], CHOC = ['#c89a72', '#8a5030', '#5a2e18', '#341508'];
const PRL = layer(160, 128), PRP = makePalette([OUT, '#ffffff', ...GOLD, ...CHOC, '#ffe07a', '#d8b24a', '#fff1a0', '#8a0a1e', '#e8202e', '#ff7a1a', '#ff9a1a', '#fff6c0', '#ffd23a', '#c8901a', '#fff3a0']);
export function drawProjectile(c, pr, camX, t) {
  const L = PRL, k = L.c;
  k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, L.w, L.h); k.translate(80, 64); k.scale(0.5, 0.5);
  if (pr.kind === 'onda') drawWave(k, pr, t);
  else if (pr.kind === 'choc') drawBar(k, pr, t);
  else drawOrb(k, 16, t);
  k.setTransform(1, 0, 0, 1, 0, 0); quantize(L, PRP, { dither: true });
  c.save(); c.imageSmoothingEnabled = false; c.translate(Math.round(pr.x - camX), Math.round(pr.y)); c.scale(Math.sign(pr.vx) || 1, 1);
  c.drawImage(L.cv, -80, -64); c.restore();
}
function drawOrb(c, r, t) {                                               // Bolsa Família: esfera de ouro com moedas girando
  const g = c.createRadialGradient(-r * 0.3, -r * 0.35, 1, 0, 0, r * 1.5);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#fff3a0'); g.addColorStop(0.7, '#ffd23a'); g.addColorStop(1, 'rgba(200,144,26,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.5, 0, TAU); c.fill();
  c.strokeStyle = OUT; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
  const g2 = c.createRadialGradient(-r * 0.3, -r * 0.35, 1, 0, 0, r); g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.4, '#ffe07a'); g2.addColorStop(1, '#c8901a');
  c.fillStyle = g2; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  for (let i = 0; i < 4; i++) {
    const a = t * 0.2 + i * Math.PI / 2, x = Math.cos(a) * (r + 12), y = Math.sin(a) * (r + 12) * 0.6;
    c.save(); c.translate(x, y); c.scale(Math.abs(Math.cos(a * 2)) * 0.7 + 0.3, 1);
    circ(c, 0, 0, 6, OUT); circ(c, 0, 0, 4.6, '#ffd23a'); circ(c, -1, -1, 1.6, '#fff'); c.restore();
  }
}
function drawBar(c, pr, t) {                                              // barra de chocolate girando
  c.rotate(t * 0.22);
  const w = 62, h = 34;
  c.fillStyle = OUT; c.fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);
  c.fillStyle = CHOC[2]; c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = CHOC[1]; c.fillRect(-w / 2, -h / 2, w, 6);
  c.strokeStyle = CHOC[3]; c.lineWidth = 2;
  for (let x = -w / 2 + 15.5; x < w / 2; x += 15.5) { c.beginPath(); c.moveTo(x, -h / 2); c.lineTo(x, h / 2); c.stroke(); }
  c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 4; i++) c.fillRect(-w / 2 + 3 + i * 15.5, -h / 2 + 3, 6, 4);
  c.fillStyle = '#d8b24a'; c.fillRect(w / 2 - 12, -h / 2, 12, h); c.fillStyle = '#fff1a0'; c.fillRect(w / 2 - 12, -h / 2, 12, 5);   // papel dourado
}
function drawWave(c, pr, t) {
  const w = pr.w * 2, h = pr.h * 2, choc = pr.choc;
  const bands = choc ? ['#341508', '#5a2e18', '#8a5030', '#c89a72'] : pr.big ? ['#c8901a', '#ffd23a', '#fff3a0', '#ffffff'] : ['#e8202e', '#ff7a1a', '#ffd23a', '#fff6c0'];
  for (let b = 0; b < 4; b++) {
    c.fillStyle = bands[b]; c.beginPath();
    const k = 1 - b * 0.2;
    for (let i = 0; i <= 24; i++) {
      const y = -h / 2 + h * i / 24, taper = 1 - Math.pow(Math.abs(y) / (h / 2), 3), wob = Math.sin(t * 0.5 + y * 0.12) * 6;
      const x = -w * k * taper * 0.5 + wob + b * 4;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    for (let i = 24; i >= 0; i--) {
      const y = -h / 2 + h * i / 24, taper = 1 - Math.pow(Math.abs(y) / (h / 2), 3), wob = Math.sin(t * 0.5 + y * 0.12) * 6;
      c.lineTo(w * k * taper * 0.5 + wob + b * 4 + 14, y);
    }
    c.closePath(); c.fill();
  }
  if (choc) {                                                              // brilho e gotas
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(8, -h * 0.18, 20, 4, 0, 0, TAU); c.fill();
    for (let i = 0; i < 5; i++) circ(c, -w * 0.4 - i * 9, -h * 0.3 + i * 26 + Math.sin(t * 0.3 + i) * 5, 4, '#5a2e18');
  } else if (!pr.big) {                                                    // L branco dentro da onda do FAZ O L
    c.globalAlpha = 0.85;
    c.fillStyle = '#8a0a1e'; c.fillRect(-16, -48, 18, 90); c.fillRect(-16, 14, 44, 18);
    c.fillStyle = '#ffffff'; c.fillRect(-12, -44, 10, 84); c.fillRect(-12, 18, 38, 10);
    c.globalAlpha = 1;
  }
}

// ---------------- pista de chocolate (chão que escorrega) ----------------
const POOLL = layer(340, 40), POOLP = makePalette(['#1d0b05', '#4a2412', '#6a3820', '#8a5030', '#341508', '#c89a72', '#fff0dc', '#5a2e18']);
export function drawPool(c, pl, camX, t, groundY) {
  const x0 = pl.x0 - camX, x1 = pl.x1 - camX, w = Math.min(320, x1 - x0), cx = (x0 + x1) / 2;
  const a = Math.min(1, pl.t / 12, (pl.max - pl.t) / 40);
  if (a <= 0.02) return;
  const L = POOLL, k = L.c;
  k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, L.w, L.h); k.globalAlpha = a; k.translate(170, 22);
  k.fillStyle = '#1d0b05'; k.beginPath(); k.ellipse(0, 0, w / 2 + 3, 9, 0, 0, TAU); k.fill();
  k.fillStyle = '#4a2412'; k.beginPath(); k.ellipse(0, -0.5, w / 2, 7.4, 0, 0, TAU); k.fill();
  k.fillStyle = '#6a3820'; k.beginPath(); k.ellipse(0, -1.6, w / 2 - 6, 4.6, 0, 0, TAU); k.fill();
  k.fillStyle = '#c89a72'; k.beginPath(); k.ellipse(-w * 0.18 + Math.sin(t * 0.04) * 5, -2.4, w * 0.14, 1.4, 0, 0, TAU); k.fill();
  k.beginPath(); k.ellipse(w * 0.2 + Math.sin(t * 0.05 + 1) * 4, -1.4, w * 0.08, 1, 0, 0, TAU); k.fill();
  for (let i = 0; i < 4; i++) {
    const bx = (((i * 0.27 + t * 0.002) % 1) - 0.5) * w * 0.8, by = -5 - ((t * 0.3 + i * 17) % 10);
    k.fillStyle = '#8a5030'; k.fillRect(Math.round(bx), Math.round(by), 2, 2);
  }
  k.setTransform(1, 0, 0, 1, 0, 0); k.globalAlpha = 1; quantize(L, POOLP, { dither: true });
  c.save(); c.imageSmoothingEnabled = false; c.drawImage(L.cv, Math.round(cx) - 170, Math.round(groundY + 5) - 22); c.restore();
}
