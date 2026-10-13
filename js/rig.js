// Rig: converte o estado do lutador em parâmetros de pose (coordenadas de alta resolução, origem nos pés,
// de frente para +x) e suaviza entre quadros — isso gera os quadros intermediários (antecipação, follow-through).
// Mãos são relativas ao ombro; pés são absolutos (tornozelo). Cada membro leva o sinal da dobra do cotovelo/joelho.
export const TORSO = 62, THIGH = 48, SHIN = 50, UARM = 34, FARM = 36;

const GUARD_F = [46, -10, 1], GUARD_B = [28, 4, 1];
const FOOT_F = [20, -11, -1], FOOT_B = [-26, -11, -1];

function base() {
  return {
    hx: 0, hy: 96, th: TORSO, lean: 0, hdx: 0, hdy: 0,
    hF: GUARD_F.slice(), hB: GUARD_B.slice(), fF: FOOT_F.slice(), fB: FOOT_B.slice(),
    face: 'normal', shape: 'fist', spd: 0.3, aura: 0, L: 0, pillar: false, shieldFront: false, dome: false, lying: false,
    glasses: false, spin: 0,
  };
}

export function target(f) {
  const T = base(), s = f.state, t = f.t, gold = f.C.fx === 'gold';
  if (s === 'idle') {
    const b = Math.sin(t * 0.09), intro = t < 105;
    T.hy = 97 - b * 1.6; T.hF[1] = -10 + b * 2; T.hB[1] = 4 + b * 2; T.lean = 4; T.spd = 0.22;
    T.glasses = intro && f.C.hasL;
  } else if (s === 'walk' || s === 'leave') {
    const ph = t * 0.22, k = Math.sin(ph), k2 = Math.sin(ph + Math.PI);
    T.fF = [8 + 30 * k, -11 - Math.max(0, Math.cos(ph)) * 22, -1];
    T.fB = [-22 + 30 * k2, -11 - Math.max(0, Math.cos(ph + Math.PI)) * 22, -1];
    T.hy = 96 - Math.abs(k) * 4; T.lean = 6; T.spd = 0.6;
    T.hF = [44, -8 + k * 3, 1]; T.hB = [28, 6 + k2 * 3, 1];
    if (s === 'leave') { T.hF = [8, 52, 1]; T.hB = [-6, 54, 1]; T.lean = 2; }
  } else if (s === 'crouch' || s === 'lag') {
    T.hy = 60; T.th = 54; T.lean = 12; T.fF = [36, -11, -1]; T.fB = [-34, -11, -1]; T.hF = [42, 2, 1]; T.hB = [24, 14, 1];
  } else if (s === 'jump') {
    const up = f.vy < -3;
    T.spd = 0.35;
    if (up) { T.hy = 96; T.fF = [12, -22, -1]; T.fB = [-14, -14, -1]; T.hF = [30, -38, 1]; T.hB = [12, -44, 1]; }
    else { T.hy = 84; T.fF = [28, -50, -1]; T.fB = [-6, -40, -1]; T.hF = [34, -22, 1]; T.hB = [16, -16, 1]; }
    T.lean = 4;
  } else if (s === 'block') {
    T.lean = -2; T.hF = [34, -36, 1]; T.hB = [24, -24, 1]; T.face = 'angry'; T.spd = 0.5;
    if (f.crouching) { T.hy = 62; T.th = 54; T.fF = [36, -11, -1]; T.fB = [-34, -11, -1]; }
  } else if (s === 'hit') {
    const k = Math.min(1, f.stun / 16);
    T.face = 'hurt'; T.spd = 0.55;
    if (f.hitHigh) { T.lean = -20 * k; T.hdx = -8 * k; T.hy = 92; T.hF = [18, -30, 1]; T.hB = [-30, -16, 1]; }
    else { T.lean = 18 * k; T.th = 56; T.hdy = 8 * k; T.hy = 88; T.hF = [8, 34, 1]; T.hB = [-10, 36, 1]; }
    if (!f.onGround) { T.fF = [26, -48, -1]; T.fB = [-8, -38, -1]; }
  } else if (s === 'ko') {
    T.face = 'ko'; T.spd = 0.4;
    if (f.onGround) {
      T.lying = true; T.hy = 20; T.th = 0; T.hx = -8; T.lean = -66; T.hdy = 6;
      T.fF = [86, -13, -1]; T.fB = [74, -9, -1]; T.hF = [-22, 14, 1]; T.hB = [-46, 16, 1];
    } else { T.hy = 84; T.lean = -40; T.th = 54; T.fF = [28, -40, -1]; T.fB = [-4, -52, -1]; T.hF = [-6, -34, 1]; T.hB = [-30, -22, 1]; }
  } else if (s === 'dizzy') {
    const w = Math.sin(t * 0.12);
    T.face = 'dizzy'; T.lean = w * 14; T.hdx = w * 6; T.hdy = 8; T.th = 58; T.hy = 90; T.spin = t;
    T.hF = [8, 52, 1]; T.hB = [-8, 54, 1]; T.fF = [18, -11, -1]; T.fB = [-24, -11, -1]; T.spd = 0.25;
  } else if (s === 'win') {
    const w = Math.sin(t * 0.18);
    T.face = 'happy'; T.glasses = f.C.hasL;
    T.hB = [16 + w * 6, -82 + w * 8, 1]; T.hF = [40, -4, 1]; T.lean = 2; T.spd = 0.25;
  } else if (s === 'triumph') {
    T.face = 'proud'; T.aura = 1; T.hF = [22, -90, 1]; T.hB = [-6, 50, 1]; T.glasses = f.C.hasL; T.spd = 0.2;
  } else if (s === 'attack') {
    const m = f.mv, ph = f.phase();
    T.face = 'angry';
    if (m.crouch) { T.hy = 62; T.th = 54; T.fF = [36, -11, -1]; T.fB = [-34, -11, -1]; }
    if (m.air) { T.hy = 84; T.fF = [26, -48, -1]; T.fB = [-6, -38, -1]; }
    T.spd = ph === 1 ? 0.8 : 0.45;
    if (m.arm) {
      const r = m.reach[ph], dy = m.air ? 28 : m.crouch ? 8 : 6;
      if (ph === 0) {
        if (m.heavy) { T.hF = [-2, 16, 1]; T.lean = -6; }
      } else T.hF = [40 + 2 * r, dy, 1];
      if (ph === 1 && m.lean) T.lean = m.lean * 3;
      if (ph === 1) T.hB = [18, 0, 1];
    }
    if (m.legs) {
      const foot = { kickLow: [84, -66], kickHigh: [90, -108], sweep: [100, -14], airKick: [76, -60] }[m.legs];
      if (ph === 0) { if (!m.air && !m.crouch) T.fF = [40, -64, -1]; }
      else if (ph === 1 || m.air) {
        T.fF = [foot[0], foot[1], -1];
        if (ph === 1 && m.lean) T.lean = m.lean * 3;
        T.hF = [30, -6, 1]; T.hB = [10, -20, 1];
      } else if (!m.crouch) T.fF = [40, -64, -1];
      if (m.legs === 'sweep' && ph === 1) { T.hy = 44; T.th = 46; T.lean = -22; T.fB = [-36, -11, -1]; T.hF = [30, 46, 1]; T.hB = [-18, 40, 1]; }
    }
    switch (m.pose) {
      case 'throw':
        T.hy = 90; T.fF = [30, -11, -1]; T.fB = [-32, -11, -1];
        if (ph === 0) { T.hF = [-2, 18, 1]; T.hB = [-10, 22, 1]; T.lean = -6; }
        else { T.hF = [54, 6, 1]; T.hB = [44, 16, 1]; T.lean = 12; }
        break;
      case 'L':
        T.face = 'proud'; T.hB = [-4, 24, 1]; T.lean = 2;
        if (ph === 0 && f.af < m.st * 0.35) T.hF = [26, -34, 1];
        else { T.hF = [36, -62, 1]; T.shape = 'L'; T.lean = 4; }
        if (ph === 0) T.L = Math.min(1, f.af / m.st);
        break;
      case 'super':
        T.face = 'proud'; T.hy = 92; T.fF = [30, -11, -1]; T.fB = [-32, -11, -1];
        if (ph === 0) { T.hF = [24, -78, 1]; T.hB = [-6, 40, 1]; T.aura = Math.min(1, f.af / m.st); }
        else { T.hF = [56, 0, 1]; T.hB = [46, 12, 1]; T.lean = 14; T.aura = ph === 1 ? 1 : 0.4; }
        break;
      case 'uppercut':
        if (ph === 0) { T.hy = 66; T.th = 54; T.fF = [34, -11, -1]; T.fB = [-30, -11, -1]; T.hF = [-4, 20, 1]; T.lean = -6; }
        else if (ph === 1) { T.hy = 100; T.hF = [24, -76, 1]; T.fF = [12, -11, -1]; T.fB = [-14, -11, -1]; T.lean = 6; T.pillar = gold; }
        else { T.hy = 88; T.fF = [26, -46, -1]; T.fB = [-4, -38, -1]; T.hF = [22, -62, 1]; }
        break;
      case 'dash':
        if (ph === 0) { T.hy = 70; T.th = 56; T.lean = -10; T.fF = [34, -11, -1]; T.fB = [-34, -11, -1]; }
        else {
          T.hy = 72; T.th = 52; T.lean = ph === 1 ? 30 : 16; T.fF = [46, -11, -1]; T.fB = [-70, -11, -1];
          if (gold) { T.hF = [54, 6, 1]; T.hB = [44, 18, 1]; T.shieldFront = ph === 1; T.face = 'proud'; }
          else { T.hF = [42, -16, 1]; T.hB = [32, -4, 1]; }
        }
        break;
      case 'shield':
        T.face = 'proud'; T.hy = 90; T.fF = [28, -11, -1]; T.fB = [-30, -11, -1];
        if (ph === 0) { T.hF = [-2, 18, 1]; T.hB = [-8, 22, 1]; T.lean = -6; }
        else if (ph === 1) { T.hF = [48, -4, 1]; T.hB = [40, 8, 1]; T.dome = true; T.lean = 6; }
        break;
      case 'pool':
        T.hy = 74; T.th = 54; T.fF = [34, -11, -1]; T.fB = [-32, -11, -1];
        if (ph === 0) { T.hF = [-2, 18, 1]; T.hB = [-8, 22, 1]; T.lean = -8; }
        else { T.hF = [46, 56, 1]; T.hB = [30, 60, 1]; T.lean = 22; }
        break;
    }
  }
  return T;
}

