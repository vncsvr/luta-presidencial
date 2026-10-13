// Luta Presidencial — loop, telas e regras da luta (fase 3: tom sério, favorável ao Lula).
import { text, wrap, textWidth, bigText, bigWidth } from './font.js';
import { Fighter, PROJ, STAGE_W, GROUND, overlap, applyHit, L_COST } from './fighter.js';
import { drawFighter, drawShadow, drawPortrait, drawProjectile, drawPool } from './sprites.js';
import { initStage, drawStage } from './stage.js';
import { DIFFS, aiThink } from './ai.js';
import { Controller, setupInput } from './input.js';
import { initAudio, toggleMute, sfx, setSilent } from './audio.js';
import { CHARS } from './chars.js';

const W = 384, H = 216;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;                       // lógica em 384×216, desenho em 768×432 (escala 2 no contexto)
const Q = new URLSearchParams(location.search);
const DEBUG = Q.has('debug'), CPU_OFF = Q.get('cpu') === 'off';
const DISCLAIMER = 'Jogo de ficção. Não é material oficial de campanha.';
const SLOTS = ['lula', 'flavio', null, null, null];

const G = {
  scene: 'title', t: 0, sel: 0, diff: 1, msg: '', msgT: 0, sceneT: 0,
  round: 1, sub: 'intro', subT: 0, timer: 99, tick: 0,
  projs: [], pools: [], sparks: [], pops: [], parts: [], banners: [], hitstop: 0, shakeA: 0, freeze: 0, freezeBy: null, freezeName: '',
  slow: 0, camX: (STAGE_W - W) / 2, dmgMult: DEBUG ? 10 : 1, p1: null, p2: null, koWinner: null, matchWinner: null,
  resultSel: 0, quote: '', paused: null, final: null, lastFinal: null, cheer: 0, botP1: false, regen: 0.07, cpuDmg: 0.65,
};
window.__game = G;

const pc = new Controller(), cc = new Controller(), bc = new Controller(), EMPTY = { held: {}, pressed: () => false };
const muteBtn = document.getElementById('mute');
function mute() { muteBtn.textContent = toggleMute() ? 'SOM: OFF' : 'SOM: ON'; }
muteBtn.addEventListener('click', () => { initAudio(); mute(); });
function goFullscreen() {                                     // ao tocar em JOGAR: tela cheia + trava deitado
  if (!document.body.classList.contains('touch') || document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!rq) return;
  try {
    const r = rq.call(el, { navigationUI: 'hide' });
    const lock = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* sem suporte */ } };
    if (r && r.then) r.then(lock).catch(() => {}); else lock();
  } catch (e) { /* sem suporte */ }
}
document.addEventListener('fullscreenchange', () => setTimeout(fit, 100));
const input = setupInput({ onGesture: initAudio, onMute: mute, onTap: goFullscreen });
const superBtn = document.getElementById('superBtn');
const R = Math.random;

// ---------- partículas ----------
function part(x, y, vx, vy, life, col, size = 2, grav = 0.15, grow = 0) { G.parts.push({ x, y, vx, vy, life, col, size, grav, grow, t: 0 }); }
G.dust = (x, y, n = 6) => { for (let i = 0; i < n; i++) part(x + (R() - 0.5) * 16, y - 2, (R() - 0.5) * 1.6, -R() * 1.1, 22 + R() * 14, R() > 0.5 ? '#cfc4ae' : '#a89c88', 2 + (R() * 2 | 0), -0.01, 0.08); };

// ---------- API usada pelos lutadores ----------
G.sfx = sfx;
G.hasProj = f => G.projs.some(p => p.owner === f);
G.spawnProj = (f, kind) => {
  const P = PROJ[kind];
  G.projs.push({ owner: f, x: f.x + f.facing * 30, y: f.y + P.dy, vx: P.vx * f.facing, mv: P, big: !!P.big,
    kind: P.wave ? 'onda' : f.C.proj, w: P.w, h: P.h, choc: f.C.fx === 'choc' });
  sfx(P.wave ? 'wave' : 'proj');
  if (P.wave) {
    G.shake(P.big ? 7 : 4);
    for (let i = 0; i < (P.big ? 30 : 18); i++) part(f.x + f.facing * 30, f.y + P.dy + (R() - 0.5) * P.h, f.facing * R() * 3, (R() - 0.5) * 3, 24, f.C.fx === 'choc' ? (R() > 0.5 ? '#5a2e18' : '#c89a72') : R() > 0.5 ? '#ffd23a' : P.big ? '#ffffff' : '#ff5a2a', 3, 0);
  }
};
G.hasPool = f => G.pools.some(p => p.owner === f);
G.slick = f => f.onGround && G.pools.some(p => p.owner !== f && f.x > p.x0 && f.x < p.x1);
G.spawnPool = f => {                                    // pista de chocolate: o chão à frente do Flávio escorrega
  const cx = f.x + f.facing * 90;
  G.pools = G.pools.filter(p => p.owner !== f);
  G.pools.push({ owner: f, x0: cx - 80, x1: cx + 80, t: 0, max: 420 });
  sfx('heal');
  for (let i = 0; i < 18; i++) part(cx + (R() - 0.5) * 150, GROUND - 2, (R() - 0.5) * 1.2, -R() * 2, 24, R() > 0.5 ? '#5a2e18' : '#8a5030', 3, 0.12);
};
G.superFlash = (f, name) => { G.freeze = 50; G.freezeBy = f; G.freezeName = name; sfx('super'); if (f === G.p1) { G.cheer = 110; sfx('cheer'); } };
G.banner = (f, txt) => {
  const side = f === G.p1 ? 0 : 1;
  G.banners = G.banners.filter(b => b.side !== side);
  G.banners.push({ txt, side, t: 0 });
};
G.noMeter = f => { G.pops.push({ txt: 'SEM ENERGIA! (L GASTA 1 NÍVEL)', x: f.x, y: f.y - 116, t: 0 }); sfx('nomana'); };
G.heal = f => {
  sfx('heal');
  for (let i = 0; i < 16; i++) part(f.x + (R() - 0.5) * 34, f.y - 10 - R() * 70, (R() - 0.5) * 0.3, -0.6 - R(), 34, R() > 0.5 ? '#7affc8' : '#ffffff', 2, -0.01);
  G.pops.push({ txt: '+VIDA', x: f.x, y: f.y - 118, t: 0 });
};
G.spark = (x, y, kind) => {
  G.sparks.push({ x, y, kind, t: 0 });
  const n = kind === 'big' ? 12 : kind === 'block' ? 5 : 7;
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, v = 1 + R() * (kind === 'big' ? 3.5 : 2.2);
    part(x, y, Math.cos(a) * v, Math.sin(a) * v - 1, 12 + R() * 10, kind === 'block' ? '#9fd8ff' : R() > 0.4 ? '#ffe14a' : '#ffffff', R() > 0.6 ? 2 : 1, 0.12);
  }
};
G.shake = n => { G.shakeA = Math.max(G.shakeA, n); };
G.onHit = (att, def, mv, blocked) => {         // a torcida vibra quando o Lula acerta
  if (att !== G.p1 || blocked) return;
  const big = mv.proj || mv.special || mv.heavy;
  G.cheer = Math.max(G.cheer, big ? 75 : 35);
  if (big) sfx('cheer');
};
G.onKO = (att, def) => {
  if (G.sub === 'play') {
    G.koWinner = att; G.subT = 0; G.slow = 40; sfx('ko'); G.shake(8);
    if (att === G.p1) G.cheer = 140;
    // FINISH HIM só quando o Lula vence o round decisivo; a CPU vence só por K.O. normal
    if (att === G.p1 && att.wins + 1 >= 2) { def.state = 'dizzy'; def.vx = att.facing * 1.5; G.sub = 'finish'; }
    else G.sub = 'ko';
  } else if (G.sub === 'finish') { G.sub = 'ko'; G.subT = 40; sfx('ko'); G.cheer = 140; }
};
G.startFinal = w => {
  const v = w === G.p1 ? G.p2 : G.p1;
  w.facing = v.x >= w.x ? 1 : -1; v.facing = -w.facing;
  w.state = 'triumph'; w.vx = 0; w.mv = null; v.vx = 0; v.state = 'dizzy';
  G.final = { w, v, t: 0 }; G.lastFinal = w.C.names.final; G.sub = 'final'; G.subT = 0; G.banners = []; G.projs = [];
};

