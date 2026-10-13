// IA da CPU: usa o mesmo controle do jogador (sem trapaça), decide a cada "tempo de reação".
export const DIFFS = [
  { name: 'FÁCIL',   react: 26, block: 0.15, atk: 0.45, sp: 0.12, jump: 0.08 },
  { name: 'NORMAL',  react: 15, block: 0.40, atk: 0.70, sp: 0.22, jump: 0.12 },
  { name: 'DIFÍCIL', react: 8,  block: 0.70, atk: 0.85, sp: 0.32, jump: 0.15 },
];

export function aiThink(me, opp, G, ctl, D) {
  const ai = me.ai || (me.ai = { wait: 0, hold: {}, press: null });
  const h = {};
  const fwd = me.facing === 1 ? 'right' : 'left', back = me.facing === 1 ? 'left' : 'right';
  const R = Math.random, d = Math.abs(opp.x - me.x);

  // no ar perto do oponente: chuta
  if (me.state === 'jump' && !me.airUsed && d < 70 && R() < 0.3) h.hk = true;

  if (ai.wait > 0) { ai.wait--; Object.assign(h, ai.hold); ctl.held = h; return; }
  ai.hold = {}; let press = null;
  const threat = G.projs.find(p => p.owner !== me && Math.sign(p.vx) === Math.sign(me.x - p.x) && Math.abs(p.x - me.x) < 130);
  const oppAtk = opp.state === 'attack' && d < 75;

  const antiAir = !opp.onGround && opp.vy > -2 && d < 64 && opp.state !== 'ko';
  if (antiAir && R() < D.block) {
    press = 'dp'; ai.wait = D.react;
  } else if (threat) {
    if (R() < D.block) { ai.hold = { [back]: true }; ai.wait = 26; }
    else if (R() < 0.35) { ai.hold = { up: true, [fwd]: true }; ai.wait = 6; }
    else ai.wait = D.react;
  } else if (oppAtk && R() < D.block) {
    ai.hold = { [back]: true, down: !!(opp.mv && opp.mv.low) }; ai.wait = 16;
  } else if (me.meter >= 100 && d < 230 && R() < 0.3) {
    press = 'su'; ai.wait = D.react;
  } else if (d > 140) {
    if (R() < D.sp) press = 'sp'; else ai.hold = { [fwd]: true };
    ai.wait = D.react;
  } else if (d > 58) {
    const r = R();
    if (r < D.jump) { ai.hold = { up: true, [fwd]: true }; ai.wait = 8; }
    else if (r < D.jump + 0.08 && d > 80) press = 'dash';
    else if (r < D.jump + D.sp * 0.5) press = 'sp';
    else ai.hold = { [fwd]: true };
    ai.wait = D.react;
  } else {
    if (R() < D.atk) {
      const m = ['lp', 'hp', 'lk', 'hk', 'clk', 'chp', 'lp'][R() * 7 | 0];
      if (m[0] === 'c') { ai.hold = { down: true }; press = m.slice(1); } else press = m;
    } else if (R() < 0.5) ai.hold = { [back]: true };
    ai.wait = D.react;
  }
  Object.assign(h, ai.hold);
  if (press) h[press] = true;
  ctl.held = h;
}
