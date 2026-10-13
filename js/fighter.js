// Lutador: estados, física, golpes, comandos de luta, hitbox/hurtbox.
import { CHARS } from './chars.js';

export const GROUND = 196, STAGE_W = 576;
const GRAV = 0.45;

// st = startup, ac = ativo, rc = recuperação (frames). box = [x, y, w, h] relativo aos pés, virado p/ direita.
export const MOVES = {
  lp:  { st: 3, ac: 3, rc: 7,  dmg: 4,  box: [16, -74, 26, 14], hs: 12, bs: 8,  push: 2.2, arm: 1, reach: [8, 22, 14] },
  hp:  { st: 6, ac: 4, rc: 15, dmg: 9,  box: [18, -76, 34, 16], hs: 18, bs: 12, push: 3.6, arm: 1, reach: [0, 30, 18], heavy: 1, lean: 4 },
  lk:  { st: 4, ac: 4, rc: 9,  dmg: 5,  box: [14, -42, 30, 16], hs: 13, bs: 9,  push: 2.4, legs: 'kickLow' },
  hk:  { st: 8, ac: 5, rc: 17, dmg: 11, box: [14, -62, 32, 18], hs: 20, bs: 13, push: 4.4, legs: 'kickHigh', heavy: 1, lean: -3 },
  clp: { st: 3, ac: 3, rc: 7,  dmg: 4,  box: [16, -56, 26, 14], hs: 12, bs: 8,  push: 2.0, arm: 1, reach: [8, 22, 14], crouch: 1 },
  chp: { st: 6, ac: 4, rc: 15, dmg: 8,  box: [18, -58, 32, 16], hs: 17, bs: 12, push: 3.4, arm: 1, reach: [0, 28, 16], crouch: 1, heavy: 1 },
  clk: { st: 4, ac: 4, rc: 10, dmg: 5,  box: [12, -16, 34, 14], hs: 13, bs: 9,  push: 2.2, legs: 'sweep', crouch: 1, low: 1 },
  chk: { st: 7, ac: 5, rc: 20, dmg: 10, box: [12, -16, 38, 14], hs: 20, bs: 12, push: 4.0, legs: 'sweep', crouch: 1, low: 1, heavy: 1 },
  jlp: { st: 3, ac: 8, rc: 4,  dmg: 5,  box: [14, -72, 28, 18], hs: 14, bs: 9,  push: 2.0, arm: 1, reach: [8, 22, 22], air: 1 },
  jhp: { st: 5, ac: 6, rc: 6,  dmg: 9,  box: [16, -70, 32, 20], hs: 18, bs: 12, push: 3.0, arm: 1, reach: [0, 28, 28], air: 1, heavy: 1 },
  jlk: { st: 3, ac: 8, rc: 4,  dmg: 6,  box: [10, -42, 32, 22], hs: 14, bs: 9,  push: 2.0, legs: 'airKick', air: 1 },
  jhk: { st: 5, ac: 6, rc: 6,  dmg: 10, box: [10, -42, 34, 24], hs: 18, bs: 12, push: 3.0, legs: 'airKick', air: 1, heavy: 1 },
  sp:  { st: 12, ac: 1, rc: 24, proj: 'normal', pose: 'throw', special: 1 },
  su:  { st: 16, ac: 1, rc: 30, proj: 'super', pose: 'throw', special: 1 },
  L:   { st: 22, ac: 1, rc: 26, proj: 'onda', pose: 'L', special: 1 },
  LS:  { st: 28, ac: 1, rc: 30, proj: 'ondaS', pose: 'super', special: 1 },
  sus: { st: 8, ac: 36, rc: 14, pose: 'shield', special: 1, shield: 1, heal: 6 },
  dp:  { st: 3, ac: 12, rc: 16, dmg: 12, box: [4, -118, 26, 64], hs: 22, bs: 14, push: 3.0, pose: 'uppercut', rise: 1, inv: 8, heavy: 1, special: 1 },
  dash:{ st: 6, ac: 18, rc: 12, dmg: 10, box: [8, -74, 36, 50], hs: 20, bs: 12, push: 4.2, pose: 'dash', dash: 1, heavy: 1, special: 1 },
};
export const PROJ = {
  normal: { dmg: 10, chip: 2, hs: 18, bs: 12, push: 3.0, vx: 3.2, w: 18, h: 18, dy: -64, proj: 1 },
  super:  { dmg: 26, chip: 6, hs: 30, bs: 20, push: 5.5, vx: 3.8, w: 30, h: 30, dy: -60, proj: 1, heavy: 1, big: 1 },
  onda:   { dmg: 14, chip: 3, hs: 22, bs: 14, push: 4.0, vx: 4.2, w: 26, h: 72, dy: -50, proj: 1, heavy: 1, wave: 1 },
  ondaS:  { dmg: 32, chip: 8, hs: 34, bs: 22, push: 6.0, vx: 4.6, w: 44, h: 100, dy: -52, proj: 1, heavy: 1, wave: 1, big: 1 },
};
export const L_COST = 100 / 3;

