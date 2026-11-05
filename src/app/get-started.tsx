import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/Backdrop';
import { Button } from '@/components/Buttons';
import { Logo } from '@/components/Logo';
import { Txt } from '@/components/Txt';
import { colors, MAX_WIDTH } from '@/theme/tokens';

type Bubble = { icon: keyof typeof Ionicons.glyphMap; col: number; row: number; tint: readonly [string, string] };

// Diamond constellation of glass bubbles (reference 3, first screen).
const BUBBLES: Bubble[] = [
  { icon: 'time', col: 0, row: -2, tint: ['#C83278', '#2A0F3D'] },
  { icon: 'location', col: -1, row: -1, tint: ['#00BED2', '#0B2240'] },
  { icon: 'trophy', col: 1, row: -1, tint: ['#F0962D', '#3A1A08'] },
  { icon: 'people', col: -2, row: 0, tint: ['#9C8CFF', '#1A1540'] },
  { icon: 'flash', col: 0, row: 0, tint: ['#F4F6FF', '#3B3F6B'] },
  { icon: 'chatbubbles', col: 2, row: 0, tint: ['#C83278', '#2A0F3D'] },
  { icon: 'stats-chart', col: -1, row: 1, tint: ['#3DDC97', '#0A2A26'] },
  { icon: 'star', col: 1, row: 1, tint: ['#FFC94A', '#3A2A08'] },
  { icon: 'rocket', col: 0, row: 2, tint: ['#00BED2', '#0B2240'] },
];

function FloatingBubble({ b, i, gap, size }: { b: Bubble; i: number; gap: number; size: number }) {
  const t = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!reduce)
      t.value = withDelay(
        i * 180,
        withRepeat(withTiming(1, { duration: 2600 + i * 120, easing: Easing.inOut(Easing.sin) }), -1, true),
      );
  }, [t, i, reduce]);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: -6 + t.value * 12 }] }));
  const center = b.col === 0 && b.row === 0;
  const s = center ? size * 1.12 : size;
  return (
    <Animated.View
      entering={ZoomIn.delay(250 + i * 70)
        .springify()
        .damping(12)}
      style={{ position: 'absolute', left: b.col * gap - s / 2, top: b.row * gap - s / 2 }}
    >
      <Animated.View style={float}>
        <View style={[styles.bubble, { width: s, height: s, borderRadius: s / 2 }]}>
          <LinearGradient
            colors={[`${b.tint[0]}55`, b.tint[1]]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.shine} />
          <Ionicons name={b.icon} size={s * 0.4} color={center ? colors.mangoSoft : colors.text} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function Welcome() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const size = Math.min(64, width * 0.15);
  const gap = size * 1.12;
  return (
    <View style={styles.root}>
      <Backdrop intensity={1.2} />
      <View style={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.top}>
          <Logo kind="wordmark" width={128} />
          <View style={styles.progress}>
            <LinearGradient
              colors={['#fff', 'rgba(255,255,255,0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: '38%', height: 3, borderRadius: 2 }}
            />
          </View>
        </Animated.View>

        <View style={[styles.constellation, { height: Math.min(height * 0.42, gap * 5.2) }]}>
          <View style={{ width: 0, height: 0 }}>
            {BUBBLES.map((b, i) => (
              <FloatingBubble key={b.icon + i} b={b} i={i} gap={gap} size={size} />
            ))}
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <Animated.View entering={FadeInUp.delay(500).duration(700)}>
            <Txt variant="hero" style={{ textAlign: 'center' }}>
              Deine Zeit im Tecspaze.{'\n'}
              <Txt variant="editorial" style={{ fontSize: 32, color: colors.mangoSoft }}>
                Ganz automatisch.
              </Txt>
            </Txt>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(650).duration(700)}>
            <Txt style={{ textAlign: 'center' }}>
              Betritt das Tecspaze – der Timer startet von selbst.{' '}
              <Txt style={{ color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>Sammle Stunden</Txt> und klettere in der
              Rangliste nach oben.
            </Txt>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(800).duration(700)} style={{ marginTop: 14, gap: 12 }}>
            <Button label="Los geht's" icon="arrow-forward" onPress={() => router.push('/login')} />
            <Button
              label="Ich habe schon ein Konto"
              variant="glass"
              onPress={() => router.push({ pathname: '/login', params: { mode: 'login' } })}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  top: { alignItems: 'center', gap: 18 },
  progress: { width: '100%', height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  constellation: { alignItems: 'center', justifyContent: 'center' },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(20,26,60,0.8)',
  },
  shine: {
    position: 'absolute',
    top: 4,
    left: '22%',
    width: '56%',
    height: '30%',
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
