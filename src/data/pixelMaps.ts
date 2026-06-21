export const palette = {
  B: '#007BFF',
  W: '#FFFFFF',
  R: '#E63946',
  G: '#F4A261',
  K: '#000000',
  S: '#FFD166',
  T: 'transparent',
} as const;

export type PaletteKey = keyof typeof palette;

export type PixelGrid = PaletteKey[][];

export const hatFaceMap: PixelGrid = [
  ['T','T','T','T','T','T','R','T','T','T','T','T','T','T','T','T'],
  ['T','T','T','T','T','R','R','R','T','T','T','T','T','T','T','T'],
  ['T','T','T','T','R','R','R','R','R','T','T','T','T','T','T','T'],
  ['T','T','T','R','R','S','R','R','R','R','T','T','T','T','T','T'],
  ['T','T','R','R','R','R','R','R','R','R','R','T','T','T','T','T'],
  ['T','K','K','K','K','K','K','K','K','K','K','K','T','T','T','T'],
  ['K','B','B','B','B','K','B','B','B','B','B','B','K','T','T','T'],
  ['K','B','B','B','B','K','B','B','B','B','B','B','K','T','T','T'],
  ['K','B','W','W','B','B','W','W','B','B','B','B','K','T','T','T'],
  ['K','B','W','W','B','B','W','W','B','B','B','B','K','T','T','T'],
  ['K','B','B','B','B','B','B','B','B','B','B','B','K','T','T','T'],
  ['T','K','B','B','B','B','B','B','B','B','B','K','T','T','T','T'],
  ['T','T','K','R','R','R','R','R','R','R','K','T','T','T','T','T'],
  ['T','T','T','K','K','G','G','K','K','K','T','T','T','T','T','T'],
  ['T','T','T','T','T','G','G','T','T','T','T','T','T','T','T','T'],
  ['T','T','T','T','T','T','T','T','T','T','T','T','T','T','T','T'],
];
