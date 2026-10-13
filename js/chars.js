// Dados dos personagens (caricaturas). Cores e traços desenhados em sprites.js.
// maxHp / atk / def / gain: o jogo é deliberadamente favorável ao Lula (mais vida, dano e defesa).
export const CHARS = {
  lula: {
    id: 'lula', name: 'LULA', walk: 1.75, maxHp: 120, atk: 1.15, def: 0.85, gain: 1.3,
    proj: 'orb', fx: 'gold', hasL: true, hasSus: true,
    skin: '#d99b6c', skinShade: '#a8704a', skinLight: '#ecb88e',
    hair: '#f4f4f0', hairShade: '#c2c2bc', beard: '#d8d8d2', beardShade: '#9e9e98',
    suit: '#2c3c6e', suitShade: '#1b2548', suitLight: '#43579a', shirt: '#f2f2ee', tie: '#c8102e', tieShade: '#8a0a1e',
    pants: '#26335e', pantsShade: '#18203f', pantsLight: '#3a4a80', shoes: '#151515', shoeLight: '#4a4a4a',
    names: {
      sp: 'BOLSA FAMÍLIA', dp: 'SALÁRIO MÍNIMO COM GANHO REAL', dash: 'ISENÇÃO DO IR ATÉ R$ 5 MIL', sus: 'SUS',
      L: 'FAZ O L', LS: 'DEMOCRACIA', final: 'DEMOCRACIA VENCE',
    },
    moves: [
      ['BOLSA FAMÍLIA', '↓↘→ + SOCO  (OU D)'],
      ['SALÁRIO MÍNIMO COM GANHO REAL', '→↓↘ + SOCO'],
      ['ISENÇÃO DO IR ATÉ R$ 5 MIL', '← SEGURA, → + CHUTE'],
      ['SUS', '↓↙← + SOCO  (ESCUDO E VIDA)'],
      ['FAZ O L', 'L  (GASTA 1 NÍVEL)'],
      ['DEMOCRACIA', 'L OU C COM A BARRA CHEIA'],
      ['DEMOCRACIA VENCE', 'NO FINISH HIM: ↓↓→ + L'],
    ],
    quotes: [
      'A ESPERANÇA VENCEU O MEDO.',
      'DEMOCRACIA SEMPRE.',
      'O BRASIL É DO POVO BRASILEIRO.',
      'JUNTOS, O BRASIL VAI MAIS LONGE.',
    ],
  },
  flavio: {
    id: 'flavio', name: 'FLÁVIO', walk: 1.6, maxHp: 100, atk: 1, def: 1, gain: 1,
    proj: 'blast', fx: 'steel',
    skin: '#eab38c', skinShade: '#b9805c', skinLight: '#f8cba8',
    hair: '#2a1c12', hairShade: '#4d3726', beard: '#2a1c12', beardShade: '#4d3726',
    suit: '#26282f', suitShade: '#15161b', suitLight: '#3c3f4a', shirt: '#ffffff', tie: '#2a5bd7', tieShade: '#1a3a90',
    pants: '#2a2c33', pantsShade: '#18191e', pantsLight: '#40434d', shoes: '#0d0d0d', shoeLight: '#3a3a3a',
    names: { sp: 'ATAQUE', dp: 'GANCHO', dash: 'INVESTIDA', su: 'OFENSIVA' },
    moves: [
      ['ATAQUE', '↓↘→ + SOCO'],
      ['GANCHO', '→↓↘ + SOCO'],
      ['INVESTIDA', '← SEGURA, → + CHUTE'],
      ['OFENSIVA', 'SUPER COM A BARRA CHEIA'],
    ],
  },
};
