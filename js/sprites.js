// Lutadores em alta resolução, desenhados por código (sem foto, sem imagem externa, sem IA imitando rosto).
// Unidade de desenho = 1 pixel do canvas 768×432 (o jogo calcula em unidades lógicas de 384×216; aqui se desenha a 0,5×).
// Membros articulados (rig.js) com contorno, 4 tons de sombreamento e luz de recorte; roupas por personagem.
import { CHARS } from './chars.js';
import { rigFor, joints } from './rig.js';

const OUT = '#120a16', TAU = Math.PI * 2, OW = 2.6;
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
    suit: { base: C.suit, shade: C.suitShade, light: C.suitLight, stripe: C.stripe, rim: C.suitLight },
    pants: { base: C.pants, shade: C.pantsShade, light: C.pantsLight, stripe: C.stripe, rim: C.pantsLight },
    skin: { base: C.skin, shade: C.skinShade, light: C.skinLight, rim: C.skinLight },
    back: { base: dk(C.suit, 0.58), shade: dk(C.suit, 0.38), light: dk(C.suit, 0.85) },
    legBack: { base: dk(C.pants, 0.62), shade: dk(C.pants, 0.42), light: dk(C.pants, 0.86), stripe: C.stripe },
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
function eye(c, x, y, face, big = 1) {
  const D = OUT;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (face === 'hurt') { c.strokeStyle = D; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 5, y - 4); c.lineTo(x + 3, y); c.lineTo(x - 5, y + 4); c.stroke(); return; }
  if (face === 'ko') { c.strokeStyle = D; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 5, y); c.stroke(); return; }
  if (face === 'dizzy') { c.strokeStyle = D; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.moveTo(x + 2.5, y); c.arc(x, y, 2.5, 0, TAU); c.stroke(); return; }
  if (face === 'happy') { c.strokeStyle = D; c.lineWidth = 3; c.beginPath(); c.arc(x, y + 3, 5.5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return; }
  ell(c, x, y, 6.4 * big, 5 * big, '#fff');
  c.strokeStyle = OUT; c.lineWidth = 1.6; c.beginPath(); c.ellipse(x, y, 6.4 * big, 5 * big, 0, 0, TAU); c.stroke();
  circ(c, x + 1.6, y + 0.4, 3.6, '#3a2418'); circ(c, x + 1.8, y + 0.4, 2.2, D); circ(c, x + 3, y - 1.2, 1.2, '#fff');
}
function mouth(c, x, y, face, lip, teeth = true) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (face === 'hurt') { ell(c, x, y + 2, 7, 6, '#3a0a0a'); c.fillStyle = '#fff'; c.fillRect(x - 6, y - 3, 12, 3); ell(c, x, y + 6, 4, 2.5, '#d0605a'); }
  else if (face === 'ko') { ell(c, x, y + 2, 6, 4, '#3a0a0a'); ell(c, x, y + 4, 3.5, 2, '#d0605a'); }
  else if (face === 'dizzy') { c.strokeStyle = lip; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x - 5, y + 1); c.quadraticCurveTo(x, y - 2, x + 5, y + 2); c.stroke(); }
  else if (face === 'happy') { poly(c, [P(x - 8, y - 3), P(x + 9, y - 3), P(x + 7, y + 5), P(x, y + 8), P(x - 6, y + 5)], '#3a0a0a'); if (teeth) { c.fillStyle = '#fff'; c.fillRect(x - 7, y - 3, 15, 4); } }
  else if (face === 'proud') { c.strokeStyle = lip; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 6, y + 2); c.quadraticCurveTo(x + 1, y + 4, x + 8, y - 2); c.stroke(); }
  else if (face === 'angry') { poly(c, [P(x - 7, y - 1), P(x + 7, y - 1), P(x + 5, y + 5), P(x - 5, y + 5)], '#3a0a0a'); if (teeth) { c.fillStyle = '#fff'; c.fillRect(x - 6, y - 1, 12, 3); } }
  else { c.strokeStyle = lip; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 6, y + 1); c.quadraticCurveTo(x + 1, y + 3, x + 7, y); c.stroke(); }
}
function brow(c, x, y, face, col, w = 14, th = 5) {
  const tilt = face === 'angry' ? 0.38 : face === 'hurt' ? -0.3 : face === 'proud' ? 0.1 : 0;
  c.save(); c.translate(x, y); c.rotate(tilt);
  c.fillStyle = col; c.beginPath(); c.moveTo(-w / 2, th / 2); c.quadraticCurveTo(0, -th * 1.2, w / 2, 0); c.lineTo(w / 2, th / 2); c.quadraticCurveTo(0, -th * 0.2, -w / 2, th); c.closePath(); c.fill();
  c.restore();
}
function ear(c, C, x, y) { ell(c, x, y, 5.5, 8, OUT); ell(c, x, y, 4, 6.5, C.skin); ell(c, x - 1, y + 1, 2, 3.5, C.skinDeep); }

