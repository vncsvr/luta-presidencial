import { layer, posterize } from "./pixel.js";
// Fonte bitmap 5x7 desenhada por código (colunas, bit 0 = linha de cima).
const G = {
  A:[0x7E,0x09,0x09,0x09,0x7E], B:[0x7F,0x49,0x49,0x49,0x36], C:[0x3E,0x41,0x41,0x41,0x22],
  D:[0x7F,0x41,0x41,0x22,0x1C], E:[0x7F,0x49,0x49,0x49,0x41], F:[0x7F,0x09,0x09,0x09,0x01],
  G:[0x3E,0x41,0x49,0x49,0x7A], H:[0x7F,0x08,0x08,0x08,0x7F], I:[0x00,0x41,0x7F,0x41,0x00],
  J:[0x20,0x40,0x41,0x3F,0x01], K:[0x7F,0x08,0x14,0x22,0x41], L:[0x7F,0x40,0x40,0x40,0x40],
  M:[0x7F,0x02,0x0C,0x02,0x7F], N:[0x7F,0x04,0x08,0x10,0x7F], O:[0x3E,0x41,0x41,0x41,0x3E],
  P:[0x7F,0x09,0x09,0x09,0x06], Q:[0x3E,0x41,0x51,0x21,0x5E], R:[0x7F,0x09,0x19,0x29,0x46],
  S:[0x46,0x49,0x49,0x49,0x31], T:[0x01,0x01,0x7F,0x01,0x01], U:[0x3F,0x40,0x40,0x40,0x3F],
  V:[0x1F,0x20,0x40,0x20,0x1F], W:[0x3F,0x40,0x38,0x40,0x3F], X:[0x63,0x14,0x08,0x14,0x63],
  Y:[0x07,0x08,0x70,0x08,0x07], Z:[0x61,0x51,0x49,0x45,0x43],
  0:[0x3E,0x51,0x49,0x45,0x3E], 1:[0x00,0x42,0x7F,0x40,0x00], 2:[0x42,0x61,0x51,0x49,0x46],
  3:[0x21,0x41,0x45,0x4B,0x31], 4:[0x18,0x14,0x12,0x7F,0x10], 5:[0x27,0x45,0x45,0x45,0x39],
  6:[0x3C,0x4A,0x49,0x49,0x30], 7:[0x01,0x71,0x09,0x05,0x03], 8:[0x36,0x49,0x49,0x49,0x36],
  9:[0x06,0x49,0x49,0x29,0x1E],
  '!':[0x00,0x00,0x5F,0x00,0x00], '.':[0x00,0x60,0x60,0x00,0x00], ',':[0x00,0x50,0x30,0x00,0x00],
  ':':[0x00,0x36,0x36,0x00,0x00], '?':[0x02,0x01,0x51,0x09,0x06], '-':[0x08,0x08,0x08,0x08,0x08],
  '/':[0x20,0x10,0x08,0x04,0x02], "'":[0x00,0x00,0x07,0x00,0x00], '(':[0x00,0x1C,0x22,0x41,0x00],
  ')':[0x00,0x41,0x22,0x1C,0x00], '<':[0x08,0x14,0x22,0x41,0x00], '>':[0x00,0x41,0x22,0x14,0x08],
  '+':[0x08,0x08,0x3E,0x08,0x08], '*':[0x14,0x08,0x3E,0x08,0x14], '"':[0x00,0x07,0x00,0x07,0x00], 'º':[0x00,0x06,0x09,0x06,0x00],
  '↓':[0x10,0x20,0x7F,0x20,0x10], '↑':[0x04,0x02,0x7F,0x02,0x04], '→':[0x08,0x08,0x2A,0x1C,0x08],
  '←':[0x08,0x1C,0x2A,0x08,0x08], '=':[0x14,0x14,0x14,0x14,0x14], '$':[0x24,0x2A,0x7F,0x2A,0x12], '↘':[0x01,0x12,0x14,0x18,0x1E], '↙':[0x1E,0x18,0x14,0x12,0x01],
  ' ':[0,0,0,0,0],
};
const MARK = {
  acute:[[2,-1],[3,-2]], grave:[[1,-2],[2,-1]], circ:[[1,-1],[2,-2],[3,-1]],
  tilde:[[0,-1],[1,-2],[2,-1],[3,-2]], ced:[[2,7],[2,8],[1,8]],
};
const ACC = { 'Á':['A','acute'],'À':['A','grave'],'Â':['A','circ'],'Ã':['A','tilde'],'É':['E','acute'],
  'Ê':['E','circ'],'Í':['I','acute'],'Ó':['O','acute'],'Ô':['O','circ'],'Õ':['O','tilde'],
  'Ú':['U','acute'],'Ç':['C','ced'] };

