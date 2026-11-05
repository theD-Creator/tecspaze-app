import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { colors, font, radius } from '@/theme/tokens';

import { Txt } from './Txt';

type Props = TextInputProps & { label: string; icon: keyof typeof Ionicons.glyphMap; secure?: boolean };

export const Field = forwardRef<TextInputInstance, Props>(function Field(
  { label, icon, secure, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="label">{label}</Txt>
      <View style={[styles.box, focus && styles.focus]}>
        <Ionicons name={icon} size={19} color={focus ? colors.cyan : colors.textMuted} />
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.cyan}
          secureTextEntry={secure && hidden}
          accessibilityLabel={label}
          {...rest}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Passwort anzeigen' : 'Passwort verbergen'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  focus: { borderColor: 'rgba(0,190,210,0.6)', backgroundColor: 'rgba(0,190,210,0.06)' },
  input: { flex: 1, height: '100%', color: colors.text, fontFamily: font.body, fontSize: 15.5, outlineStyle: 'none' } as never,
});
