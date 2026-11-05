import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients, radius } from '@/theme/tokens';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  /** stronger fill for nested emphasis */
  strong?: boolean;
  /** use real blur (more expensive – use for floating chrome only) */
  blur?: boolean;
  radiusSize?: number;
};

/** Frosted glass surface (references 2 & 3). */
export function Glass({ children, style, padding = 18, strong, blur, radiusSize = radius.lg }: Props) {
  return (
    <View
      style={[
        styles.base,
        { borderRadius: radiusSize, borderColor: strong ? colors.glassBorderStrong : colors.glassBorder },
        style,
      ]}
    >
      {blur && Platform.OS !== 'android' ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /> : null}
      <LinearGradient
        colors={strong ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)'] : gradients.glass}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(12,18,48,0.55)',
  },
});
