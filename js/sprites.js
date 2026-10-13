// Sprites procedurais: caricaturas em pixel art desenhadas com retângulos (sem imagem externa).
// Escala ~100 px de altura, sombreamento em 3 tons (sombra / base / luz) e contorno escuro.
import { CHARS } from './chars.js';

const OUT = '#140d18';
const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const ob = (c, x, y, w, h, col) => { px(c, x - 1, y - 1, w + 2, h + 2, OUT); px(c, x, y, w, h, col); };
// peça com contorno + 3 tons: sombra no lado de trás (esquerda), luz na borda da frente (direita)
function part(c, x, y, w, h, base, shade, light, sw = 0.3) {
  ob(c, x, y, w, h, base);
  const s = Math.max(1, Math.round(w * sw));
  if (w > 3) px(c, x, y, s, h, shade);
  if (light && w > 4 && h > 3) px(c, x + w - 1, y + 1, 1, Math.max(1, h - 3), light);
}

// ---------- rostos (cabeça 20x24, virada para a direita) ----------
function eyes(c, x, y, face) {
  const D = OUT;
  if (face === 'hurt') { px(c, x, y + 1, 3, 1, D); px(c, x + 1, y, 1, 1, D); px(c, x + 1, y + 2, 1, 1, D); }
  else if (face === 'ko') px(c, x - 1, y + 1, 4, 1, D);                                   // olhos fechados
  else if (face === 'dizzy') { px(c, x - 1, y, 4, 1, D); px(c, x + 1, y + 1, 2, 1, D); }  // pálpebra caída
  else if (face === 'happy') { px(c, x, y + 1, 1, 1, D); px(c, x + 1, y, 1, 1, D); px(c, x + 2, y + 1, 1, 1, D); }
  else { px(c, x - 1, y, 4, 3, '#fff'); px(c, x + 1, y, 2, 3, D); px(c, x + 2, y, 1, 1, '#fff'); }
}
function mouth(c, x, y, face, lip) {
  if (face === 'hurt') { px(c, x - 1, y - 1, 6, 4, '#3a0a0a'); px(c, x - 1, y - 1, 6, 1, '#fff'); }
  else if (face === 'ko') px(c, x, y - 1, 5, 2, '#3a0a0a');
  else if (face === 'dizzy') px(c, x, y, 4, 1, lip);
  else if (face === 'happy') { px(c, x - 2, y - 1, 8, 3, '#fff'); px(c, x - 2, y + 2, 8, 1, lip); px(c, x + 1, y - 1, 1, 3, '#ddd'); }
  else if (face === 'proud') { px(c, x, y, 5, 1, lip); px(c, x + 5, y - 1, 1, 1, lip); px(c, x - 1, y - 1, 1, 1, lip); }
  else if (face === 'angry') { px(c, x - 1, y, 6, 2, '#3a0a0a'); px(c, x - 1, y, 6, 1, '#fff'); }
  else px(c, x, y, 5, 1, lip);
}