const NUM = ['hx', 'hy', 'th', 'lean', 'hdx', 'hdy'];
const lerp = (a, b, k) => a + (b - a) * k;

// Suaviza os parâmetros guardados no lutador (f.rig) em direção ao alvo e devolve o conjunto atual.
export function rigFor(f, advance = true) {
  const T = target(f), R = f.rig;
  if (!R) { f.rig = JSON.parse(JSON.stringify(T)); return { ...f.rig, ...meta(T) }; }
  if (advance) {
    const k = T.spd;
    for (const n of NUM) R[n] = lerp(R[n], T[n], k);
    for (const j of ['hF', 'hB', 'fF', 'fB']) { R[j][0] = lerp(R[j][0], T[j][0], k); R[j][1] = lerp(R[j][1], T[j][1], k); R[j][2] = T[j][2]; }
  }
  return { ...R, ...meta(T) };
}
function meta(T) {
  return { face: T.face, shape: T.shape, aura: T.aura, L: T.L, pillar: T.pillar, shieldFront: T.shieldFront, dome: T.dome,
    lying: T.lying, glasses: T.glasses, spin: T.spin };
}

// Cinemática inversa de dois ossos: devolve o ponto médio (joelho/cotovelo) e a ponta alcançável.
export function ik(ax, ay, tx, ty, l1, l2, s) {
  let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy) || 0.001;
  const max = l1 + l2 - 0.6, min = Math.abs(l1 - l2) + 0.6;
  if (d > max) { tx = ax + dx / d * max; ty = ay + dy / d * max; dx = tx - ax; dy = ty - ay; d = max; }
  else if (d < min) { tx = ax + dx / d * min; ty = ay + dy / d * min; dx = tx - ax; dy = ty - ay; d = min; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = ax + dx * a / d, my = ay + dy * a / d;
  return { mx: mx - dy / d * h * s, my: my + dx / d * h * s, ex: tx, ey: ty };
}