const cache = new Map();
function glyph(ch, color) {
  const key = ch + color;
  let g = cache.get(key);
  if (g) return g;
  g = document.createElement('canvas'); g.width = 5; g.height = 10;
  const c = g.getContext('2d'); c.fillStyle = color;
  const [base, mark] = ACC[ch] || [ch, null];
  const cols = G[base] || G['?'];
  for (let x = 0; x < 5; x++) for (let y = 0; y < 7; y++) if (cols[x] >> y & 1) c.fillRect(x, y + 2, 1, 1);
  if (mark) for (const [x, y] of MARK[mark]) c.fillRect(x, y + 2, 1, 1);
  cache.set(key, g);
  return g;
}

export const textWidth = (s, scale = 1) => (s.length * 6 - 1) * scale;

// Desenha texto; y = topo das maiúsculas. opts: color, scale, align, shadow, outline
export function text(ctx, str, x, y, o = {}) {
  const s = o.scale || 1, color = o.color || '#fff';
  str = String(str).toUpperCase();
  let x0 = x;
  if (o.align === 'center') x0 = Math.round(x - textWidth(str, s) / 2);
  else if (o.align === 'right') x0 = x - textWidth(str, s);
  const pass = (col, dx, dy) => {
    for (let i = 0; i < str.length; i++) {
      ctx.drawImage(glyph(str[i], col), 0, 0, 5, 10, x0 + i * 6 * s + dx, y - 2 * s + dy, 5 * s, 10 * s);
    }
  };
  if (o.outline) for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]]) pass(o.outline, dx * s, dy * s);
  if (o.shadow) pass(o.shadow, s, s);
  pass(color, 0, 0);
}

// Quebra texto em linhas que caibam em maxW pixels
export function wrap(str, maxW, scale = 1) {
  const words = str.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t, scale) > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---- letreiros grandes em vetor (alta resolução) ----
// O contexto chega em unidades lógicas (escala 2); aqui se desenha a 0,5× para usar o canvas inteiro.
const BIG_FONT = '900 italic SIZEpx "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif';
function bigFont(ctx, size) {
  ctx.font = BIG_FONT.replace('SIZE', Math.round(size * 2));
  if ('letterSpacing' in ctx) ctx.letterSpacing = Math.round(size * 0.12) + 'px';
}
export function bigWidth(ctx, str, size) { ctx.save(); bigFont(ctx, size); const w = ctx.measureText(String(str).toUpperCase()).width / 2; ctx.restore(); return w; }
// (x, y) = centro-topo em unidades lógicas; size = altura aproximada em unidades lógicas.
// o.fill = [cor de cima, cor de baixo]; o.stroke = contorno; o.shadow = sombra
function bigTextV(ctx, str, x, y, size, o = {}) {
  str = String(str).toUpperCase();
  ctx.save(); ctx.scale(0.5, 0.5);
  bigFont(ctx, size);
  ctx.textBaseline = 'top'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const w = ctx.measureText(str).width, px = x * 2, py = y * 2, s2 = size * 2;
  const ax = o.align === 'left' ? px : o.align === 'right' ? px - w : px - w / 2;
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(str, ax + s2 * 0.07, py + s2 * 0.08); }
  ctx.strokeStyle = o.stroke || '#1a0610'; ctx.lineWidth = Math.max(3, s2 * 0.16); ctx.strokeText(str, ax, py);
  const f = o.fill || ['#ffffff', '#ffffff'];
  const g = ctx.createLinearGradient(0, py, 0, py + s2 * 1.1); g.addColorStop(0, f[0]); g.addColorStop(1, f[1] || f[0]);
  ctx.fillStyle = g; ctx.fillText(str, ax, py);
  ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff'; ctx.save(); ctx.beginPath(); ctx.rect(ax - 4, py, w + 8, s2 * 0.38); ctx.clip(); ctx.fillText(str, ax, py); ctx.restore();
  ctx.restore();
}

// Letreiro em pixel art: o vetor é desenhado numa camada 400×150 (1 px = 1 unidade lógica), com poucos níveis de cor, e ampliado seco.
let BL;
export function bigText(ctx, str, x, y, size, o = {}) {
  BL ||= layer(400, 150);
  const k = BL.c, ax = o.align === 'left' ? 20 : o.align === 'right' ? 380 : 200;
  k.setTransform(1, 0, 0, 1, 0, 0); k.clearRect(0, 0, 400, 150); k.imageSmoothingEnabled = true;
  bigTextV(k, str, ax, 20, size, o);
  posterize(BL, 5);
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(BL.cv, Math.round(x) - ax, Math.round(y) - 20); ctx.restore();
}
