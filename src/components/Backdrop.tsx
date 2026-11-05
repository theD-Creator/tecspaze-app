import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, gradients } from '@/theme/tokens';

type BlobProps = { color: string; size: number; x: number; y: number; dx: number; dy: number; duration: number };

function Blob({ color, size, x, y, dx, dy, duration }: BlobProps) {
  const t = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t, duration, reduce]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * dx }, { translateY: t.value * dy }, { scale: 1 + t.value * 0.12 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, opacity: 0.5 }, style]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={'b' + color.slice(1)} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.9} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={'url(#b' + color.slice(1) + ')'} />
      </Svg>
    </Animated.View>
  );
}

/** Slowly drifting brand-colored aurora behind every screen. */
export function Backdrop({ intensity = 1 }: { intensity?: number }) {
  const { width, height } = useWindowDimensions();
  const s = Math.max(width, 380);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={gradients.night} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
        <Blob color={colors.magenta} size={s * 1.1} x={-s * 0.45} y={-s * 0.55} dx={s * 0.12} dy={s * 0.08} duration={11000} />
        <Blob color={colors.cyan} size={s} x={s * 0.35} y={height * 0.25} dx={-s * 0.15} dy={s * 0.1} duration={13000} />
        <Blob color={colors.navy} size={s * 1.2} x={-s * 0.3} y={height * 0.6} dx={s * 0.1} dy={-s * 0.12} duration={15000} />
      </View>
      <LinearGradient
        colors={['rgba(6,10,28,0)', 'rgba(6,10,28,0.55)', colors.bg]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