// Posição das juntas a partir da pose suavizada.
export function joints(R) {
  const hip = { x: R.hx, y: -R.hy };
  const S = { x: hip.x + R.lean, y: hip.y - R.th };
  if (R.th === 0) { S.x = hip.x + R.lean; S.y = hip.y - 2; }
  const ax = S.x - hip.x, ay = S.y - hip.y, al = Math.hypot(ax, ay) || 1;
  const up = { x: ax / al, y: ay / al };                               // eixo do tronco (quadril → ombro)
  const nf = { x: -up.y, y: up.x };                                      // normal para a frente
  const head = { x: S.x + up.x * 28 + nf.x * 4 + R.hdx, y: S.y + up.y * 28 + nf.y * 4 + R.hdy };
  const sh = (dx, dy, spec) => {
    const a = ik(S.x + dx, S.y + 4, S.x + spec[0], S.y + spec[1], UARM, FARM, spec[2]);
    return { s: { x: S.x + dx, y: S.y + 4 }, e: { x: a.mx, y: a.my }, h: { x: a.ex, y: a.ey } };
  };
  const leg = (dx, spec) => {
    const a = ik(hip.x + dx, hip.y, spec[0], spec[1], THIGH, SHIN, spec[2]);
    return { h: { x: hip.x + dx, y: hip.y }, k: { x: a.mx, y: a.my }, a: { x: a.ex, y: a.ey } };
  };
  return { hip, S, up, nf, head, armF: sh(8, 0, R.hF), armB: sh(-9, 0, R.hB), legF: leg(7, R.fF), legB: leg(-7, R.fB) };
}