// sequência de direções (notação numérica) dentro de uma janela; pattern aceita -2 = "qualquer coisa diferente de 2"
function hasSeq(hist, pattern, win) {
  const h = hist.slice(-win), c = [];
  for (const d of h) if (c[c.length - 1] !== d) c.push(d);
  let i = 0;
  for (const d of c) {
    const p = pattern[i];
    if (p === -2 ? d !== 2 : d === p) i++;
    if (i === pattern.length) return true;
  }
  return false;
}

export class Fighter {
  constructor(id, side) { this.C = CHARS[id]; this.side = side; this.wins = 0; this.meter = 0; this.reset(); }
  reset() {
    this.x = STAGE_W / 2 + (this.side === 0 ? -80 : 80); this.y = GROUND; this.vx = 0; this.vy = 0;
    this.facing = this.side === 0 ? 1 : -1; this.hp = this.C.maxHp; this.ghost = this.C.maxHp;
    this.state = 'idle'; this.t = 0; this.mv = null; this.id = null; this.af = 0; this.hitDone = false; this.stun = 0;
    this.crouching = false; this.crouchHeld = false; this.holdBack = false; this.hist = []; this.airUsed = false;
    this.charge = 0; this.chargeWin = 0; this.hitHigh = true;
  }
  get onGround() { return this.y >= GROUND; }
  phase() { const m = this.mv; return this.af <= m.st ? 0 : this.af <= m.st + m.ac ? 1 : 2; }
  active() { return this.state === 'attack' && !!this.mv.box && !this.hitDone && this.phase() === 1; }
  // aceita o botão até 5 frames depois da direção final; a ordem do último 6 vs último 3 separa meia-lua de uppercut
  recent(d) { return this.hist.length - 1 - this.hist.lastIndexOf(d); }
  qcf() { return hasSeq(this.hist, [2, 3, 6], 20) && this.recent(6) <= 5 && this.recent(6) < this.recent(3); }
  dpIn() { return hasSeq(this.hist, [6, 2, 3], 20) && this.recent(3) <= 5 && this.recent(3) < this.recent(6); }
  qcbIn() { return hasSeq(this.hist, [2, 1, 4], 20) && this.recent(4) <= 5 && this.recent(4) < this.recent(1); }
  finalIn() { return hasSeq(this.hist, [2, -2, 2, 6], 40); }

  update(ctl, opp, G) {
    this.t++;
    const h = ctl.held;
    const fwdK = this.facing === 1 ? 'right' : 'left', backK = this.facing === 1 ? 'left' : 'right';
    const fwd = !!h[fwdK], back = !!h[backK], up = !!h.up, down = !!h.down;
    this.hist.push(down ? (back ? 1 : fwd ? 3 : 2) : up ? (back ? 7 : fwd ? 9 : 8) : (back ? 4 : fwd ? 6 : 5));
    if (this.hist.length > 40) this.hist.shift();
    this.holdBack = back && !up; this.crouchHeld = down;
    if (back && !up) this.charge++; else { if (this.charge >= 35) this.chargeWin = 14; this.charge = 0; }
    if (this.chargeWin > 0) this.chargeWin--;

    switch (this.state) {
      case 'hit': case 'block': case 'lag':
        this.vx *= 0.82;
        if (--this.stun <= 0 && this.onGround) { this.state = 'idle'; this.crouching = false; }
        break;
      case 'ko': case 'dizzy': if (this.onGround) this.vx *= 0.8; break;
      case 'win': this.vx = 0; break;
      case 'triumph': case 'leave': case 'gone': return;
      case 'attack': this.stepAttack(G, down); break;
      default: this.control(ctl, fwd, back, up, down, G);
    }
    if (!this.onGround || this.vy < 0) {
      this.vy += GRAV; this.y += this.vy;
      if (this.y >= GROUND) { this.y = GROUND; this.vy = 0; this.land(G); }
    }
    this.x += this.vx;
    if (this.onGround && (this.state === 'idle' || this.state === 'walk' || this.state === 'crouch')) this.facing = opp.x >= this.x ? 1 : -1;
  }

