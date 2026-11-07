import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/state/motion';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Line, Text as SvgText } from 'react-native-svg';

import { duration, weekdayShort } from '@/lib/format';
import type { DailyRow } from '@/lib/types';
import { colors, font } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Catmull-Rom → cubic Bézier for a smooth line through all points. */
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

type Props = { data: DailyRow[]; width: number; height?: number; liveExtraToday?: number };

/** Smooth area chart (reference 1 "Performance"), with today's tooltip. */
export function WeekChart({ data, width, height = 170, liveExtraToday = 0 }: Props) {
  const reduce = useReducedMotion();
  const padL = 30;
  const padR = 14;
  const padT = 40;
  const padB = 26;
  const w = width - padL - padR;
  const h = height - padT - padB;

  const rows = useMemo(
    () => data.map((r, i) => ({ ...r, seconds: r.seconds + (i === data.length - 1 ? liveExtraToday : 0) })),
    [data, liveExtraToday],
  );
  const maxH = Math.max(1, Math.ceil(Math.max(...rows.map((r) => r.seconds), 3600) / 3600));
  const pts = rows.map((r, i) => ({
    x: padL + (rows.length === 1 ? w / 2 : (i / (rows.length - 1)) * w),
    y: padT + h - (r.seconds / (maxH * 3600)) * h,
  }));
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L${pts[pts.length - 1].x},${padT + h} L${pts[0].x},${padT + h} Z` : '';
  const last = pts[pts.length - 1];
  const lastRow = rows[rows.length - 1];

  const len = w * 1.8;
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    t.value = withTiming(1, { duration: reduce ? 0 : 1200, easing: Easing.out(Easing.cubic) });
  }, [data, t, reduce]);
  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - t.value) }));
  const areaProps = useAnimatedProps(() => ({ opacity: t.value }));

  const grid = [0, 0.5, 1].map((f) => ({ y: padT + h - f * h, label: `${Math.round(maxH * f * 10) / 10}h` }));
  const tipW = 92;
  const tipX = last ? Math.min(Math.max(last.x - tipW / 2, 4), width - tipW - 4) : 0;

  return (
    <View accessibilityLabel={`Wochenverlauf, heute ${duration(lastRow?.seconds ?? 0)}`}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="wl" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.magenta} />
            <Stop offset="1" stopColor={colors.cyan} />
          </LinearGradient>
          <LinearGradient id="wa" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.cyan} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.cyan} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {grid.map((g, i) => (
          <Line key={i} x1={padL} x2={width - padR} y1={g.y} y2={g.y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 5" />
        ))}
        {grid.map((g, i) => (
          <SvgText key={`l${i}`} x={4} y={g.y + 4} fill={colors.textMuted} fontSize={10} fontFamily={font.labelSemi}>
            {g.label}
          </SvgText>
        ))}
        <AnimatedPath d={area} fill="url(#wa)" animatedProps={areaProps} />
        <AnimatedPath
          d={line}
          stroke="url(#wl)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${len} ${len}`}
          animatedProps={lineProps}
        />
        {last ? (
          <>
            <Line x1={last.x} x2={last.x} y1={last.y} y2={padT + h} stroke="rgba(255,255,255,0.25)" strokeDasharray="2 4" />
            <Circle cx={last.x} cy={last.y} r={7} fill={colors.bg} stroke={colors.cyan} strokeWidth={3} />
            <Rect x={tipX} y={Math.max(2, last.y - 40)} width={tipW} height={26} rx={13} fill="#F4F6FF" />
            <SvgText
              x={tipX + tipW / 2}
              y={Math.max(2, last.y - 40) + 17}
              fill={colors.bg}
              fontSize={12}
              fontFamily={font.bodyBold}
              textAnchor="middle"
            >
              {duration(lastRow.seconds)}
            </SvgText>
          </>
        ) : null}
        {rows.map((r, i) => (
          <SvgText
            key={r.day}
            x={pts[i].x}
            y={height - 6}
            fill={i === rows.length - 1 ? colors.text : colors.textMuted}
            fontSize={11}
            fontFamily={i === rows.length - 1 ? font.label : font.labelSemi}
            textAnchor="middle"
          >
            {i === rows.length - 1 ? 'Heute' : weekdayShort(r.day)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
