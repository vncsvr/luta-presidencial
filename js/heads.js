// Cabeças em pixel art (caricatura desenhada por código, sem foto). Caixa 20×24, de frente para +x; (x, y) = canto superior esquerdo.
export const OUT = '#140d18';
const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const ob = (c, x, y, w, h, col) => { px(c, x - 1, y - 1, w + 2, h + 2, OUT); px(c, x, y, w, h, col); };

function eyes(c, x, y, face) {
  const D = OUT;
  if (face === 'hurt') { px(c, x, y + 1, 3, 1, D); px(c, x + 1, y, 1, 1, D); px(c, x + 1, y + 2, 1, 1, D); }
  else if (face === 'ko') px(c, x - 1, y + 1, 4, 1, D);
  else if (face === 'dizzy') { px(c, x - 1, y, 4, 1, D); px(c, x + 1, y + 1, 2, 1, D); }
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

function glasses(c, x, y) {                                   // óculos escuros
  px(c, x + 4, y + 9, 8, 1, OUT);                              // haste
  ob(c, x + 11, y + 8, 10, 5, '#0b0b14');
  px(c, x + 12, y + 9, 3, 1, '#7d92c8'); px(c, x + 16, y + 9, 1, 1, '#4a5a8a');
}

function panama(c, C, x, y) {                                 // chapéu panamá: copa com vinco, faixa preta e aba larga
  ob(c, x - 5, y - 1, 31, 3, C.hat); px(c, x - 5, y + 1, 31, 1, C.hatShade);
  ob(c, x + 22, y, 5, 3, C.hat); px(c, x + 22, y + 2, 5, 1, C.hatShade);          // ponta da aba, caída na frente
  ob(c, x + 1, y - 10, 17, 10, C.hat);
  px(c, x + 1, y - 10, 5, 10, C.hatShade); px(c, x + 14, y - 9, 3, 6, C.hatLight);
  px(c, x + 7, y - 10, 6, 2, C.hatShade);                       // vinco
  px(c, x + 1, y - 4, 17, 3, C.band); px(c, x + 12, y - 4, 4, 1, '#3a3644');
  px(c, x - 3, y - 1, 24, 1, C.hatLight);
}
function topHat(c, C, x, y) {                                 // cartola do Willie Wonka com faixa turquesa
  ob(c, x + 2, y - 20, 16, 19, C.hat);
  px(c, x + 2, y - 20, 5, 19, C.hatShade); px(c, x + 15, y - 19, 2, 14, C.hatLight);
  px(c, x + 3, y - 20, 14, 1, C.hatLight);
  px(c, x + 2, y - 7, 16, 4, C.band); px(c, x + 2, y - 7, 5, 4, '#127a6f'); px(c, x + 15, y - 7, 2, 1, '#7ae6da');
  ob(c, x - 5, y - 3, 30, 4, C.hat); px(c, x - 5, y + 0, 30, 1, C.hatShade); px(c, x - 3, y - 3, 24, 1, C.hatLight);
}

const FACES = {
  lula(c, C, x, y, face, R) {
    ob(c, x, y, 20, 24, C.skin);
    px(c, x + 1, y + 1, 4, 22, C.skinShade);
    px(c, x + 16, y + 3, 3, 6, C.skinLight);
    ob(c, x - 1, y - 3, 15, 5, C.hair); px(c, x + 3, y - 2, 8, 1, '#ffffff'); px(c, x - 1, y, 15, 1, C.hairShade);
    ob(c, x - 3, y + 1, 7, 13, C.hair); px(c, x - 3, y + 8, 3, 6, C.hairShade); px(c, x - 4, y + 3, 2, 5, C.hair);
    px(c, x - 1, y + 2, 1, 6, '#ffffff');
    px(c, x + 5, y + 9, 4, 6, C.skinShade); px(c, x + 6, y + 10, 2, 4, '#8a5a3a');
    const browY = face === 'angry' ? y + 8 : y + 7;
    px(c, x + 11, browY, 8, 3, C.beard); px(c, x + 11, browY + 2, 8, 1, C.beardShade);
    if (face === 'angry') px(c, x + 16, browY + 3, 3, 1, C.beardShade);
    eyes(c, x + 14, y + 10, face);
    px(c, x + 16, y + 13, 3, 2, '#c97858');
    px(c, x + 4, y + 14, 18, 10, C.beard); px(c, x + 6, y + 24, 13, 3, C.beard);          // barba cheia
    px(c, x + 4, y + 18, 5, 6, C.beardShade); px(c, x + 8, y + 25, 9, 2, C.beardShade);
    px(c, x + 6, y + 27, 13, 1, OUT); px(c, x + 19, y + 24, 1, 3, OUT); px(c, x + 22, y + 15, 1, 8, OUT);
    px(c, x + 15, y + 15, 5, 1, '#f4f4f0');
    ob(c, x + 19, y + 10, 4, 6, C.skin); px(c, x + 19, y + 14, 4, 2, C.skinShade); px(c, x + 21, y + 11, 1, 2, C.skinLight);
    px(c, x + 14, y + 16, 9, 3, C.beardShade); px(c, x + 15, y + 16, 6, 1, C.beard);
    mouth(c, x + 16, y + 20, face, '#4a1414');
    px(c, x + 3, y + 28, 15, 1, OUT); px(c, x + 4, y + 28, 13, 1, C.gold);                  // corrente
    ob(c, x + 9, y + 29, 4, 4, C.gold); px(c, x + 9, y + 29, 2, 1, '#fff6c0'); px(c, x + 11, y + 31, 2, 2, C.goldShade);
    if (R.glasses) glasses(c, x, y);
    if (R.hat !== false) panama(c, C, x, y);
  },
  flavio(c, C, x, y, face, R) {
    ob(c, x - 3, y + 1, 9, 21, C.hair); px(c, x - 3, y + 14, 4, 8, '#1a110a');                 // cabelo comprido de trás (corte Wonka)
    ob(c, x, y, 20, 24, C.skin);
    px(c, x + 1, y + 1, 4, 22, C.skinShade);
    px(c, x + 16, y + 3, 3, 6, C.skinLight);
    ob(c, x + 4, y + 22, 15, 3, C.skin); px(c, x + 4, y + 24, 15, 1, C.skinShade);
    ob(c, x - 1, y - 3, 21, 6, C.hair); px(c, x + 6, y - 2, 9, 1, C.hairShade); px(c, x + 9, y - 1, 6, 1, '#5d4636');
    px(c, x + 15, y + 3, 5, 3, C.hair);                                                       // franja
    px(c, x + 4, y + 6, 3, 8, C.hair);
    px(c, x + 6, y + 9, 4, 6, C.skinShade); px(c, x + 7, y + 10, 2, 4, '#9a6040');
    const browY = face === 'angry' ? y + 9 : y + 8;
    px(c, x + 13, browY, 7, 2, C.hair);
    if (face === 'angry') px(c, x + 17, browY + 2, 3, 1, C.hair);
    eyes(c, x + 15, y + 11, face);
    ob(c, x + 19, y + 11, 3, 5, C.skin); px(c, x + 19, y + 14, 3, 2, C.skinShade);
    mouth(c, x + 15, y + 18, face, '#6a2020');
    topHat(c, C, x, y);
  },
};
export function pixelHead(c, C, x, y, face = 'normal', R = {}) { FACES[C.id](c, C, x, y, face, R); }