// ---------- partida ----------
function startMatch() {
  G.p1 = new Fighter('lula', 0); G.p2 = new Fighter('flavio', 1);
  G.p1.meter = L_COST + 1;                                  // começa com 1 nível: o L já está à mão
  G.cpuDmg = DIFFS[G.diff].dmg; G.regen = DIFFS[G.diff].regen;
  G.round = 1; startRound(); go('fight');
}
function startRound() {
  G.p1.reset(); G.p2.reset(); G.p1.ai = null; G.p2.ai = null;
  Object.assign(G, { projs: [], pools: [], sparks: [], pops: [], parts: [], banners: [], timer: 99, tick: 0, sub: 'intro', subT: 0,
    camX: (STAGE_W - W) / 2, koWinner: null, freeze: 0, hitstop: 0, slow: 0, paused: null, final: null, cheer: 0 });
}
function endRound() {
  const { p1, p2 } = G;
  if (G.koWinner) G.koWinner.wins++;
  if (p1.wins >= 2 || p2.wins >= 2 || G.round >= 5) {
    G.matchWinner = p1.wins >= p2.wins ? p1 : p2;
    const won = G.matchWinner === p1, q = CHARS.lula.quotes;
    G.quote = won ? q[R() * q.length | 0] : 'A LUTA CONTINUA. VAMOS DE NOVO.';
    G.resultSel = 0; G.winShow = new Fighter('lula', 0); G.winShow.state = won ? 'win' : 'idle';
    sfx(won ? 'win' : 'deny');
    go('result');
  } else { G.round++; startRound(); }
}
function go(scene) { G.scene = scene; G.sceneT = 0; }

function pushApart() {
  const { p1, p2 } = G;
  const dx = p2.x - p1.x, ad = Math.abs(dx);
  const solid = f => !['ko', 'gone', 'leave', 'triumph'].includes(f.state);
  if (ad < 28 && Math.abs(p1.y - p2.y) < 70 && solid(p1) && solid(p2)) {
    const o = (28 - ad) / 2, s = dx >= 0 ? 1 : -1;
    p1.x -= o * s; p2.x += o * s;
  }
  for (const [a, b] of [[p1, p2], [p2, p1]]) {
    a.x = Math.max(18, Math.min(STAGE_W - 18, a.x));
    a.x = Math.max(b.x - 340, Math.min(b.x + 340, a.x));
  }
}

// final sério: DEMOCRACIA VENCE — luz dourada, festa do público, o adversário deixa o palco caminhando
function updateFinal() {
  const F = G.final, { w, v } = F;
  F.t++; w.t++; v.t++;
  G.cheer = 60;
  if (F.t === 1) sfx('charge');
  if (F.t === 30) { F.title = true; sfx('triumph'); }
  if (F.t % 2 === 0) part(w.x + (R() - 0.5) * 70, GROUND - R() * 30, (R() - 0.5) * 0.4, -0.6 - R() * 1.2, 70, R() > 0.5 ? '#ffd23a' : '#fff3a0', 2, -0.004);
  if (F.t >= 30) for (let i = 0; i < 2; i++) part(G.camX + R() * W, -4, (R() - 0.5) * 0.8, 0.5 + R() * 0.9, 260, ['#ffd23a', '#ffffff', '#e8202e'][R() * 3 | 0], 2, 0.004);
  if (F.t === 55) v.state = 'idle';                     // o adversário se recompõe
  if (F.t === 80) { v.state = 'leave'; v.facing = v.x >= w.x ? 1 : -1; }
  if (v.state === 'leave') {
    v.x += v.facing * 1.1;
    const sx = v.x - G.camX;
    if (sx < -50 || sx > W + 50) v.state = 'gone';
  }
  if (F.t === 170) { F.big = true; sfx('cheer'); G.shake(3); }
  if ((F.t >= 340 && v.state === 'gone') || F.t >= 560) endFinal();
}
function endFinal() {
  const { w, v } = G.final;
  G.final = null; w.state = 'win'; v.state = 'gone';
  G.sub = 'ko'; G.subT = 120;
}