  control(ctl, fwd, back, up, down, G) {
    const P = k => ctl.pressed(k);
    if (this.onGround) {
      this.crouching = false;
      const punch = P('lp') || P('hp'), kick = P('lk') || P('hk');
      if (G.sub === 'finish' && G.koWinner === this && P('L') && this.finalIn()) return G.startFinal(this);
      // super: C, ou L com a barra cheia (Lula = DEMOCRACIA)
      if ((P('su') || (P('L') && this.C.hasL)) && this.meter >= 100 && !G.hasProj(this)) return this.startAttack(this.C.hasL ? 'LS' : 'su', G);
      if (P('L') && this.C.hasL) {
        if (G.hasProj(this)) return;
        if (this.meter >= L_COST - 0.01) return this.startAttack('L', G);
        return G.noMeter(this);
      }
      if (P('dp') || (punch && this.dpIn())) return this.startAttack('dp', G);
      if (this.C.hasSus && punch && this.qcbIn()) return this.startAttack('sus', G);
      if (P('dash') || (kick && this.chargeWin > 0 && this.recent(6) <= 5)) { this.chargeWin = 0; return this.startAttack('dash', G); }
      if ((P('sp') || (punch && this.qcf())) && !G.hasProj(this)) return this.startAttack('sp', G);
      const a = P('hp') ? 'hp' : P('lp') ? 'lp' : P('hk') ? 'hk' : P('lk') ? 'lk' : null;
      if (a) return this.startAttack(down ? 'c' + a : a, G);
      if (up) {
        this.state = 'jump'; this.vy = -8; this.airUsed = false;
        this.vx = fwd ? 2.5 * this.facing : back ? -2.5 * this.facing : 0;
        G.sfx('jump'); return;
      }
      if (down) { this.state = 'crouch'; this.crouching = true; this.vx = 0; return; }
      if (fwd) { this.state = 'walk'; this.vx = this.C.walk * this.facing; }
      else if (back) { this.state = 'walk'; this.vx = -this.C.walk * 0.8 * this.facing; }
      else { this.state = 'idle'; this.vx = 0; }
    } else if (this.state === 'jump' && !this.airUsed) {
      const a = P('hp') ? 'jhp' : P('lp') ? 'jlp' : P('hk') ? 'jhk' : P('lk') ? 'jlk' : null;
      if (a) { this.airUsed = true; this.startAttack(a, G); }
    }
  }

  startAttack(id, G) {
    const m = MOVES[id];
    this.state = 'attack'; this.mv = m; this.id = id; this.af = 0; this.hitDone = false;
    if (!m.air) this.vx = 0;
    this.crouching = !!m.crouch;
    if (id === 'su' || id === 'LS') { this.meter = 0; G.superFlash(this, this.C.names[id]); }
    else if (id === 'L') { this.meter -= L_COST; G.banner(this, this.C.names.L); G.sfx('charge'); }
    else if (m.special) G.banner(this, this.C.names[id]);
    if (m.shield) G.sfx('shield');
    else if (!m.special) G.sfx('whoosh');
  }

