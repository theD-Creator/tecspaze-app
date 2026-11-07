import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/state/motion';

import { colors } from '@/theme/tokens';

/** Pulsing presence indicator. */
export function LiveDot({ color = colors.mint, size = 9 }: { color?: string; size?: number }) {
  const t = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!reduce) t.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [t, reduce]);
  const halo = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - t.value), transform: [{ scale: 1 + t.value * 1.6 }] }));
  return (
    <View style={{ width: size, height: size }} accessibilityLabel="live">
      <Animated.View
        style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color }, halo]}
      />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}
