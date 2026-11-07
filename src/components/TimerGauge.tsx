import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/state/motion';
import Svg, { Circle, Defs, Line, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { clock, duration } from '@/lib/format';
import { colors } from '@/theme/tokens';

import { LiveDot } from './LiveDot';
import { Txt } from './Txt';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function arcPath(c: number, r: number) {
  const a0 = (START * Math.PI) / 180;
  const a1 = ((START + SWEEP) * Math.PI) / 180;
  const x0 = c + Math.cos(a0) * r;
  const y0 = c + Math.sin(a0) * r;
  const x1 = c + Math.cos(a1) * r;
  const y1 = c + Math.sin(a1) * r;
  return `M${x0},${y0} A${r},${r} 0 1 1 ${x1},${y1}`;
}

const TICKS = 60;
const SWEEP = 270; // degrees
const START = 135; // degrees, measured clockwise from +x

function lerpColor(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function brandAt(t: number) {
  return t < 0.5 ? lerpColor(colors.magenta, colors.violet, t * 2) : lerpColor(colors.violet, colors.cyan, (t - 0.5) * 2);
}

type Props = {
  size: number;
  inside: boolean;
  /** seconds of the running session (if inside) */
  sessionSeconds: number;
  /** total seconds today */
  todaySeconds: number;
  goalSeconds: number;
  spaceName?: string | null;
  subtitle?: string;
};

/** Gauge-style live timer (reference 3), in brand colors. */
export function TimerGauge({ size, inside, sessionSeconds, todaySeconds, goalSeconds, spaceName, subtitle }: Props) {
  const reduce = useReducedMotion();
  const progress = Math.min(1, todaySeconds / Math.max(goalSeconds, 1));
  const c = size / 2;
  const rOuter = c - 6;
  const rInner = c - 34;
  const circumference = 2 * Math.PI * rInner;
  const arcLen = (SWEEP / 360) * circumference;

  const ticks = useMemo(() => {
    return Array.from({ length: TICKS + 1 }, (_, i) => {
      const t = i / TICKS;
      const a = ((START + t * SWEEP) * Math.PI) / 180;
      const major = i % 10 === 0;
      const len = major ? 16 : 10;
      return {
        t,
        major,
        x1: c + Math.cos(a) * rOuter,
        y1: c + Math.sin(a) * rOuter,
        x2: c + Math.cos(a) * (rOuter - len),
        y2: c + Math.sin(a) * (rOuter - len),
      };
    });
  }, [c, rOuter]);

  // Animated progress arc
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(progress, { duration: reduce ? 0 : 1400, easing: Easing.out(Easing.cubic) });
  }, [progress, p, reduce]);
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: arcLen * (1 - p.value),
  }));

  // Breathing glow while inside
  const glow = useSharedValue(0);
  useEffect(() => {
    if (inside && !reduce) {
      glow.value = withRepeat(withSequence(withTiming(1, { duration: 1800 }), withTiming(0.35, { duration: 1800 })), -1, false);
    } else {
      glow.value = withTiming(0, { duration: 600 });
    }
  }, [inside, glow, reduce]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glow.value * 0.55,
    transform: [{ scale: 0.92 + glow.value * 0.08 }],
  }));

  const main = inside ? clock(sessionSeconds) : clock(todaySeconds);

  return (
    <Animated.View entering={FadeIn.duration(700)} style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="gg" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={inside ? colors.cyan : colors.violet} stopOpacity={0.45} />
              <Stop offset="0.6" stopColor={colors.magenta} stopOpacity={0.12} />
              <Stop offset="1" stopColor={colors.bg} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={c} cy={c} r={c} fill="url(#gg)" />
        </Svg>
      </Animated.View>

      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="arc" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.magenta} />
            <Stop offset="0.5" stopColor={colors.violet} />
            <Stop offset="1" stopColor={colors.cyan} />
          </LinearGradient>
        </Defs>
        {ticks.map((tk, i) => {
          const on = tk.t <= progress && progress > 0;
          return (
            <Line
              key={i}
              x1={tk.x1}
              y1={tk.y1}
              x2={tk.x2}
              y2={tk.y2}
              stroke={on ? brandAt(tk.t) : 'rgba(255,255,255,0.16)'}
              strokeWidth={tk.major ? 3.2 : 2.2}
              strokeLinecap="round"
            />
          );
        })}
        <Path d={arcPath(c, rInner)} stroke="rgba(255,255,255,0.07)" strokeWidth={6} fill="none" strokeLinecap="round" />
        <AnimatedPath
          d={arcPath(c, rInner)}
          stroke="url(#arc)"
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${arcLen} ${arcLen}`}
          strokeLinecap="round"
          animatedProps={arcProps}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <View style={[styles.chip, inside ? styles.chipOn : null]}>
          {inside ? <LiveDot size={7} /> : <View style={styles.offDot} />}
          <Txt variant="label" style={{ color: inside ? colors.mint : colors.textMuted, letterSpacing: 1.1 }}>
            {inside ? `Im ${spaceName ?? 'Tecspaze'}` : 'Unterwegs'}
          </Txt>
        </View>
        <Txt
          variant="digits"
          style={{ fontSize: size * 0.128, lineHeight: size * 0.16, marginTop: 8 }}
          accessibilityLabel={`${inside ? 'Aktuelle Session' : 'Heute'} ${duration(inside ? sessionSeconds : todaySeconds)}`}
        >
          {main}
        </Txt>
        <Txt variant="small" style={{ marginTop: 2, color: colors.textSoft }}>
          {subtitle ?? (inside ? `Heute gesamt ${duration(todaySeconds)}` : 'Heute im Tecspaze')}
        </Txt>
        <Txt variant="small" style={{ marginTop: 10 }}>
          {Math.round(progress * 100)}% vom Tagesziel
        </Txt>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipOn: { backgroundColor: 'rgba(61,220,151,0.10)', borderColor: 'rgba(61,220,151,0.35)' },
  offDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textMuted },
});