const FACES = {
  lula(c, x, y, face) {
    const C = CHARS.lula;
    ob(c, x, y, 20, 24, C.skin);
    px(c, x + 1, y + 1, 4, 22, C.skinShade);                              // lado de trás
    px(c, x + 16, y + 3, 3, 6, C.skinLight);                              // testa iluminada
    // cabelo branco: testa alta, volume atrás e dos lados
    ob(c, x - 1, y - 3, 15, 5, C.hair); px(c, x + 3, y - 2, 8, 1, '#ffffff'); px(c, x - 1, y, 15, 1, C.hairShade);
    ob(c, x - 3, y + 1, 7, 13, C.hair); px(c, x - 3, y + 8, 3, 6, C.hairShade); px(c, x - 4, y + 3, 2, 5, C.hair);
    px(c, x - 1, y + 2, 1, 6, '#ffffff');
    px(c, x + 5, y + 9, 4, 6, C.skinShade); px(c, x + 6, y + 10, 2, 4, '#8a5a3a');      // orelha
    const browY = face === 'angry' ? y + 8 : y + 7;                                     // sobrancelha grisalha
    px(c, x + 11, browY, 8, 3, C.beard); px(c, x + 11, browY + 2, 8, 1, C.beardShade);
    if (face === 'angry') px(c, x + 16, browY + 3, 3, 1, C.beardShade);
    eyes(c, x + 14, y + 10, face);
    px(c, x + 16, y + 13, 3, 2, '#c97858');                              // bochecha
    px(c, x + 4, y + 14, 18, 10, C.beard); px(c, x + 6, y + 24, 13, 3, C.beard);       // barba cheia
    px(c, x + 4, y + 18, 5, 6, C.beardShade); px(c, x + 8, y + 25, 9, 2, C.beardShade);
    px(c, x + 6, y + 27, 13, 1, OUT); px(c, x + 19, y + 24, 1, 3, OUT); px(c, x + 22, y + 15, 1, 8, OUT);
    px(c, x + 15, y + 15, 5, 1, '#f4f4f0');
    ob(c, x + 19, y + 10, 4, 6, C.skin); px(c, x + 19, y + 14, 4, 2, C.skinShade); px(c, x + 21, y + 11, 1, 2, C.skinLight); // nariz
    px(c, x + 14, y + 16, 9, 3, C.beardShade); px(c, x + 15, y + 16, 6, 1, C.beard);   // bigode
    mouth(c, x + 16, y + 20, face, '#4a1414');
  },
  flavio(c, x, y, face) {
    const C = CHARS.flavio;
    ob(c, x, y, 20, 24, C.skin);
    px(c, x + 1, y + 1, 4, 22, C.skinShade);
    px(c, x + 16, y + 3, 3, 6, C.skinLight);
    ob(c, x + 4, y + 22, 15, 3, C.skin); px(c, x + 4, y + 24, 15, 1, C.skinShade);    // queixo
    ob(c, x - 1, y - 3, 21, 6, C.hair); ob(c, x - 2, y + 2, 7, 10, C.hair);              // cabelo curto
    px(c, x + 15, y + 3, 5, 2, C.hair); px(c, x + 6, y - 2, 9, 1, C.hairShade); px(c, x + 9, y - 1, 6, 1, '#5d4636');
    px(c, x + 4, y + 6, 3, 7, C.hair);                                      // costeleta
    px(c, x + 6, y + 9, 4, 6, C.skinShade); px(c, x + 7, y + 10, 2, 4, '#9a6040');      // orelha
    const browY = face === 'angry' ? y + 9 : y + 8;
    px(c, x + 13, browY, 7, 2, C.hair);
    if (face === 'angry') px(c, x + 17, browY + 2, 3, 1, C.hair);
    eyes(c, x + 15, y + 11, face);
    ob(c, x + 19, y + 11, 3, 5, C.skin); px(c, x + 19, y + 14, 3, 2, C.skinShade);      // nariz
    mouth(c, x + 15, y + 18, face, '#6a2020');
  },
};

