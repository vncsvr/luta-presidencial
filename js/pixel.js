// Pixel art: tudo é desenhado numa camada pequena (1 px da camada = 1 unidade lógica = 2 px do canvas),
// reduzido a uma paleta fixa, sem suavização, e ampliado com vizinho mais próximo.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function layer(w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true });
  return { cv, c, w, h };
}
export const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export function mix(a, b, k) {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
export function dk(hex, k) {
  return '#' + rgb(hex).map(v => Math.min(255, Math.round(v * k)).toString(16).padStart(2, '0')).join('');
}
// paleta = lista de #rrggbb sem repetição
export function makePalette(list) {
  const seen = new Set(), cols = [];
  for (const h of list) if (h && /^#[0-9a-f]{6}$/i.test(h) && !seen.has(h.toLowerCase())) { seen.add(h.toLowerCase()); cols.push(rgb(h)); }
  return { cols, memo: new Map() };
}
function nearest(pal, r, g, b) {
  const key = (r << 16) | (g << 8) | b, m = pal.memo.get(key);
  if (m !== undefined) return m;
  let best = 0, bd = 1e9;
  for (let i = 0; i < pal.cols.length; i++) {
    const p = pal.cols[i], dr = p[0] - r, dg = p[1] - g, db = p[2] - b, d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (d < bd) { bd = d; best = i; }
  }
  pal.memo.set(key, best); return best;
}
// Reduz a camada à paleta. dither: pixels semitransparentes (brilhos) viram pontilhado em vez de sumir.
// post(x, y, idx) pode trocar o índice da cor (ex.: riscas do terno).
export function quantize(L, pal, o = {}) {
  const im = L.c.getImageData(0, 0, L.w, L.h), d = im.data, n = L.w * L.h;
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    if (a < 128) {
      const x = p % L.w, y = (p / L.w) | 0;
      if (!o.dither || a / 128 * 16 <= BAYER[(y & 3) * 4 + (x & 3)] + 0.5 || a < 14) { d[i + 3] = 0; continue; }
    }
    let k = nearest(pal, d[i], d[i + 1], d[i + 2]);
    if (o.post) k = o.post((p % L.w), (p / L.w) | 0, k);
    const c = pal.cols[k]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  L.c.putImageData(im, 0, 0);
}
// Sem paleta: reduz cada canal a `lv` níveis (letreiros).
export function posterize(L, lv = 5) {
  const im = L.c.getImageData(0, 0, L.w, L.h), d = im.data, st = 255 / (lv - 1);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
    d[i + 3] = 255;
    for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / st) * st;
  }
  L.c.putImageData(im, 0, 0);
}
// Cenário: níveis por canal com pontilhado ordenado (visual de jogo de luta antigo).
export function stageDither(L, lv = 8) {
  const im = L.c.getImageData(0, 0, L.w, L.h), d = im.data, st = 255 / (lv - 1), w = L.w;
  for (let p = 0, i = 0; i < d.length; p++, i += 4) {
    const t = (BAYER[((p / w | 0) & 3) * 4 + ((p % w) & 3)] / 16 - 0.47) * st * 0.9;
    for (let k = 0; k < 3; k++) { const v = d[i + k] + t; d[i + k] = Math.max(0, Math.min(255, Math.round(v / st) * st)); }
    d[i + 3] = 255;
  }
  L.c.putImageData(im, 0, 0);
}
export function blit(c, L, x, y, flip = 1, ox = 0, oy = 0, k = 1) {
  c.save(); c.imageSmoothingEnabled = false; c.translate(x, y); c.scale(flip * k, k); c.drawImage(L.cv, -ox, -oy); c.restore();
}