function updatePause() {
  const P = G.paused;
  const ok = pc.pressed('start') || pc.pressed('lp') || pc.pressed('lk') || pc.pressed('tapc');
  if (P.view === 'cmds') { if (ok || pc.pressed('back')) { P.view = 'menu'; sfx('select'); } return; }
  if (pc.pressed('up')) { P.sel = (P.sel + 2) % 3; sfx('select'); }
  if (pc.pressed('down')) { P.sel = (P.sel + 1) % 3; sfx('select'); }
  if (pc.pressed('back')) { G.paused = null; return; }
  if (ok) {
    sfx('confirm');
    if (P.sel === 0) G.paused = null;
    else if (P.sel === 1) P.view = 'cmds';
    else { G.paused = null; go('title'); }
  }
}

function updateFight() {
  const { p1, p2 } = G;
  if (G.paused) { updatePause(); return; }
  if (!G.botP1 && (pc.pressed('start') || pc.pressed('back')) && (G.sub === 'play' || G.sub === 'intro')) { G.paused = { sel: 0, view: 'menu' }; sfx('pause'); return; }
  for (const s of G.sparks) s.t++;
  G.sparks = G.sparks.filter(s => s.t < 14);
  for (const p of G.parts) { p.t++; p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.size += p.grow; }
  G.parts = G.parts.filter(p => p.t < p.life);
  for (const b of G.banners) b.t++;
  G.banners = G.banners.filter(b => b.t < 100);
  if (G.cheer > 0) G.cheer--;
  G.shakeA *= 0.85;
  if (G.freeze > 0) { G.freeze--; return; }
  if (G.hitstop > 0) { G.hitstop--; return; }
  if (G.slow > 0) { G.slow--; if (G.slow & 1) return; }
  G.subT++;
  if (G.sub === 'final') { updateFinal(); return; }

  const live = G.sub === 'play', w = G.koWinner, D = DIFFS[G.diff];
  let c1 = EMPTY, c2 = EMPTY;
  const lula = () => { if (G.botP1) { aiThink(p1, p2, G, bc, D); return bc; } return pc; };
  if (live) {
    if (!CPU_OFF) aiThink(p2, p1, G, cc, D);
    c1 = lula(); c2 = cc;
  } else if (G.sub === 'finish' && w === p1) c1 = lula();
  p1.update(c1, p2, G);
  if (G.sub === 'final') return;        // o jogador fez ↓↓→+L neste frame
  p2.update(c2, p1, G);
  pushApart();

  for (const [a, b] of [[p1, p2], [p2, p1]]) {
    if (!a.active()) continue;
    const hb = a.hitbox(), hu = b.hurtbox();
    if (overlap(hb, hu)) {
      a.hitDone = true;
      const hx = a.facing === 1 ? Math.min(hb[0] + hb[2], hu[0] + hu[2]) : Math.max(hb[0], hu[0]);
      applyHit(a, b, a.mv, G, hx, hb[1] + hb[3] / 2, a.facing);
    }
  }
  for (const pr of G.projs) {
    pr.x += pr.vx;
    const back = pr.x - Math.sign(pr.vx) * pr.w / 2;
    if (pr.kind === 'onda') part(back, pr.y + (R() - 0.5) * pr.h * 0.8, -pr.vx * 0.3, (R() - 0.5), 18, pr.choc ? (R() > 0.5 ? '#5a2e18' : '#8a5030') : R() > 0.5 ? '#ffd23a' : pr.big ? '#ffffff' : '#ff5a2a', 2, 0);
    else if (G.t % 2 === 0) part(back, pr.y + (R() - 0.5) * 8, -pr.vx * 0.2, (R() - 0.5) * 0.4, 16, pr.kind === 'orb' ? '#ffd23a' : '#8a5030', 2, 0);
  }
  for (const a of G.projs) for (const b of G.projs) {
    if (a === b || a.owner === b.owner || a.dead || b.dead) continue;
    if (overlap([a.x - a.w / 2, a.y - a.h / 2, a.w, a.h], [b.x - b.w / 2, b.y - b.h / 2, b.w, b.h])) {
      if (a.big && !b.big) b.dead = true; else if (b.big && !a.big) a.dead = true; else a.dead = b.dead = true;
      G.spark((a.x + b.x) / 2, a.y, 'big'); sfx('block');
    }
  }
  for (const pr of G.projs) {
    if (pr.dead) continue;
    const tgt = pr.owner === p1 ? p2 : p1;
    if (tgt.state === 'attack' && tgt.mv.shield && tgt.phase() === 1 && Math.abs(pr.x - tgt.x) < 46) {   // escudo do SUS absorve
      pr.dead = true; G.spark(pr.x, pr.y, 'block'); sfx('block'); continue;
    }
    if (overlap([pr.x - pr.w / 2, pr.y - pr.h / 2, pr.w, pr.h], tgt.hurtbox())) {
      pr.dead = true; applyHit(pr.owner, tgt, pr.mv, G, pr.x, Math.max(tgt.y - 90, Math.min(tgt.y - 20, pr.y)), Math.sign(pr.vx));
    }
  }
  G.projs = G.projs.filter(p => !p.dead && p.x > -60 && p.x < STAGE_W + 60);
  for (const pl of G.pools) pl.t++;
  G.pools = G.pools.filter(pl => pl.t < pl.max);
  for (const p of G.pops) p.t++;
  G.pops = G.pops.filter(p => p.t < 70);
  for (const f of [p1, p2]) f.ghost = f.ghost > f.hp ? Math.max(f.hp, f.ghost - 0.5) : f.hp;

  if (live && ++G.tick % 60 === 0 && G.timer > 0 && --G.timer === 0) {
    const r1 = p1.hp / p1.C.maxHp, r2 = p2.hp / p2.C.maxHp;
    G.sub = 'timeup'; G.subT = 0; G.koWinner = r1 > r2 ? p1 : r2 > r1 ? p2 : null; sfx('ko');
    if (G.koWinner === p1) G.cheer = 140;
  }
  if (G.sub === 'intro') {
    if (G.subT === 2) sfx('round');
    if (G.subT === 70) sfx('fight');
    if (G.subT >= 110) G.sub = 'play';
  } else if (G.sub === 'finish') {
    if (G.subT === 2) sfx('finish');
    if (G.subT >= 190) { const l = w === p1 ? p2 : p1; l.state = 'ko'; l.vy = -3; l.vx = w.facing * 2; G.sub = 'ko'; G.subT = 60; sfx('ko'); }
  } else if (G.sub === 'ko' || G.sub === 'timeup') {
    if (G.subT >= 110 && w && w.onGround && !['win', 'hit', 'attack'].includes(w.state)) { w.state = 'win'; w.mv = null; w.vx = 0; }
    if (w === p1 && G.cheer < 30) G.cheer = 30;
    if (G.subT >= 230) endRound();
  }
  const target = Math.max(0, Math.min(STAGE_W - W, (p1.x + p2.x) / 2 - W / 2));
  G.camX += (target - G.camX) * 0.2;
}

