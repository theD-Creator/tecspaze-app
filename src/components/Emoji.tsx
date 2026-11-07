import { StyleSheet, Text } from 'react-native';

/**
 * Big emoji without clipping: system font (no custom fontFamily) and a line height that
 * fits the glyph. Inherited body line heights cut emojis in half on Android.
 */
export function Emoji({ children, size = 40 }: { children: string; size?: number }) {
  return (
    <Text
      accessible={false}
      maxFontSizeMultiplier={1.2}
      style={[styles.base, { fontSize: size, lineHeight: Math.round(size * 1.3), minHeight: Math.round(size * 1.3) }]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
});