function headBase(c, C, path) {
  c.fillStyle = C.skin; c.fill(path);
  c.save(); c.clip(path);
  c.fillStyle = C.skinShade; c.fillRect(-30, -30, 24, 70);                      // lado de trás
  c.fillStyle = C.skinShade; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(4, 30, 28, 12, 0, 0, TAU); c.fill(); c.globalAlpha = 1;   // sob o queixo
  c.fillStyle = C.skinLight; c.beginPath(); c.ellipse(14, -10, 6, 10, 0.2, 0, TAU); c.fill();                                       // testa/face iluminada
  c.restore();
  c.strokeStyle = OUT; c.lineWidth = OW * 1.6; c.lineJoin = 'round'; c.stroke(path);
}

function panama(c, C, tilt = -0.07) {
  c.save(); c.translate(0, -9); c.rotate(tilt);
  // copa: mais alta e retangular, com vincos laterais (pinça) e dobra no topo
  const crown = new Path2D(); crown.moveTo(-17, -15); crown.bezierCurveTo(-19, -26, -17, -40, -9, -43); crown.bezierCurveTo(-3, -40, 4, -41, 10, -43); crown.bezierCurveTo(18, -39, 20, -26, 19, -15); crown.closePath();
  c.strokeStyle = OUT; c.lineWidth = OW * 1.8; c.lineJoin = 'round'; c.stroke(crown);
  c.fillStyle = C.hat; c.fill(crown);
  c.save(); c.clip(crown);
  c.fillStyle = C.hatShade; c.fillRect(-30, -50, 20, 40);                                  // lado de trás
  c.fillStyle = C.hatLight; c.beginPath(); c.ellipse(13, -30, 4.5, 11, 0.1, 0, TAU); c.fill();
  c.strokeStyle = C.hatShade; c.lineWidth = 1.2; c.globalAlpha = 0.55;                      // trama da palha
  for (let y = -42; y < -15; y += 3.4) { c.beginPath(); c.moveTo(-22, y); c.lineTo(24, y + 1); c.stroke(); }
  c.globalAlpha = 1;
  c.strokeStyle = C.hatShade; c.lineWidth = 3.2; c.beginPath(); c.moveTo(-3, -43); c.quadraticCurveTo(1, -35, 1, -28); c.stroke();   // vinco do topo
  c.restore();
  poly(c, [P(-18, -26), P(19.6, -26), P(19.2, -15), P(-17.6, -15)], C.band);                  // faixa escura
  c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(8, -26, 5, 11);
  c.strokeStyle = OUT; c.lineWidth = 2; c.strokeRect(-18, -26, 37.6, 11);
  // aba curta, levemente caída na frente
  c.beginPath(); c.ellipse(1, -13, 27, 6.4, 0.05, 0, TAU);
  c.fillStyle = C.hatShade; c.fill(); c.strokeStyle = OUT; c.lineWidth = OW * 1.5; c.stroke();
  c.beginPath(); c.ellipse(2, -14.2, 25.4, 4.6, 0.05, 0, TAU); c.fillStyle = C.hat; c.fill();
  c.beginPath(); c.ellipse(11, -15.4, 11, 1.8, 0.05, 0, TAU); c.fillStyle = C.hatLight; c.fill();
  c.restore();
}
function topHat(c, C, tilt = -0.04) {
  c.save(); c.rotate(tilt);
  const crown = new Path2D(); crown.moveTo(-18, -14); crown.lineTo(-16, -68); crown.quadraticCurveTo(2, -73, 20, -68); crown.lineTo(21, -14); crown.closePath();
  c.strokeStyle = OUT; c.lineWidth = OW * 1.8; c.lineJoin = 'round'; c.stroke(crown);
  c.fillStyle = C.hat; c.fill(crown);
  c.save(); c.clip(crown);
  c.fillStyle = C.hatShade; c.fillRect(-30, -80, 24, 70);
  c.fillStyle = C.hatLight; c.fillRect(11, -72, 6, 60);
  c.restore();
  ell(c, 2, -68, 18, 4.5, C.hatLight); c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.ellipse(2, -68, 18, 4.5, 0, 0, TAU); c.stroke();
  poly(c, [P(-17.5, -34), P(21, -34), P(21.4, -17), P(-18, -17)], C.band);                    // faixa larga
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(10, -34, 6, 17);
  c.strokeStyle = OUT; c.lineWidth = 2; c.strokeRect(-17.5, -34, 38.5, 17);
  c.fillStyle = C.gold; c.fillRect(6, -32, 13, 13); c.fillStyle = C.band; c.fillRect(9.5, -29, 6, 7);                // fivela dourada
  c.strokeStyle = OUT; c.lineWidth = 1.6; c.strokeRect(6, -32, 13, 13);
  c.beginPath(); c.ellipse(2, -13, 29, 7, 0.03, 0, TAU); c.fillStyle = C.hatShade; c.fill(); c.strokeStyle = OUT; c.lineWidth = OW * 1.5; c.stroke();
  c.beginPath(); c.ellipse(3, -14.5, 27, 5, 0.03, 0, TAU); c.fillStyle = C.hat; c.fill();
  c.beginPath(); c.ellipse(12, -16, 12, 2, 0.03, 0, TAU); c.fillStyle = C.hatLight; c.fill();
  c.restore();
}
function glasses(c) {
  poly(c, [P(4, -10), P(25, -10), P(24, 2), P(21, 5), P(7, 5), P(4, 1)], OUT);
  poly(c, [P(6, -8), P(23, -8), P(22, 1), P(20, 3), P(8, 3), P(6, 0)], '#0a0a12');
  poly(c, [P(8, -7), P(14, -7), P(10, 2), P(8, 2)], 'rgba(160,190,255,.45)');
  line(c, P(4, -7), P(-10, -4), 3, OUT);
}