// ---------- telas: update ----------
const confirmPressed = () => pc.pressed('start') || pc.pressed('lp') || pc.pressed('lk') || pc.pressed('tapc');
const UPD = {
  title() { if (G.sceneT > 10 && confirmPressed()) { sfx('confirm'); go('select'); } },
  select() {
    if (pc.pressed('left')) { G.sel = (G.sel + 4) % 5; sfx('select'); }
    if (pc.pressed('right')) { G.sel = (G.sel + 1) % 5; sfx('select'); }
    if (pc.pressed('up')) { G.diff = (G.diff + 2) % 3; sfx('select'); }
    if (pc.pressed('down')) { G.diff = (G.diff + 1) % 3; sfx('select'); }
    if (pc.pressed('back')) go('title');
    if (G.sceneT > 10 && confirmPressed()) {
      if (G.sel === 0) { sfx('confirm'); go('vs'); }
      else { sfx('deny'); G.msg = G.sel === 1 ? 'FLÁVIO É O ADVERSÁRIO DA CPU' : 'EM BREVE'; G.msgT = 90; }
    }
    if (G.msgT > 0) G.msgT--;
  },
  vs() { if (G.sceneT > 170 || (G.sceneT > 40 && confirmPressed())) startMatch(); },
  fight: updateFight,
  result() {
    G.winShow.t++;
    if (pc.pressed('up') || pc.pressed('down') || pc.pressed('left') || pc.pressed('right')) { G.resultSel ^= 1; sfx('select'); }
    if (G.sceneT > 30 && confirmPressed()) {
      sfx('confirm');
      if (G.resultSel === 0) startMatch(); else go('title');
    }
  },
};

// ---------- telas: desenho ----------
const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function goldBox(x, y, w, h, fill = '#14102a') {
  px(x - 3, y - 3, w + 6, h + 6, '#1a1006'); px(x - 2, y - 2, w + 4, h + 4, '#c8a040');
  px(x - 2, y - 2, w + 4, 1, '#f8e080'); px(x - 2, y + h + 1, w + 4, 1, '#7a5a18'); px(x - 1, y - 1, w + 2, h + 2, '#000');
  if (fill) px(x, y, w, h, fill);
}
function disclaimer() {
  px(0, 204, W, 12, 'rgba(0,0,0,0.8)');
  text(ctx, DISCLAIMER, W / 2, 206, { align: 'center', color: '#e8e8e8' });
}
const showA = new Fighter('lula', 0), showB = new Fighter('flavio', 1);
const cheerLevel = () => (G.cheer > 0 ? Math.min(1, G.cheer / 40) : 0);

function drawTitle() {
  drawStage(ctx, 96, G.t, 0.35);
  showA.t = showB.t = G.t; showA.x = 74; showB.x = 310; showA.facing = 1; showB.facing = -1;
  drawShadow(ctx, showA, 0, GROUND); drawShadow(ctx, showB, 0, GROUND);
  drawFighter(ctx, showA, 0); drawFighter(ctx, showB, 0);
  const bob = Math.round(Math.sin(G.t * 0.05) * 2);
  bigText(ctx, 'LUTA', W / 2, 4 + bob, 58, { fill: ['#ff6a6a', '#c8102e'], stroke: '#1a0610', shadow: '#5a0010' });
  bigText(ctx, 'PRESIDENCIAL', W / 2, 60 + bob, 27, { fill: ['#fff3a0', '#ffb81c'], stroke: '#1a0610', shadow: '#5a0010' });
  if ((G.t >> 5) & 1) text(ctx, document.body.classList.contains('touch') ? 'TOQUE PARA JOGAR' : 'APERTE ENTER', W / 2, 100, { scale: 2, align: 'center', color: '#ffffff', outline: '#000' });
  disclaimer();
}

