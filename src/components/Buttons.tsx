import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, font, gradients, radius } from '@/theme/tokens';

import { Pressy } from './Pressy';

type BtnProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'brand' | 'glass' | 'mango' | 'danger';
  compact?: boolean;
};

export function Button({ label, onPress, icon, loading, disabled, variant = 'brand', compact }: BtnProps) {
  const h = compact ? 44 : 56;
  const textColor = variant === 'mango' ? '#2A1300' : colors.text;
  const inner = (
    <View style={[styles.row, { height: h }]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={compact ? 17 : 20} color={textColor} /> : null}
          <Text style={[styles.label, { color: textColor, fontSize: compact ? 14.5 : 16 }]}>{label}</Text>
        </>
      )}
    </View>
  );
  return (
    <Pressy
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={{ borderRadius: radius.pill, overflow: 'hidden' }}
    >
      {variant === 'glass' ? (
        <View style={styles.glass}>{inner}</View>
      ) : variant === 'danger' ? (
        <View style={[styles.glass, { borderColor: 'rgba(255,90,110,0.45)', backgroundColor: 'rgba(255,90,110,0.12)' }]}>
          {inner}
        </View>
      ) : (
        <LinearGradient
          colors={variant === 'mango' ? gradients.mango : gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {inner}
        </LinearGradient>
      )}
    </Pressy>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 46,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  size?: number;
  badge?: boolean;
}) {
  return (
    <Pressy onPress={onPress} accessibilityLabel={label}>
      <View style={[styles.iconBtn, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name={icon} size={size * 0.44} color={colors.text} />
        {badge ? <View style={styles.badge} /> : null}
      </View>
    </Pressy>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 22 },
  label: { fontFamily: font.display, letterSpacing: 0.2 },
  glass: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.glass,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  badge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.mango,
    borderWidth: 2,
    borderColor: colors.bg,
  },
});