// rostos: origem no centro da cabeça, de frente para +x
const HEADS = {
  lula(c, C, face, R) {
    // cabelo branco de trás
    ell(c, -10, -2, 15, 21, OUT); ell(c, -10, -2, 13.4, 19.6, C.hair); ell(c, -15, 4, 8, 14, C.hairShade);
    const skull = new Path2D(); skull.moveTo(-17, -4); skull.bezierCurveTo(-17, -22, -2, -26, 8, -24); skull.bezierCurveTo(18, -22, 21, -12, 21, -2);
    skull.lineTo(22, 6); skull.bezierCurveTo(23, 18, 16, 27, 5, 27); skull.bezierCurveTo(-8, 27, -17, 18, -17, 6); skull.closePath();
    headBase(c, C, skull);
    ear(c, C, -6, 4);
    // barba cheia
    const beard = new Path2D(); beard.moveTo(-10, 4); beard.bezierCurveTo(-18, 12, -12, 30, 4, 32); beard.bezierCurveTo(18, 33, 26, 24, 25, 14);
    beard.lineTo(22, 11); beard.bezierCurveTo(15, 14, 9, 10, 5, 9); beard.bezierCurveTo(1, 8, -5, 4, -10, 4); beard.closePath();
    c.fillStyle = C.beard; c.fill(beard); c.save(); c.clip(beard);
    c.fillStyle = C.beardShade; c.fillRect(-30, -4, 22, 50); c.globalAlpha = 0.5; c.beginPath(); c.ellipse(4, 34, 26, 8, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = '#fff'; c.lineWidth = 1.4; c.globalAlpha = 0.8;
    for (const [x, y] of [[8, 14], [12, 22], [2, 24], [16, 16]]) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 2, y + 4, x + 1, y + 8); c.stroke(); }
    c.globalAlpha = 1; c.restore();
    const jaw = new Path2D(); jaw.moveTo(-10, 4); jaw.bezierCurveTo(-18, 12, -12, 30, 4, 32); jaw.bezierCurveTo(18, 33, 26, 24, 25, 14);
    c.strokeStyle = OUT; c.lineWidth = OW * 1.6; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(jaw);              // contorno só na mandíbula
    const cheek = new Path2D(); cheek.moveTo(25, 14); cheek.lineTo(22, 11); cheek.bezierCurveTo(15, 14, 9, 10, 5, 9); cheek.bezierCurveTo(1, 8, -5, 4, -10, 4);
    c.strokeStyle = C.beardShade; c.lineWidth = 1.8; c.stroke(cheek);                                                  // bochecha: linha suave
    // bigode e nariz
    ell(c, 16, 12, 11, 4.2, C.beard, 0.05); ell(c, 14, 13.4, 9, 2.4, C.beardShade, 0.05); c.strokeStyle = OUT; c.lineWidth = 1.6; c.beginPath(); c.ellipse(16, 12, 11, 4.2, 0.05, 0, TAU); c.stroke();
    ell(c, 23, 5, 5.6, 6.4, OUT); ell(c, 23, 5, 4.2, 5, C.skin); ell(c, 21.6, 7.4, 3, 2.4, C.skinShade); ell(c, 24.2, 2.6, 1.8, 2.4, C.skinLight);
    mouth(c, 13, face === 'happy' || face === 'hurt' || face === 'angry' ? 17 : 19, face, '#5a1a1a', true);
    eye(c, 11, -4, face); brow(c, 10.5, -12.5, face, C.hairShade, 17, 6);
    // cabelo do topo (parte visível sob o chapéu e nas têmporas)
    const hair = new Path2D(); hair.moveTo(-22, 6); hair.bezierCurveTo(-27, -14, -14, -27, 2, -26); hair.bezierCurveTo(8, -26, 12, -23, 13, -19);
    hair.bezierCurveTo(6, -19, 0, -14, -3, -8); hair.bezierCurveTo(-8, -3, -12, 2, -12, 11); hair.closePath();
    c.fillStyle = C.hair; c.fill(hair); c.strokeStyle = OUT; c.lineWidth = OW * 1.3; c.stroke(hair);
    c.strokeStyle = C.hairShade; c.lineWidth = 1.6; for (const [x, y] of [[-14, -12], [-8, -18], [-18, 0]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 8); c.stroke(); }
    if (R.glasses) glasses(c);
    if (R.hat !== false) panama(c, C);
  },
  flavio(c, C, face, R) {
    ell(c, -12, -3, 13, 19, OUT); ell(c, -12, -3, 11.5, 17.5, C.hair);
    const skull = new Path2D(); skull.moveTo(-17, -2); skull.bezierCurveTo(-18, -22, -4, -26, 8, -24); skull.bezierCurveTo(18, -22, 21, -12, 21, -2);
    skull.lineTo(22, 8); skull.bezierCurveTo(22, 16, 21, 21, 17, 25); skull.bezierCurveTo(12, 29, 4, 29, -3, 26); skull.bezierCurveTo(-12, 22, -17, 14, -17, 6); skull.closePath();
    headBase(c, C, skull);
    // mandíbula marcada
    c.strokeStyle = C.skinShade; c.lineWidth = 1.6; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(-8, 12); c.quadraticCurveTo(0, 26, 15, 22); c.stroke(); c.globalAlpha = 1;
    ear(c, C, -6, 5);
    // sombra de barba leve
    c.fillStyle = 'rgba(42,28,18,.10)'; c.beginPath(); c.moveTo(-3, 14); c.quadraticCurveTo(8, 29, 19, 22); c.lineTo(18, 14); c.quadraticCurveTo(8, 17, -3, 14); c.fill();
    ell(c, 22, 6, 4.4, 5.6, OUT); ell(c, 22, 6, 3, 4.2, C.skin); ell(c, 20.6, 8, 2.4, 2, C.skinShade); ell(c, 23, 3.6, 1.4, 2, C.skinLight);
    mouth(c, 13, 17, face, '#8a3a3a', true);
    eye(c, 11, -3, face); brow(c, 10.5, -11, face, C.hair, 17, 6.5);
    // cabelo escuro: costeleta + franja sob o chapéu
    const hair = new Path2D(); hair.moveTo(-18, -2); hair.bezierCurveTo(-20, -20, -6, -26, 6, -25); hair.bezierCurveTo(14, -24, 20, -19, 20, -12);
    hair.bezierCurveTo(14, -15, 6, -16, 0, -13); hair.bezierCurveTo(-4, -8, -6, -2, -8, 10); hair.lineTo(-13, 12); hair.bezierCurveTo(-17, 8, -18, 4, -18, -2); hair.closePath();
    c.fillStyle = C.hair; c.fill(hair); c.strokeStyle = OUT; c.lineWidth = OW * 1.3; c.stroke(hair);
    c.fillStyle = C.hairShade; c.beginPath(); c.ellipse(4, -19, 9, 2.4, -0.12, 0, TAU); c.fill();
    topHat(c, C);
  },
};
export function drawHead(c, id, face, R = {}, scale = 1) {
  c.save(); c.scale(scale, scale); HEADS[id](c, CHARS[id], face, R); c.restore();
}

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
  if (C.stripe) {
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
  c.save(); c.globalAlpha = 0.6 + 0.3 * ((t >> 1) & 1); c.lineJoin = 'miter';
  const L = (g, col) => { c.fillStyle = col; c.fillRect(cx - g, cy - v - g, th + g * 2, v + g * 2); c.fillRect(cx - g, cy - th - g, s + th + g * 2, th + g * 2); };
  L(7, '#e8202e'); L(3, '#ff9a1a'); L(-3, '#fff3a0');
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
  const g = c.createRadialGradient(cx, cy, 20, cx, cy, 118); g.addColorStop(0, 'rgba(122,255,200,.05)'); g.addColorStop(1, 'rgba(122,255,200,.3)');
  c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, 70, 116, 0, 0, TAU); c.fill();
  c.strokeStyle = '#baffe0'; c.lineWidth = 3; c.globalAlpha = 0.9; c.beginPath(); c.ellipse(cx, cy, 70, 116, 0, 0, TAU); c.stroke();
  c.fillStyle = '#fff';
  for (let a = 0; a < 20; a++) { const an = a / 20 * TAU + t * 0.03; c.globalAlpha = 0.7; c.fillRect(cx + Math.cos(an) * 70 - 2, cy + Math.sin(an) * 116 - 2, 4, 4); }
  c.restore();
}
// ---------------- lutador completo ----------------
// c já está em unidades lógicas (384×216); camX em unidades lógicas.
export function drawFighter(c, f, camX, ox = 0, oy = 0) {
  if (f.state === 'gone') return;
  const C = f.C, R = rigFor(f), J = joints(R), pal = palettes(C), id = C.id;
  c.save();
  c.translate(Math.round((f.x - camX + ox) * 2) / 2, Math.round((f.y + oy) * 2) / 2);
  c.scale(0.5 * f.facing, 0.5);
  c.lineJoin = 'round';
  if (R.aura > 0) drawAura(c, R.aura, f.t, J);
  if (R.pillar) drawPillar(c, f.t, J);
  // braço de trás (e bengala do Flávio na mão de trás)
  const armLimb = (A, front) => {
    const sleeve = front ? pal.suit : pal.back;
    limb(c, [A.s, A.e, A.h], [13.5, 11.5, 10.5], sleeve);
    cuff(c, C, A.e, A.h, id === 'lula' ? C.shirt : C.shirt, { base: id === 'lula' ? C.shirt : C.shirt, shade: '#8f8f90', light: '#fff' });
  };
  armLimb(J.armB, false);
  if (id === 'flavio') cane(c, C, J.armB.h, f.state === 'win' || f.state === 'triumph');
  hand(c, C, J.armB.h, 'fist', false);
  // pernas
  const legPal = pal.pants, legB = pal.legBack;
  const leg = (L, back) => {
    limb(c, [L.h, L.k, L.a], [18.5, 14.5, 10.5], back ? legB : legPal);
    shoe(c, C, L.a, L.k);
    // barra da calça
    const dx = L.a.x - L.k.x, dy = L.a.y - L.k.y, d = Math.hypot(dx, dy) || 1;
    const a = P(L.a.x - dx / d * 14, L.a.y - dy / d * 14), b = P(L.a.x - dx / d * 8, L.a.y - dy / d * 8);
    capsule(c, a, b, 12, 12, back ? dk(C.pants, 0.45) : C.pantsShade);
  };
  leg(J.legB, true); leg(J.legF, false);
  torso(c, C, J, R, id);
  neck(c, C, J, R);
  c.save(); c.translate(J.head.x, J.head.y); HEADS[id](c, C, R.face, R); c.restore();
  armLimb(J.armF, true);
  hand(c, C, J.armF.h, R.shape, true);
  if (R.L > 0) drawBigL(c, R.L, f.t, J.armF.h);
  if (R.shieldFront) drawShieldFront(c, f.t, J);
  if (R.dome) drawDome(c, f.t, J);
  if (f.state === 'dizzy') {
    c.save();
    for (let i = 0; i < 3; i++) {
      const a = f.t * 0.1 + i * TAU / 3, x = J.head.x + Math.cos(a) * 36, y = J.head.y - 46 + Math.sin(a) * 8;
      c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#ffd23a'; c.beginPath();
      for (let k = 0; k < 5; k++) { const aa = k * TAU / 5 - Math.PI / 2; c.lineTo(Math.cos(aa) * 8, Math.sin(aa) * 8); c.lineTo(Math.cos(aa + TAU / 10) * 3.4, Math.sin(aa + TAU / 10) * 3.4); }
      c.closePath(); c.fill(); c.restore();
    }
    c.restore();
  }
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
export function drawPortrait(c, id, x, y, s, flip = 1, face = 'normal', hat = true) {
  const C = CHARS[id], pal = palettes(C);
  c.save(); c.translate(x, y); c.scale(0.5 * s * flip, 0.5 * s);
  // ombros/paletó
  const sh = [P(-60, 80), P(-30, 36), P(6, 36), P(44, 52), P(66, 80)];
  poly(c, [P(-64, 90), P(-44, 38), P(-6, 30), P(20, 38), P(50, 54), P(70, 90)], OUT);
  poly(c, [P(-60, 90), P(-42, 40), P(-6, 33), P(18, 41), P(47, 56), P(66, 90)], C.suit);
  poly(c, [P(-60, 90), P(-42, 40), P(-20, 36), P(-26, 90)], C.suitShade);
  if (C.stripe) {
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
  c.translate(0, 0);
  HEADS[id](c, C, face, { glasses: false, hat });
  c.restore();
}

// ---------------- projéteis ----------------
const GOLD = ['#ffffff', '#fff3a0', '#ffd23a', '#c8901a'], CHOC = ['#c89a72', '#8a5030', '#5a2e18', '#341508'];
export function drawProjectile(c, pr, camX, t) {
  c.save();
  c.translate(pr.x - camX, pr.y);
  c.scale(0.5 * (Math.sign(pr.vx) || 1), 0.5);
  if (pr.kind === 'onda') drawWave(c, pr, t);
  else if (pr.kind === 'choc') drawBar(c, pr, t);
  else drawOrb(c, 16, t);
  c.restore();
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
export function drawPool(c, pl, camX, t, groundY) {
  const x0 = pl.x0 - camX, x1 = pl.x1 - camX, w = x1 - x0, cx = (x0 + x1) / 2;
  const a = Math.min(1, pl.t / 12, (pl.max - pl.t) / 40);
  c.save(); c.globalAlpha = Math.max(0, a);
  c.translate(cx, groundY + 5);
  c.fillStyle = '#1d0b05'; c.beginPath(); c.ellipse(0, 0, w / 2 + 3, 9, 0, 0, TAU); c.fill();
  c.fillStyle = '#4a2412'; c.beginPath(); c.ellipse(0, -0.5, w / 2, 7.4, 0, 0, TAU); c.fill();
  c.fillStyle = '#6a3820'; c.beginPath(); c.ellipse(0, -1.6, w / 2 - 6, 4.6, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,230,200,.5)'; c.beginPath(); c.ellipse(-w * 0.18 + Math.sin(t * 0.04) * 5, -2.4, w * 0.14, 1.4, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(w * 0.2 + Math.sin(t * 0.05 + 1) * 4, -1.4, w * 0.08, 1, 0, 0, TAU); c.fill();
  for (let i = 0; i < 4; i++) {
    const bx = (((i * 0.27 + t * 0.002) % 1) - 0.5) * w * 0.8, by = -5 - ((t * 0.3 + i * 17) % 10);
    c.fillStyle = 'rgba(138,80,48,.9)'; c.beginPath(); c.arc(bx, by, 1.5, 0, TAU); c.fill();
  }
  c.restore();
}