  stepAttack(G, down) {
    const m = this.mv;
    this.af++;
    const ph = this.phase();
    if (m.proj && this.af === m.st) G.spawnProj(this, m.proj);
    if (m.heal && this.af === m.st) { this.hp = Math.min(this.C.maxHp, this.hp + m.heal); G.heal(this); }
    if (m.rise && this.af === m.st + 1) { this.vy = -8.2; this.vx = 1.4 * this.facing; G.sfx('rise'); }
    if (m.dash) {
      if (ph === 1) { this.vx = 5 * this.facing; if (this.af % 3 === 0) G.dust(this.x - this.facing * 12, GROUND, 2); }
      else if (ph === 2) this.vx *= 0.8; else this.vx = 0;
    }
    if (this.af >= m.st + m.ac + m.rc) {
      this.mv = null;
      if (!this.onGround) { this.state = 'jump'; this.airUsed = true; }
      else if (m.crouch && down) { this.state = 'crouch'; this.crouching = true; }
      else { this.state = 'idle'; this.crouching = false; this.vx = 0; }
    }
  }

  land(G) {
    if (this.state === 'attack' && this.mv && this.mv.rise) { this.state = 'lag'; this.stun = 10; this.mv = null; this.vx = 0; G.dust(this.x, GROUND, 4); }
    else if (this.state === 'jump' || (this.state === 'attack' && this.mv && this.mv.air)) { this.state = 'idle'; this.mv = null; this.vx = 0; G.sfx('land'); G.dust(this.x, GROUND, 3); }
    else if (this.state === 'ko') { G.shake(4); G.sfx('land'); this.vx *= 0.5; G.dust(this.x - this.facing * 40, GROUND, 14); }
    else if (this.state === 'dizzy' || this.state === 'hit') G.dust(this.x, GROUND, 4);
  }

  hurtbox() {
    if (['ko', 'triumph', 'leave', 'gone'].includes(this.state)) return null;
    if (this.state === 'attack' && this.mv.inv && this.af <= this.mv.inv) return null;
    if (this.state === 'attack' && this.mv.shield && this.phase() === 1) return null;   // escudo do SUS
    const box = this.crouching ? [-15, -80, 30, 80] : !this.onGround ? [-14, -96, 28, 80] : [-14, -100, 28, 100];
    return this.world(box);
  }
  hitbox() { return this.world(this.mv.box); }
  world(b) { return [this.x + (this.facing === 1 ? b[0] : -b[0] - b[2]), this.y + b[1], b[2], b[3]]; }
}

export const overlap = (a, b) => a && b && a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

// Aplica um golpe (corpo a corpo ou projétil). hx,hy = ponto do impacto.
export function applyHit(att, def, mv, G, hx, hy, dir) {
  const canAct = def.onGround && ['idle', 'walk', 'crouch', 'block'].includes(def.state);
  const blocked = canAct && def.holdBack && !(mv.low && !def.crouchHeld) && !(mv.air && def.crouchHeld);
  const mult = G.dmgMult * att.C.atk * def.C.def;
  if (blocked) {
    def.state = 'block'; def.crouching = def.crouchHeld; def.stun = mv.bs; def.vx = dir * mv.push * 0.9;
    def.hp -= (mv.chip || 0) * mult;
    att.meter += 3 * att.C.gain; def.meter += 2 * def.C.gain;
    G.spark(hx, hy, 'block'); G.sfx('block'); G.hitstop = 5;
  } else {
    def.hp -= mv.dmg * mult; def.state = 'hit'; def.stun = mv.hs; def.vx = dir * mv.push; def.mv = null; def.crouching = false;
    def.hitHigh = hy < def.y - 62;
    if (!def.onGround) { def.vy = -3.5; def.vx = dir * 2; def.stun = Math.max(def.stun, 24); }
    att.meter += mv.dmg * 1.2 * att.C.gain; def.meter += mv.dmg * 0.6 * def.C.gain;
    G.spark(hx, hy, mv.heavy ? 'big' : 'hit'); G.sfx(mv.heavy ? 'heavy' : 'light');
    G.hitstop = mv.heavy ? 8 : 5; G.shake(mv.heavy ? 5 : 2);
  }
  att.meter = Math.min(100, att.meter); def.meter = Math.min(100, def.meter);
  G.onHit(att, def, mv, blocked);
  if (def.hp <= 0) { def.hp = 0; def.state = 'ko'; def.vy = -5; def.vx = dir * 2.6; def.mv = null; def.crouching = false; G.onKO(att, def); }
}
