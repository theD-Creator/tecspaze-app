import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, font } from '@/theme/tokens';

import { Backdrop } from './Backdrop';
import { Logo } from './Logo';

function Ring({ delay, color }: { delay: number; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - t.value) * 0.9,
    transform: [{ scale: 0.3 + t.value * 2.4 }],
  }));
  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

/** Launch animation: signet pops in, brand rings ripple out, wordmark rises. Tap to skip. */
export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const signet = useSharedValue(0);
  const word = useSharedValue(0);
  const out = useSharedValue(1);

  useEffect(() => {
    if (reduce) {
      onDone();
      return;
    }
    signet.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.6)) });
    word.value = withDelay(650, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    out.value = withDelay(
      2100,
      withSequence(
        withTiming(0, { duration: 450 }, (fin) => {
          if (fin) runOnJS(onDone)();
        }),
      ),
    );
  }, [reduce, onDone, signet, word, out]);

  const signetStyle = useAnimatedStyle(() => ({
    opacity: signet.value,
    transform: [{ scale: 0.4 + signet.value * 0.6 }, { rotate: `${(1 - signet.value) * -40}deg` }],
  }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: (1 - word.value) * 18 }] }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: out.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDone} accessibilityLabel="Intro überspringen">
        <Backdrop />
        <View style={styles.center}>
          <View style={styles.mark}>
            <Ring delay={200} color={colors.magenta} />
            <Ring delay={450} color={colors.violet} />
            <Ring delay={700} color={colors.cyan} />
            <Animated.View style={signetStyle}>
              <Logo kind="signet" width={96} />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.tag, wordStyle]}>tecspaze</Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 1000, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tag: { marginTop: 30, fontFamily: font.label, fontSize: 30, letterSpacing: 6, color: colors.text },
  mark: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 2 },
});