// ---------- pose a partir do estado do lutador ----------
export function poseOf(f) {
  const p = { hip: -42, lean: 0, hdx: 0, hdy: 0, legs: 'stand', fArm: 'guard', bArm: 'guard', face: 'normal', reach: 0,
    walk: 0, lying: false, L: 0, breath: 0, pillar: false, shieldFront: false, dome: false, aura: 0 };
  const s = f.state, t = f.t, gold = f.C.fx === 'gold';
  if (s === 'idle') { const b = (t >> 4) & 3; p.hdy = b === 1 || b === 2 ? 1 : 0; p.breath = p.hdy; }
  else if (s === 'walk' || s === 'leave') {
    p.legs = 'walk'; p.walk = t; p.hdy = (t >> 3) & 1;
    if (s === 'leave') { p.fArm = 'dangle'; p.bArm = 'dangle'; }
  }
  else if (s === 'crouch' || s === 'lag') { p.hip = -24; p.legs = 'crouch'; }
  else if (s === 'jump') { p.legs = f.vy < -3 ? 'straight' : 'tuck'; if (f.vy < -3) { p.fArm = 'up'; p.bArm = 'up2'; } }
  else if (s === 'block') { p.fArm = 'block'; p.bArm = 'block'; p.lean = -2; p.face = 'angry'; if (f.crouching) { p.hip = -24; p.legs = 'crouch'; } }
  else if (s === 'hit') {
    p.face = 'hurt'; p.fArm = 'flail'; p.bArm = 'flail';
    if (f.hitHigh) { p.lean = -4; p.hdx = -3; p.hdy = 1; } else { p.lean = 3; p.hdy = 4; p.hip = -38; p.fArm = 'dangle'; }
    if (!f.onGround) p.legs = 'tuck';
  }
  else if (s === 'ko') { p.face = 'ko'; p.fArm = 'flail'; p.bArm = 'flail'; p.lying = f.onGround; if (!f.onGround) p.legs = 'tuck'; }
  else if (s === 'dizzy') { p.face = 'dizzy'; p.fArm = 'dangle'; p.bArm = 'dangle'; p.hdx = Math.round(Math.sin(t * 0.12) * 2); p.lean = p.hdx; }
  else if (s === 'win') { p.bArm = (t >> 4) & 1 ? 'up' : 'up2'; p.fArm = 'guard'; p.face = 'happy'; }
  else if (s === 'triumph') { p.fArm = 'raiseFist'; p.bArm = 'dangle'; p.face = 'proud'; p.aura = 1; }
  else if (s === 'attack') {
    const m = f.mv, ph = f.phase();
    if (m.crouch) { p.hip = -24; p.legs = 'crouch'; }
    if (m.air) p.legs = 'tuck';
    p.face = 'angry';
    if (m.arm) {
      if (ph === 0 && m.heavy) p.fArm = 'windup';
      else { p.fArm = 'punch'; p.reach = m.reach[ph]; }
      if (ph === 0) p.lean = m.heavy ? -2 : 0; else if (ph === 1 && m.lean) p.lean = m.lean;
    }
    if (m.legs) {
      if (ph === 0) { if (!m.air && !m.crouch) p.legs = 'chamber'; }
      else if (ph === 1 || m.air) p.legs = m.legs;
      else p.legs = m.crouch ? 'crouch' : 'chamber';
      if (m.legs === 'sweep' && ph === 1) p.hip = -20;
      if (ph === 1 && m.lean) p.lean = m.lean;
    }
    switch (m.pose) {
      case 'throw':
        if (ph === 0) { p.fArm = 'windup'; p.bArm = 'windup'; p.lean = -3; }
        else { p.fArm = 'throw'; p.bArm = 'throw'; p.lean = 4; }
        break;
      case 'L':
        p.face = 'proud';
        if (ph === 0 && f.af < m.st * 0.35) { p.fArm = 'raise'; p.lean = -1; }
        else { p.fArm = 'L'; p.lean = 2; }
        if (ph === 0) p.L = Math.min(1, f.af / m.st);
        break;
      case 'super':                                     // DEMOCRACIA: punho erguido, luz dourada, depois a onda
        p.face = 'proud';
        if (ph === 0) { p.fArm = 'raiseFist'; p.bArm = 'dangle'; p.aura = Math.min(1, f.af / m.st); }
        else { p.fArm = 'throw'; p.bArm = 'throw'; p.lean = 4; p.aura = ph === 1 ? 1 : 0.4; }
        break;
      case 'uppercut':
        if (ph === 0) { p.hip = -30; p.legs = 'crouch'; p.fArm = 'windup'; }
        else if (ph === 1) { p.fArm = 'uppercut'; p.legs = 'straight'; p.lean = 2; p.pillar = gold; }
        else { p.legs = 'tuck'; p.fArm = 'up'; }
        break;
      case 'dash':
        if (ph === 0) { p.hip = -32; p.legs = 'crouch'; p.lean = -3; }
        else {
          p.legs = 'lunge'; p.hip = -38; p.lean = ph === 1 ? 5 : 2;
          if (gold) { p.fArm = 'throw'; p.bArm = 'throw'; p.shieldFront = ph === 1; p.face = 'proud'; }
          else { p.fArm = 'block'; p.bArm = 'block'; }
        }
        break;
      case 'shield':                                    // SUS: escudo de energia que protege e recupera vida
        p.face = 'proud';
        if (ph === 0) { p.fArm = 'windup'; p.bArm = 'windup'; }
        else if (ph === 1) { p.fArm = 'throw'; p.bArm = 'throw'; p.dome = true; }
        break;
    }
  }
  return p;
}

