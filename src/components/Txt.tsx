import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, font } from '@/theme/tokens';

type Variant = 'hero' | 'title' | 'h2' | 'h3' | 'body' | 'small' | 'label' | 'editorial' | 'digits';

const styles = StyleSheet.create<Record<Variant, TextStyle>>({
  hero: { fontFamily: font.displayBold, fontSize: 34, lineHeight: 40, color: colors.text, letterSpacing: -0.4 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 32, color: colors.text, letterSpacing: -0.2 },
  h2: { fontFamily: font.display, fontSize: 20, lineHeight: 26, color: colors.text },
  h3: { fontFamily: font.displayMedium, fontSize: 16, lineHeight: 21, color: colors.text },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: colors.textSoft },
  small: { fontFamily: font.body, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
  label: {
    fontFamily: font.label,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  editorial: { fontFamily: font.editorial, fontSize: 30, lineHeight: 36, color: colors.text },
  digits: { fontFamily: font.digits, fontSize: 40, lineHeight: 46, color: colors.text, letterSpacing: 1 },
});

export function Txt({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text maxFontSizeMultiplier={1.4} {...rest} style={[styles[variant], style]} />;
}