function drawSelect() {
  drawStage(ctx, 96, G.t, 0.7);
  text(ctx, 'ESCOLHA SEU LUTADOR', W / 2, 6, { scale: 2, align: 'center', color: '#ffd23a', outline: '#000' });
  const id = SLOTS[G.sel];
  const framed = (x, fn) => { px(x, 28, 96, 90, 'rgba(255,255,255,0.07)'); ctx.save(); ctx.beginPath(); ctx.rect(x, 28, 96, 90); ctx.clip(); fn(); ctx.restore(); };
  if (id === 'lula') framed(28, () => drawPortrait(ctx, 'lula', 76, 74, 1.55));
  else { px(28, 28, 96, 90, 'rgba(255,255,255,0.06)'); text(ctx, '?', 76, 56, { scale: 6, align: 'center', color: '#555' }); }
  framed(264, () => drawPortrait(ctx, 'flavio', 312, 82, 1.35, -1));
  text(ctx, '1P', 14, 30, { color: '#3aa0ff', outline: '#000' });
  text(ctx, 'CPU', 370, 30, { align: 'right', color: '#ff4a4a', outline: '#000' });
  text(ctx, id ? CHARS[id].name : 'EM BREVE', 72, 122, { scale: 2, align: 'center', color: '#fff', outline: '#000' });
  text(ctx, 'FLÁVIO', 312, 122, { scale: 2, align: 'center', color: '#fff', outline: '#000' });
  const x0 = 107;
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * 35, y = 140;
    px(x - 1, y - 1, 34, 34, '#000'); px(x, y, 32, 32, SLOTS[i] ? '#2b2f52' : '#1a1a22');
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, 32, 32); ctx.clip();
    if (SLOTS[i]) drawPortrait(ctx, SLOTS[i], x + 16, y + 13, 0.5, 1, 'normal', false);
    else { text(ctx, 'EM', x + 16, y + 8, { align: 'center', color: '#999' }); text(ctx, 'BREVE', x + 16, y + 18, { align: 'center', color: '#999' }); }
    ctx.restore();
    if (i === G.sel && ((G.t >> 3) & 1)) { ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, 34, 34); }
  }
  text(ctx, `DIFICULDADE:  < ${DIFFS[G.diff].name} >   (CIMA/BAIXO)`, W / 2, 180, { align: 'center', color: '#fff', outline: '#000' });
  text(ctx, 'A/S SOCO  Z/X CHUTE  D ESPECIAL  L FAZ O L  C SUPER', W / 2, 192, { align: 'center', color: '#ffd23a', outline: '#000' });
  text(ctx, 'NA LUTA: ENTER = PAUSA E LISTA DE COMANDOS   M = SOM', W / 2, 204, { align: 'center', color: '#aaa' });
  if (G.msgT > 0) {
    px(0, 96, W, 22, 'rgba(0,0,0,0.85)');
    text(ctx, G.msg, W / 2, 101, { scale: 2, align: 'center', color: '#ffd23a' });
  }
}

function drawVS() {
  const k = Math.max(0, 30 - G.sceneT) * 8;
  px(0, 0, W, H, '#0b1440');
  ctx.fillStyle = '#9a0c1a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(220, 0); ctx.lineTo(164, H); ctx.lineTo(0, H); ctx.fill();
  for (let y = 0; y < H; y += 4) px(0, y, W, 1, 'rgba(0,0,0,0.18)');
  drawPortrait(ctx, 'lula', 92 - k, 96, 2.4);
  drawPortrait(ctx, 'flavio', 292 + k, 100, 2.1, -1);
  bigText(ctx, 'LULA', 92 - k, 160, 26, { fill: ['#ffffff', '#cfd8ff'] });
  bigText(ctx, 'FLÁVIO', 292 + k, 160, 26, { fill: ['#ffffff', '#cfd8ff'] });
  if (G.sceneT > 25) bigText(ctx, 'VS', W / 2, 58, 56, { fill: (G.t >> 2) & 1 ? ['#fff3a0', '#ffb81c'] : ['#ffffff', '#cfd8ff'], stroke: '#1a0610', shadow: '#000' });
  text(ctx, `DIFICULDADE ${DIFFS[G.diff].name}`, W / 2, 200, { align: 'center', color: '#ddd', outline: '#000' });
}

function hudSide(f, right) {
  const w = 140, x = right ? 212 : 32, y = 8, h = 10, max = f.C.maxHp;
  const bx = right ? 356 : 4;                                    // retrato com moldura
  goldBox(bx, 4, 24, 26, '#2b2f52');
  ctx.save(); ctx.beginPath(); ctx.rect(bx, 4, 24, 26); ctx.clip();
  drawPortrait(ctx, f.C.id, bx + 12, 14, 0.72, right ? -1 : 1, f.hp / max < 0.3 ? 'hurt' : 'normal', false);
  ctx.restore();
  goldBox(x, y, w, h, '#3a0808');                                 // barra de vida
  const g = Math.round(w * f.ghost / max), v = Math.round(w * f.hp / max);
  const gx = right ? x : x + w - g, vx = right ? x : x + w - v;
  px(gx, y, g, h, '#e82020');
  const low = f.hp / max < 0.25 && (G.t >> 3) & 1;
  px(vx, y, v, h, low ? '#ff8a1a' : '#f8d030'); px(vx, y, v, 2, '#fff2a0'); px(vx, y + h - 2, v, 2, low ? '#c85a0a' : '#c89a10');
  for (let i = 1; i < 10; i++) px(x + i * 14, y + h - 2, 1, 2, '#00000033');
  const nw = textWidth(f.C.name) + 8, nx = right ? x + w - nw : x;   // nome
  px(nx, 21, nw, 10, 'rgba(0,0,0,0.75)');
  text(ctx, f.C.name, right ? x + w - 4 : x + 4, 22, { align: right ? 'right' : 'left', color: '#fff' });
  for (let i = 0; i < f.wins; i++) {
    const wx = right ? nx - 12 - i * 11 : nx + nw + 3 + i * 11;
    px(wx - 1, 21, 10, 10, '#1a1006'); px(wx, 22, 8, 8, '#c8a040'); px(wx + 1, 23, 6, 6, '#ffd23a'); px(wx + 2, 24, 2, 2, '#fff');
  }
  const mw = 84, my = 34, mx = right ? x + w - mw : x;            // barra de especial em 3 níveis
  px(mx - 2, my - 2, mw + 4, 8, '#c8a040'); px(mx - 1, my - 1, mw + 2, 6, '#000'); px(mx, my, mw, 4, '#101830');
  const full = f.meter >= 100, mv = Math.round(mw * f.meter / 100);
  const col = full ? ((G.t >> 2) & 1 ? '#ffd23a' : '#ffffff') : '#2a7bff';
  px(right ? mx + mw - mv : mx, my, mv, 4, col); px(right ? mx + mw - mv : mx, my, mv, 1, full ? '#fff' : '#7ab0ff');
  px(mx + 28, my, 1, 4, '#000'); px(mx + 56, my, 1, 4, '#000');
  const lv = Math.floor((f.meter + 0.01) / L_COST);
  text(ctx, full ? 'SUPER!' : `NV ${lv}`, right ? mx - 4 : mx + mw + 4, 33, { align: right ? 'right' : 'left', color: full ? '#ffd23a' : '#9fc4ff', outline: '#000' });
}