function drawLegs(c, C, p) {
  const h = p.hip, S = C.pantsShade;
  const shoe = (x, y, w = 14, hh = 5) => { ob(c, x, y, w, hh, C.shoes); px(c, x + 2, y, w - 4, 1, C.shoeLight); };
  const leg = (x, y, w, hh, back) => part(c, x, y, w, hh, back ? C.pantsShade : C.pants, back ? '#0e1328' : S, back ? null : C.pantsLight, 0.35);
  const backStand = (k = 0, la = 0) => { leg(-11 + k, h, 9, -h - 5 - la, true); shoe(-13 + k, -5 - la, 13); };
  const backCrouch = () => { leg(-15, h, 10, 13, true); leg(-15, h + 10, 9, -h - 15, true); shoe(-17, -5, 13); };
  const backTuck = () => { leg(-10, h, 9, 12, true); shoe(-12, h + 12, 11); };
  switch (p.legs) {
    case 'stand': case 'walk': {
      const k = p.legs === 'walk' ? Math.round(Math.sin(p.walk * 0.22) * 5) : 0;
      const la = k > 2 ? 2 : 0, lb = k < -2 ? 2 : 0;
      backStand(k, la);
      leg(2 - k, h, 9, -h - 5 - lb, false); shoe(2 - k, -5 - lb, 14);
      px(c, 3 - k, h + 20, 6, 1, S);                                      // dobra do joelho
      break;
    }
    case 'crouch':
      backCrouch(); leg(1, h, 17, 9, false); leg(11, h + 6, 9, -h - 11, false); shoe(11, -5, 14);
      px(c, 12, h + 2, 1, 6, S); break;
    case 'tuck':
      backTuck(); leg(2, h, 14, 8, false); leg(11, h + 4, 8, 12, false); shoe(11, h + 16, 13); break;
    case 'straight':
      leg(-8, h, 8, 34, true); shoe(-9, h + 34, 11, 5); leg(1, h, 8, 32, false); shoe(1, h + 32, 12, 5); break;
    case 'chamber':
      backStand(); leg(1, h - 4, 14, 10, false); leg(10, h + 4, 9, 18, false); shoe(10, h + 20, 13); break;
    case 'kickLow':
      backStand(); leg(1, h, 12, 10, false); leg(10, h + 6, 26, 9, false); shoe(35, h + 2, 6, 15);
      px(c, 12, h + 6, 1, 9, S); break;
    case 'kickHigh':
      backStand(); leg(1, h - 6, 12, 11, false); leg(10, h - 14, 28, 9, false); shoe(37, h - 18, 6, 15); break;
    case 'sweep':
      backCrouch(); leg(0, -13, 40, 8, false); shoe(39, -17, 6, 13); break;
    case 'airKick':
      backTuck(); leg(1, h, 13, 9, false); leg(10, h + 7, 24, 9, false); shoe(33, h + 3, 6, 15); break;
    case 'lunge':                                       // avanço: perna de trás esticada em diagonal
      leg(-14, h, 9, 14, true); leg(-20, h + 12, 9, 14, true); leg(-26, h + 24, 9, -h - 29, true); shoe(-30, -5, 13);
      leg(1, h, 15, 9, false); leg(10, h + 6, 9, -h - 11, false); shoe(10, -5, 14); break;
  }
}

