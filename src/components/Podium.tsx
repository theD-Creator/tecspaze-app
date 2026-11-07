import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { useReducedMotion } from '@/state/motion';

import { hours } from '@/lib/format';
import type { LeaderRow } from '@/lib/types';
import { colors, font, radius } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { LiveDot } from './LiveDot';

const MEDAL = {
  1: { ring: [colors.gold, colors.mango] as const, height: 118, color: colors.gold },
  2: { ring: [colors.silver, '#8EA2C8'] as const, height: 86, color: colors.silver },
  3: { ring: [colors.bronze, '#A85A2F'] as const, height: 66, color: colors.bronze },
};

function Column({ row, place, live, me }: { row?: LeaderRow; place: 1 | 2 | 3; live: number; me: boolean }) {
  const m = MEDAL[place];
  const reduce = useReducedMotion();
  const h = useSharedValue(reduce ? m.height : 0);
  useEffect(() => {
    h.value = withDelay(place === 1 ? 250 : place === 2 ? 100 : 400, withSpring(m.height, { damping: 14, stiffness: 120 }));
  }, [h, m.height, place]);
  const bar = useAnimatedStyle(() => ({ height: h.value }));
  const size = place === 1 ? 76 : 60;
  return (
    <Animated.View
      entering={FadeInDown.delay(place * 120)
        .springify()
        .damping(14)}
      style={styles.col}
      accessibilityLabel={row ? `Platz ${place}: ${row.display_name}, ${hours(live)}` : `Platz ${place} frei`}
    >
      {place === 1 ? <MaterialCommunityIcons name="crown" size={28} color={colors.gold} style={{ marginBottom: 2 }} /> : null}
      <View>
        <Avatar name={row?.display_name ?? '–'} photo={row?.photo} id={row?.user_id} size={size} ring={m.ring} />
        {row?.is_present ? (
          <View style={styles.live}>
            <LiveDot size={8} />
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={[styles.name, me && { color: colors.mangoSoft }]}>
        {row?.display_name ?? '—'}
      </Text>
      <Text style={styles.time}>{row ? hours(live) : ''}</Text>
      <Animated.View style={[styles.bar, bar]}>
        <LinearGradient
          colors={[`${m.color}55`, `${m.color}08`]}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md }]}
        />
        <Text style={[styles.place, { color: m.color }]}>{place}</Text>
      </Animated.View>
    </Animated.View>
  );
}

/** Animated top-3 podium. `liveSeconds` adds locally ticking time to present users. */
export function Podium({ rows, liveSeconds, myId }: { rows: LeaderRow[]; liveSeconds: (r: LeaderRow) => number; myId?: string }) {
  const [a, b, c] = rows;
  return (
    <View style={styles.wrap}>
      <Column row={b} place={2} live={b ? liveSeconds(b) : 0} me={b?.user_id === myId} />
      <Column row={a} place={1} live={a ? liveSeconds(a) : 0} me={a?.user_id === myId} />
      <Column row={c} place={3} live={c ? liveSeconds(c) : 0} me={c?.user_id === myId} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 8 },
  col: { flex: 1, alignItems: 'center' },
  name: { fontFamily: font.display, color: colors.text, fontSize: 14, marginTop: 8, maxWidth: '100%' },
  time: { fontFamily: font.digitsBold, color: colors.textSoft, fontSize: 13, marginTop: 2, marginBottom: 8 },
  bar: {
    width: '100%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    paddingTop: 8,
    overflow: 'hidden',
  },
  place: { fontFamily: font.digits, fontSize: 30 },
  live: { position: 'absolute', right: 2, bottom: 4, padding: 3, borderRadius: 10, backgroundColor: colors.bg },
});