function drawSpark(s, camX) {
  const x = Math.round(s.x - camX), y = Math.round(s.y), r = s.t * (s.kind === 'big' ? 2.2 : 1.5) + 2;
  const col = s.kind === 'block' ? ['#ffffff', '#8fd0ff'] : s.kind === 'big' ? ['#ffffff', '#ff9a1a'] : ['#ffffff', '#ffe14a'];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + (s.kind === 'block' ? 0 : 0.4);
    for (let j = 0; j < 3; j++) {
      const d = r - j * 2; if (d <= 0) continue;
      px(x + Math.round(Math.cos(a) * d), y + Math.round(Math.sin(a) * d), 2, 2, col[j === 0 ? 1 : 0]);
    }
  }
  if (s.t < 4) { px(x - 4, y - 4, 8, 8, col[0]); px(x - 6, y - 1, 12, 2, col[1]); px(x - 1, y - 6, 2, 12, col[1]); }
}

function drawBanners() {
  for (const b of G.banners) {
    // faixa do Lula na base da tela (não cobre o golpe); a do Flávio no alto, à direita
    const sz = bigWidth(ctx, b.txt, 15) <= 340 ? 15 : 11, lines = [b.txt];
    const tw = bigWidth(ctx, b.txt, sz), bw = tw + 22, lh = sz + 2, bh = lh + 6;
    const slide = Math.max(0, 10 - b.t) * 24;
    const x = b.side === 0 ? 4 - slide : W - 4 - bw + slide, y = b.side === 0 ? H - bh : 46;
    ctx.save(); ctx.globalAlpha = b.t > 85 ? (100 - b.t) / 15 : 1;
    px(x, y, bw, bh, '#8a0a1e'); px(x, y, bw, 2, '#ffd23a'); px(x, y + bh - 2, bw, 2, '#c8a040'); px(x + 2, y + 2, bw - 4, 2, '#c8102e');
    lines.forEach((l, i) => bigText(ctx, l, x + bw / 2, y + 4 + i * lh, sz, { fill: ['#fffbd0', '#ffd23a'], stroke: '#3a0008' }));
    ctx.restore();
  }
}

function drawPause() {
  const P = G.paused;
  px(0, 0, W, H, 'rgba(0,0,0,0.78)');
  if (P.view === 'cmds') return drawCommands();
  goldBox(96, 46, 192, 116);
  text(ctx, 'PAUSA', W / 2, 54, { scale: 3, align: 'center', color: '#ffd23a', outline: '#000' });
  ['CONTINUAR', 'COMANDOS', 'SAIR DA LUTA'].forEach((s, i) => {
    const sel = P.sel === i;
    text(ctx, (sel ? '> ' : '  ') + s, 106, 88 + i * 22, { scale: 2, color: sel ? '#ffd23a' : '#999', outline: '#000' });
  });
}
function drawCommands() {
  text(ctx, 'COMANDOS', W / 2, 4, { scale: 2, align: 'center', color: '#ffd23a', outline: '#000' });
  text(ctx, 'SETAS: ANDAR, PULAR, AGACHAR   SEGURAR ← = DEFENDER', W / 2, 24, { align: 'center', color: '#fff' });
  text(ctx, 'A/S SOCO FRACO/FORTE   Z/X CHUTE FRACO/FORTE', W / 2, 34, { align: 'center', color: '#fff' });
  for (const [id, x, w] of [['lula', 6, 206], ['flavio', 222, 156]]) {
    goldBox(x, 48, w, 150, 'rgba(20,16,42,0.9)');
    text(ctx, id === 'lula' ? 'LULA (VOCÊ)' : 'FLÁVIO (CPU)', x + 6, 52, { color: id === 'lula' ? '#3aa0ff' : '#ff4a4a' });
    CHARS[id].moves.forEach(([n, k], j) => {
      text(ctx, n, x + 6, 66 + j * 19, { color: '#ffd23a' });
      text(ctx, k, x + 6, 75 + j * 19, { color: '#ffffff' });
    });
  }
  text(ctx, 'ENTER OU ESC PARA VOLTAR', W / 2, 205, { align: 'center', color: '#aaa' });
}

function drawRays(cx, cy, k, t) {                         // raios de luz dourada do final
  ctx.save();
  ctx.globalAlpha = 0.16 * k; ctx.fillStyle = '#ffd23a';
  for (let i = 0; i < 12; i++) {
    const a = t * 0.01 + i * Math.PI / 6;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a - 0.09) * 440, cy + Math.sin(a - 0.09) * 440);
    ctx.lineTo(cx + Math.cos(a + 0.09) * 440, cy + Math.sin(a + 0.09) * 440); ctx.fill();
  }
  ctx.globalAlpha = 0.1 * k; ctx.fillStyle = '#fff3a0';
  for (let r = 6; r > 0; r--) ctx.fillRect(cx - r * 10, cy - r * 10, r * 20, r * 20);
  ctx.restore();
}