function drawArm(c, C, p, front) {
  const kind = front ? p.fArm : p.bArm;
  const top = p.hip - 30;
  const sx = p.lean + (front ? 6 : -10), sy = top + 3;
  const col = front ? C.suit : C.suitShade, sh = front ? C.suitShade : '#0c1124', li = front ? C.suitLight : null;
  const sk = front ? C.skin : C.skinShade;
  const sleeve = (x, y, w, h) => part(c, x, y, w, h, col, sh, li, 0.3);
  const fist = (x, y, w = 8, h = 8) => { ob(c, x, y, w, h, sk); px(c, x, y + h - 2, w, 2, C.skinShade); if (front) px(c, x + 2, y + 1, w - 3, 1, C.skinLight); };
  switch (kind) {
    case 'guard': sleeve(sx, sy, 7, 13); sleeve(sx + 3, sy + 8, 14, 7); px(c, sx + 4, sy + 8, 1, 7, sh); fist(sx + 15, sy + 2); break;
    case 'punch': {
      const r = Math.max(6, p.reach);
      sleeve(sx, sy, r, 8); px(c, sx + r - 3, sy, 3, 8, C.shirt); px(c, sx + Math.round(r / 2), sy + 1, 1, 6, sh);
      fist(sx + r, sy - 1, 9, 10); break;
    }
    case 'windup': sleeve(sx - 6, sy, 7, 12); fist(sx - 9, sy + 9); break;
    case 'block': sleeve(sx + 3, sy - 2, 7, 10); sleeve(sx + 9, sy - 12, 7, 16); fist(sx + 9, sy - 19, 8, 7); break;
    case 'flail': sleeve(sx - 7, sy - 9, 7, 13); fist(sx - 10, sy - 16); break;
    case 'dangle': sleeve(sx, sy, 7, 18); fist(sx, sy + 18, 7, 7); break;
    case 'up': sleeve(sx - 5, sy - 8, 7, 11); sleeve(sx - 9, sy - 30, 7, 24); fist(sx - 10, sy - 38, 9, 9); break;
    case 'up2': sleeve(sx - 3, sy - 6, 7, 10); sleeve(sx - 6, sy - 24, 7, 20); fist(sx - 7, sy - 31, 9, 8); break;
    case 'throw': sleeve(sx, sy + (front ? 0 : -3), 18, 8); ob(c, sx + 18, sy - 3 + (front ? 0 : -3), 6, 13, sk); break;
    case 'raise': sleeve(sx, sy - 4, 7, 12); sleeve(sx + 3, sy - 14, 7, 12); fist(sx + 2, sy - 21); break;
    case 'raiseFist':                                   // punho erguido à frente do rosto, sem cobri-lo
      sleeve(sx + 2, sy - 6, 8, 10); sleeve(sx + 9, sy - 28, 7, 24); fist(sx + 8, sy - 37, 9, 10); break;
    case 'L': // mão fazendo o L: indicador para cima, polegar para a frente
      sleeve(sx, sy - 6, 7, 10); sleeve(sx + 4, sy - 16, 7, 14);
      ob(c, sx + 3, sy - 24, 9, 9, sk); px(c, sx + 3, sy - 17, 9, 2, C.skinShade);
      ob(c, sx + 5, sy - 37, 4, 13, sk); px(c, sx + 5, sy - 37, 1, 13, C.skinShade);
      ob(c, sx + 12, sy - 22, 9, 4, sk); px(c, sx + 12, sy - 19, 9, 1, C.skinShade);
      break;
    case 'uppercut': sleeve(sx, sy - 14, 8, 16); fist(sx - 1, sy - 24, 10, 10); break;
  }
}

function drawTorso(c, C, p) {
  const top = p.hip - 30, x = -12 + p.lean;
  part(c, x, top, 24, 34, C.suit, C.suitShade, C.suitLight, 0.22);
  px(c, x + 12, top, 8, 10, C.shirt); px(c, x + 12, top, 1, 10, '#c8c8c4');
  px(c, x + 15, top + 2, 3, 14, C.tie); px(c, x + 14, top + 1, 5, 3, C.tie); px(c, x + 15, top + 3, 1, 13, C.tieShade);
  px(c, x + 11, top, 1, 14, C.suitShade); px(c, x + 20, top, 1, 12, C.suitShade);            // lapelas
  px(c, x + 10, top + 1, 1, 8, C.suitLight);
  px(c, x + 17, top + 20, 1, 1, C.suitLight); px(c, x + 17, top + 25, 1, 1, C.suitLight);   // botões
  px(c, x + 6, top + 22, 6, 1, C.suitShade); px(c, x + 5, top + 27, 4, 1, C.suitShade);      // dobras
  px(c, x + 16, top + 28, 6, 1, C.suitShade);                                                 // bolso
  if (p.breath) px(c, x + 2, top + 8, 4, 1, C.suitLight);
}

