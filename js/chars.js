export const CHARS = {
  lula: {
    id: 'lula', name: 'LULA', walk: 1.75, maxHp: 120, atk: 1.15, def: 0.85, gain: 1.3,
    proj: 'orb', fx: 'gold', hasL: true, hasSus: true,
    skin: '#d99b6c', skinShade: '#a8704a', skinLight: '#ecb88e', skinDeep: '#8a5638',
    hair: '#f4f4f0', hairShade: '#c2c2bc', beard: '#e6e6e0', beardShade: '#a6a6a0',
    // terno risca de giz azul-marinho, camisa escura aberta, corrente dourada, lenço vermelho, chapéu panamá
    suit: '#26345c', suitShade: '#161f3a', suitLight: '#3d5190', stripe: '#9db0e0',
    shirt: '#18181f', shirtLight: '#34343f', tie: '#c8102e', tieShade: '#8a0a1e',
    pants: '#243258', pantsShade: '#151d38', pantsLight: '#3b4d88',
    shoes: '#1b1410', shoeLight: '#5a4a40', gold: '#f2c744', goldShade: '#b88a1c',
    hat: '#efe2b6', hatShade: '#c8b57c', hatLight: '#fff6d8', band: '#1d1a22',
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
    proj: 'choc', fx: 'choc', hasPool: true,
    skin: '#eab38c', skinShade: '#b9805c', skinLight: '#f8cba8', skinDeep: '#96603f',
    hair: '#2a1c12', hairShade: '#4d3726', beard: '#2a1c12', beardShade: '#4d3726',
    // casaca vinho, colete dourado, gravata borboleta turquesa, cartola e bengala
    suit: '#6e2455', suitShade: '#431532', suitLight: '#9a3d78', stripe: null,
    shirt: '#f4efe4', shirtLight: '#ffffff', tie: '#22b3a4', tieShade: '#127a6f',
    vest: '#e2a53c', vestShade: '#a8721c', vestLight: '#ffd877',
    pants: '#b9b19e', pantsShade: '#8a8372', pantsLight: '#d8d1be',
    shoes: '#3b2212', shoeLight: '#7a5434', gold: '#f2c744', goldShade: '#b88a1c',
    hat: '#4a1a40', hatShade: '#2c0f27', hatLight: '#74306a', band: '#22b3a4',
    names: { sp: 'BARRA DE CHOCOLATE', dp: 'CASCATA DOCE', dash: 'BOMBOM EXPRESSO', su: 'RIO DE CHOCOLATE', pool: 'PISTA DE CHOCOLATE' },
    moves: [
      ['BARRA DE CHOCOLATE', '↓↘→ + SOCO'],
      ['CASCATA DOCE', '→↓↘ + SOCO'],
      ['BOMBOM EXPRESSO', '← SEGURA, → + CHUTE'],
      ['PISTA DE CHOCOLATE', '↓↙← + SOCO  (CHÃO ESCORREGA)'],
      ['RIO DE CHOCOLATE', 'SUPER COM A BARRA CHEIA'],
    ],
  },
};