function drawFight() {
  const { p1, p2 } = G, F = G.final;
  const ox = Math.round((R() - 0.5) * G.shakeA * 2), oy = Math.round((R() - 0.5) * G.shakeA);
  ctx.save(); ctx.translate(ox, oy);
  const camX = Math.round(G.camX);
  drawStage(ctx, camX, G.t, 0, cheerLevel());
  const dark = F ? Math.min(0.3, F.t / 40 * 0.3) : G.freeze > 0 ? 0.6 : 0;
  if (dark) px(-10, -10, W + 20, H + 20, `rgba(8,0,18,${dark})`);
  if (F) drawRays(Math.round(F.w.x - camX), Math.round(F.w.y - 80), Math.min(1, F.t / 40), G.t);
  for (const pl of G.pools) drawPool(ctx, pl, camX, G.t, GROUND);
  drawShadow(ctx, p1, camX, GROUND); drawShadow(ctx, p2, camX, GROUND);
  const order = p1.state === 'attack' ? [p2, p1] : [p1, p2];
  for (const f of order) drawFighter(ctx, f, camX);
  for (const pr of G.projs) drawProjectile(ctx, pr, camX, G.t);
  for (const p of G.parts) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    px(Math.round(p.x - camX - p.size / 2), Math.round(p.y - p.size / 2), Math.ceil(p.size), Math.ceil(p.size), p.col);
  }
  ctx.globalAlpha = 1;
  for (const s of G.sparks) drawSpark(s, camX);
  if (DEBUG && Q.has('boxes')) {
    ctx.lineWidth = 1;
    for (const f of [p1, p2]) {
      const hu = f.hurtbox(); if (hu) { ctx.strokeStyle = '#3aff3a'; ctx.strokeRect(hu[0] - camX + 0.5, hu[1] + 0.5, hu[2], hu[3]); }
      if (f.active()) { const hb = f.hitbox(); ctx.strokeStyle = '#ff3a3a'; ctx.strokeRect(hb[0] - camX + 0.5, hb[1] + 0.5, hb[2], hb[3]); }
    }
  }
  for (const p of G.pops) text(ctx, p.txt, Math.max(90, Math.min(W - 90, p.x - camX)), p.y - (p.t >> 2), { align: 'center', color: '#ffd23a', outline: '#000' });
  ctx.restore();

  hudSide(p1, false); hudSide(p2, true);
  goldBox(178, 4, 28, 24, '#1a1030');
  text(ctx, String(G.timer).padStart(2, '0'), 192, 9, { scale: 2, align: 'center', color: G.timer <= 10 ? '#ff4a4a' : '#fff' });
  drawBanners();

  if (G.freeze > 0 && G.freezeBy) {
    px(0, 78, W, 30, 'rgba(0,0,0,0.75)');
    for (let x = (G.t * 6) % 24 - 24; x < W; x += 24) { px(x, 78, 12, 2, '#ffd23a'); px(x + 12, 106, 12, 2, '#ffd23a'); }
    const fz = bigWidth(ctx, G.freezeName, 22) <= 360 ? 22 : 15;
    bigText(ctx, G.freezeName, W / 2, 80, fz, { fill: ['#fffbd0', '#ffb81c'], stroke: '#5a0010', shadow: '#000' });
  }
  const COL = { '#ffffff': ['#ffffff', '#cfd8ff'], '#ffd23a': ['#fff3a0', '#ffb81c'], '#ff3a3a': ['#ff8a8a', '#e8202e'], '#ff2a3a': ['#ff8a8a', '#e8202e'], '#fff3a0': ['#ffffff', '#fff3a0'] };
  const big = (s, sc, col, y = 70) => bigText(ctx, s, W / 2, y - 14, sc * 7, { fill: COL[col] || [col, col], stroke: '#1a0610', shadow: '#000' });
  if (G.sub === 'intro') {
    if (G.subT < 70) big(`ROUND ${G.round}`, 4, '#ffffff');
    else big('FIGHT!', 6, (G.t >> 2) & 1 ? '#ffd23a' : '#ff3a3a');
  } else if (G.sub === 'finish') {
    big('FINISH HIM!', 5, (G.t >> 3) & 1 ? '#ff2a3a' : '#ffd23a', 62);
    if (G.koWinner === p1 && (G.t >> 4) & 1) text(ctx, '↓↓→ + L: DEMOCRACIA VENCE', W / 2, 104, { scale: 2, align: 'center', color: '#fff', outline: '#000' });
  } else if (F) {
    if (F.title && !F.big) big('DEMOCRACIA VENCE', 3, '#ffd23a', 52);
    if (F.big) {                                         // acima do punho erguido, sem cobrir o rosto
      big('DEMOCRACIA VENCE', 2, '#ffd23a', 44);
      big('VITÓRIA DO POVO', 3, (G.t >> 4) & 1 ? '#ffffff' : '#fff3a0', 62);
    }
  } else if (G.sub === 'ko' || G.sub === 'timeup') {
    if (G.subT < 110) big(G.sub === 'ko' ? (G.koWinner === p1 ? 'PT' : 'K.O.') : 'TEMPO!', G.sub === 'ko' ? (G.koWinner === p1 ? 12 : 9) : 7, (G.t >> 3) & 1 ? '#ff2a3a' : '#ffd23a');
    else big(G.koWinner ? `${G.koWinner.C.name} VENCE!` : 'EMPATE!', 3, '#ffffff');
  }
  if (G.paused) drawPause();
}

function drawResult() {
  const won = G.matchWinner === G.p1;
  drawStage(ctx, 96, G.t, 0.55, won ? 1 : 0);
  text(ctx, won ? 'VOCÊ VENCEU!' : 'TENTE DE NOVO', 262, 8, { scale: 3, align: 'center', color: won ? '#ffd23a' : '#ffffff', outline: '#000' });
  const f = G.winShow; f.x = 0; f.y = 0; f.facing = 1;
  ctx.save(); ctx.translate(74, 208); ctx.scale(1.6, 1.6);
  drawFighter(ctx, f, 0);
  ctx.restore();
  goldBox(156, 40, 220, 92);
  text(ctx, 'LULA:', 164, 46, { color: '#ffd23a' });
  wrap('"' + G.quote + '"', 204).forEach((l, i) => text(ctx, l, 164, 62 + i * 11, { color: '#fff' }));
  text(ctx, `PLACAR  ${G.p1.wins} X ${G.p2.wins}`, 164, 118, { color: '#9fc4ff' });
  ['REVANCHE', 'MENU'].forEach((s, i) => {
    const sel = G.resultSel === i;
    text(ctx, (sel ? '> ' : '  ') + s, 196, 146 + i * 26, { scale: 2, color: sel ? '#ffd23a' : '#888', outline: '#000' });
  });
  disclaimer();
}

const DRAW = { title: drawTitle, select: drawSelect, vs: drawVS, fight: drawFight, result: drawResult };