// ---------- efeitos de energia ----------
function drawBigL(c, k, t, top) {                     // L gigante que cresce na frente da mão (FAZ O L)
  const s = Math.round(4 + k * 26), x = 24, y = top - 30, v = Math.round(s * 1.6);
  c.save(); c.globalAlpha = 0.55 + 0.35 * ((t >> 1) & 1);
  const L = (col, g) => { px(c, x - g, y - v - g, 10 + g * 2, v + 10 + g * 2, col); px(c, x - g, y - g, s + 10 + g * 2, 10 + g * 2, col); };
  L('#e8202e', 3); L('#ff9a1a', 1); L('#fff3a0', -2);
  c.restore();
}
function drawAura(c, k, t, top) {                     // luz dourada atrás do Lula
  c.save();
  for (let i = 4; i > 0; i--) {
    const s = Math.round(i * 22 * k);
    c.globalAlpha = 0.07 * k; px(c, 2 - s / 2, top + 14 - s * 0.8, s, s * 1.6, '#ffd23a');
  }
  c.globalAlpha = 0.5 * k;
  for (let i = 0; i < 7; i++) {
    const x = -26 + i * 9 + Math.round(Math.sin(t * 0.2 + i) * 2), h = 18 + ((t * 3 + i * 17) % 46);
    px(c, x, top + 40 - h, 2, h, i & 1 ? '#fff3a0' : '#ffd23a');
  }
  c.restore();
}
function drawPillar(c, t) {                           // coluna de luz que sobe (ganho real)
  c.save();
  c.globalAlpha = 0.3; px(c, -2, -170, 24, 170, '#c8901a');
  c.globalAlpha = 0.45; px(c, 3, -170, 14, 170, '#ffd23a');
  c.globalAlpha = 0.7; px(c, 7, -170, 6, 170, '#fff3a0');
  c.globalAlpha = 0.9;
  for (let k = 0; k < 5; k++) {
    const y = -((t * 4 + k * 34) % 170);
    for (let i = 0; i < 7; i++) px(c, 3 + i * 2, y + Math.abs(3 - i), 2, 2, '#ffffff');
  }
  c.restore();
}
function drawShieldFront(c, t, hip) {                 // barreira de energia à frente (isenção = proteção)
  const y0 = hip - 56, y1 = -6, cy = (y0 + y1) / 2, half = (y1 - y0) / 2;
  c.save(); c.globalAlpha = 0.75 + 0.25 * ((t >> 1) & 1);
  for (let y = y0; y <= y1; y += 2) {
    const xo = Math.round(Math.sqrt(Math.max(0, 1 - ((y - cy) / half) ** 2)) * 7);
    px(c, 30 + xo, y, 4, 2, '#9fd8ff'); px(c, 31 + xo, y, 2, 2, '#ffffff');
  }
  c.restore();
}
function drawDome(c, t) {                             // escudo do SUS
  c.save();
  c.globalAlpha = 0.14 + 0.06 * Math.sin(t * 0.3); c.fillStyle = '#7affc8';
  c.beginPath(); c.ellipse(2, -52, 34, 58, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.9;
  for (let a = 0; a < 72; a++) {
    const an = a / 72 * Math.PI * 2, x = Math.round(2 + Math.cos(an) * 34), y = Math.round(-52 + Math.sin(an) * 58);
    if (y <= 0) px(c, x - 1, y - 1, 2, 2, (a + (t >> 2)) % 6 === 0 ? '#ffffff' : '#7affc8');
  }
  c.restore();
}

// Desenha o lutador. camX = deslocamento da câmera.
export function drawFighter(c, f, camX, ox = 0, oy = 0) {
  if (f.state === 'gone') return;
  const C = f.C, p = poseOf(f);
  const top = p.hip - 30;
  c.save();
  c.translate(Math.round(f.x - camX + ox), Math.round(f.y + oy));
  c.scale(f.facing, 1);
  if (p.lying) { c.translate(0, -14); c.rotate(-Math.PI / 2); }
  if (p.aura > 0) drawAura(c, p.aura, f.t, top);
  if (p.pillar) drawPillar(c, f.t);
  drawArm(c, C, p, false);
  drawLegs(c, C, p);
  drawTorso(c, C, p);
  ob(c, -3 + p.lean, top - 4, 9, 5, C.skinShade);   // pescoço
  FACES[C.id](c, -10 + p.lean + p.hdx, top - 25 + p.hdy, p.face);
  drawArm(c, C, p, true);
  if (p.L > 0) drawBigL(c, p.L, f.t, top);
  if (p.shieldFront) drawShieldFront(c, f.t, p.hip);
  if (p.dome) drawDome(c, f.t);
  c.restore();
}

export function drawShadow(c, f, camX, groundY) {
  if (f.state === 'gone') return;
  const lying = f.state === 'ko' && f.onGround;
  const w = lying ? 104 : 34;
  const x = Math.round(f.x - camX - (lying ? (f.facing === 1 ? 96 : 8) : 17));
  const air = Math.min(1, (groundY - f.y) / 90);
  c.fillStyle = `rgba(0,0,0,${0.45 - air * 0.25})`;
  c.fillRect(x + 3, groundY - 1, w - 6, 1); c.fillRect(x, groundY, w, 2); c.fillRect(x + 3, groundY + 2, w - 6, 1);
}

// Retrato (cabeça + busto) para seleção/VS/HUD
export function drawPortrait(c, id, x, y, s, flip = 1, face = 'normal') {
  const C = CHARS[id];
  c.save(); c.translate(x, y); c.scale(s * flip, s);
  part(c, -10, 26, 40, 14, C.suit, C.suitShade, C.suitLight, 0.2);
  px(c, 6, 26, 10, 12, C.shirt); px(c, 9, 27, 4, 13, C.tie); px(c, 8, 26, 6, 3, C.tie);
  ob(c, 5, 22, 10, 5, C.skinShade);
  FACES[id](c, 0, 0, face);
  c.restore();
}

// Projéteis: esfera dourada (Lula), esfera azul-aço (Flávio), onda de energia (FAZ O L / DEMOCRACIA)
const GOLD = ['#ffffff', '#fff3a0', '#ffd23a', '#c8901a'], STEEL = ['#e6f0ff', '#8fb0e8', '#3a6ac8', '#1a2a5a'];
export function drawProjectile(c, pr, camX, t) {
  c.save();
  c.translate(Math.round(pr.x - camX), Math.round(pr.y));
  c.scale(Math.sign(pr.vx) || 1, 1);
  if (pr.kind === 'onda') drawWave(c, pr, t);
  else drawOrb(c, pr.big ? 14 : 8, t, pr.kind === 'orb' ? GOLD : STEEL);
  c.restore();
}
function drawOrb(c, r, t, pal) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.sqrt(x * x + y * y) / r;
    if (d <= 1) px(c, x, y, 1, 1, d < 0.35 ? pal[0] : d < 0.62 ? pal[1] : d < 0.85 ? pal[2] : pal[3]);
  }
  for (let i = 0; i < 4; i++) {
    const a = t * 0.2 + i * Math.PI / 2;
    px(c, Math.round(Math.cos(a) * (r + 4)) - 1, Math.round(Math.sin(a) * (r + 4)) - 1, 2, 2, pal[1]);
  }
}
function drawWave(c, pr, t) {
  const w = pr.w, h = pr.h;
  const bands = pr.big ? ['#c8901a', '#ffd23a', '#fff3a0', '#ffffff'] : ['#e8202e', '#ff7a1a', '#ffd23a', '#fff6c0'];
  for (let y = -h / 2; y < h / 2; y += 2) {
    const wob = Math.round(Math.sin(t * 0.5 + y * 0.25) * 2);
    const taper = 1 - Math.pow(Math.abs(y) / (h / 2), 3);
    for (let b = 0; b < 4; b++) {
      const bw = Math.round(w * taper * (1 - b * 0.22));
      if (bw > 0) px(c, Math.round(-bw / 2) + wob + b * 2, y, bw, 2, bands[b]);
    }
  }
  if (!pr.big) {                                        // L branco dentro da onda do FAZ O L
    c.globalAlpha = 0.8;
    px(c, -5, -15, 6, 24, '#8a0a1e'); px(c, -5, 3, 16, 6, '#8a0a1e');
    px(c, -4, -14, 4, 22, '#ffffff'); px(c, -4, 4, 14, 4, '#ffffff');
    c.globalAlpha = 1;
  }
}
