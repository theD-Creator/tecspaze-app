// Tecspaze design tokens.
// Base: deep navy night (from the brand backgrounds), glass surfaces,
// brand gradient magenta → cyan used sparingly, mango as warm highlight.
export const colors = {
  bg: '#060A1C',
  bgRaised: '#0B1230',
  navy: '#00144A',
  glass: 'rgba(255,255,255,0.06)',
  glassStrong: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassBorderStrong: 'rgba(255,255,255,0.18)',
  text: '#F4F6FF',
  textSoft: 'rgba(232,236,255,0.72)',
  textMuted: 'rgba(214,220,255,0.48)',
  magenta: '#C83278',
  violet: '#6F71A0',
  cyan: '#00BED2',
  mango: '#F0962D',
  mangoSoft: '#FFB867',
  lilac: '#9C8CFF',
  mint: '#3DDC97',
  danger: '#FF5A6E',
  gold: '#FFC94A',
  silver: '#C9D3E6',
  bronze: '#E0915A',
} as const;

export const gradients = {
  brand: ['#C83278', '#6F71A0', '#00BED2'] as const,
  brandSoft: ['rgba(200,50,120,0.35)', 'rgba(0,190,210,0.25)'] as const,
  mango: ['#FFB867', '#F0962D'] as const,
  night: ['#0B1233', '#060A1C'] as const,
  glass: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)'] as const,
};

/** Chunky action tiles (reference 1), translated to the brand palette. */
export const tileColors = {
  mango: { bg: '#F0962D', ink: '#2A1300' },
  magenta: { bg: '#E0488F', ink: '#2B0016' },
  cyan: { bg: '#19C9DB', ink: '#00262B' },
  lilac: { bg: '#9C8CFF', ink: '#160F3D' },
} as const;

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 } as const;

export const font = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  displayMedium: 'Fredoka_500Medium',
  body: 'Nunito_600SemiBold',
  bodyRegular: 'Nunito_400Regular',
  bodyBold: 'Nunito_800ExtraBold',
  editorial: 'Raleway_500Medium_Italic',
  editorialBold: 'Raleway_700Bold_Italic',
  label: 'Raleway_700Bold',
  labelSemi: 'Raleway_600SemiBold',
  digits: 'Doto_900Black',
  digitsBold: 'Doto_800ExtraBold',
} as const;

export const MAX_WIDTH = 560;
export const TAB_BAR_SPACE = 110;