// ---------- loop fixo de 60 Hz ----------
function tick() {
  pc.step(); input.read(pc); cc.step(); bc.step();
  G.t++; G.sceneT++;
  UPD[G.scene]();
}
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { tick(); acc -= 1000 / 60; }
  ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false;
  DRAW[G.scene]();
  if (superBtn) superBtn.classList.toggle('ready', G.scene === 'fight' && G.p1 && G.p1.meter >= 100);
  requestAnimationFrame(frame);
}
// Layout: no desktop a arena ocupa a janela; no celular os controles ganham uma faixa PRÓPRIA (lateral ou embaixo),
// nunca por cima da luta. Escolhe a disposição que deixa a arena maior.
const AR = W / H, ORD = {
  side: ['L', 'su', 'lp', 'hp', 'lk', 'hk', 'sp', 'start'],
  bottom: ['lp', 'hp', 'sp', 'L', 'lk', 'hk', 'su', 'start'],
};
function fit() {
  const vw = innerWidth, vh = innerHeight, touch = document.body.classList.contains('touch');
  let aw, ah, ax, ay, lay = 'none';
  if (!touch) { aw = Math.floor(Math.min(vw, vh * AR)); ah = Math.floor(aw / AR); ax = (vw - aw) / 2; ay = (vh - ah) / 2; }
  else {
    const S = Math.max(100, Math.min(vh * 0.4, 190)), sideW = Math.min(vw - 2 * S, vh * AR);
    const B = Math.max(100, Math.min(vh * 0.36, 200)), botW = Math.min(vw, (vh - B) * AR);
    lay = sideW > 220 && sideW * sideW * 1.2 >= botW * botW ? 'side' : 'bottom';
    if (lay === 'side') { aw = Math.floor(sideW); ah = Math.floor(aw / AR); ax = (vw - aw) / 2; ay = (vh - ah) / 2; }
    else { aw = Math.floor(botW); ah = Math.floor(aw / AR); ax = (vw - aw) / 2; ay = 0; }
    layoutTouch(lay, vw, vh, aw, ah, S, B);
  }
  cv.style.width = aw + 'px'; cv.style.height = ah + 'px'; cv.style.left = ax + 'px'; cv.style.top = ay + 'px';
  document.body.dataset.layout = lay;
}
function layoutTouch(lay, vw, vh, aw, ah, S, B) {
  const pad = document.getElementById('dpad'), grid = document.getElementById('btns'), root = document.getElementById('touch');
  const gap = 6, m = 8;
  const bs = ORD[lay], els = {};
  for (const e of grid.children) els[e.dataset.k] = e;
  bs.forEach((k, i) => { els[k].style.order = i; });
  if (lay === 'side') {
    const cell = Math.floor(Math.min((S - gap - m * 2) / 2, (vh - m * 2 - gap * 3) / 4));
    root.style.setProperty('--cell', cell + 'px');
    grid.style.gridTemplateColumns = `repeat(2, ${cell}px)`;
    grid.style.right = m + 'px'; grid.style.top = '50%'; grid.style.left = 'auto'; grid.style.bottom = 'auto'; grid.style.transform = 'translateY(-50%)';
    const d = Math.floor(Math.min(S - m * 2, vh * 0.6));
    Object.assign(pad.style, { width: d + 'px', height: d + 'px', left: m + 'px', bottom: 'auto', top: '50%', transform: 'translateY(-50%)' });
    Object.assign(muteBtn.style, { left: m + 'px', top: m + 'px' });
  } else {
    const cell = Math.floor(Math.min((B - gap - m * 2) / 2, (vw * 0.5 - gap * 3) / 4));
    root.style.setProperty('--cell', cell + 'px');
    grid.style.gridTemplateColumns = `repeat(4, ${cell}px)`;
    grid.style.right = m + 'px'; grid.style.bottom = m + 'px'; grid.style.top = 'auto'; grid.style.left = 'auto'; grid.style.transform = 'none';
    const d = Math.floor(Math.min(B - m * 2, vw * 0.3));
    Object.assign(pad.style, { width: d + 'px', height: d + 'px', left: m + 'px', bottom: m + 'px', top: 'auto', transform: 'none' });
    Object.assign(muteBtn.style, { left: Math.round(vw / 2 - 36) + 'px', top: Math.round(ah + 8) + 'px' });
  }
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 150)); fit();
initStage();
requestAnimationFrame(frame);

// Simulação para medir o equilíbrio (só com ?debug=1): o Lula é controlado pela MESMA IA da CPU,
// então a diferença de resultado vem só da vantagem de atributos (vida, dano, defesa) e dos golpes.
// QA: quanto de vida o Lula perde ficando PARADO contra a CPU em cada dificuldade
if (DEBUG) window.__passivo = (diff = 1, seg = 30) => {
  const keep = [G.dmgMult, G.diff]; G.dmgMult = 1; G.diff = diff; G.botP1 = false; setSilent(true);
  startMatch(); G.sub = 'play'; G.cpuDmg = DIFFS[diff].dmg;
  for (let k = 0; k < seg * 60 && G.sub === 'play'; k++) { pc.step(); cc.step(); G.t++; UPD.fight(); }
  const r = { dificuldade: DIFFS[diff].name, seg, vidaLula: Math.round(G.p1.hp), de: G.p1.C.maxHp, perdeu: Math.round(G.p1.C.maxHp - G.p1.hp) };
  G.dmgMult = keep[0]; G.diff = keep[1]; setSilent(false); go('title');
  return r;
};
if (DEBUG) window.__simular = (n = 20, diff = 1) => {
  const keepMult = G.dmgMult, keepDiff = G.diff;
  G.dmgMult = 1; G.botP1 = true; G.diff = diff; setSilent(true);
  const r = { partidas: n, dificuldade: DIFFS[diff].name, lula: 0, flavio: 0, rounds_lula: 0, rounds_flavio: 0 };
  for (let i = 0; i < n; i++) {
    startMatch();
    for (let k = 0; k < 400000 && G.scene === 'fight'; k++) { pc.step(); cc.step(); bc.step(); G.t++; G.sceneT++; UPD.fight(); }
    if (G.matchWinner === G.p1) r.lula++; else r.flavio++;
    r.rounds_lula += G.p1.wins; r.rounds_flavio += G.p2.wins;
  }
  G.botP1 = false; G.dmgMult = keepMult; G.diff = keepDiff; setSilent(false); go('title');
  return r;
};
