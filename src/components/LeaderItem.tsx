import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { hours, ROLE_LABEL } from '@/lib/format';
import type { LeaderRow } from '@/lib/types';
import { colors, font, radius } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { LiveDot } from './LiveDot';

type Props = { row: LeaderRow; seconds: number; me: boolean; index: number; leaderSeconds: number };

export const LeaderItem = memo(function LeaderItem({ row, seconds, me, index, leaderSeconds }: Props) {
  const pct = leaderSeconds > 0 ? Math.max(0.04, seconds / leaderSeconds) : 0;
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 12) * 45)
        .springify()
        .damping(16)}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.row, me && styles.me]}
      accessibilityLabel={`Platz ${row.rank}, ${row.display_name ?? 'Unbekannt'}, ${hours(seconds)}${row.is_present ? ', gerade im Tecspaze' : ''}`}
    >
      <Text style={[styles.rank, me && { color: colors.mangoSoft }]}>{row.rank}</Text>
      <Avatar name={row.display_name} photo={row.photo} id={row.user_id} size={42} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {row.display_name ?? 'Unbekannt'}
            {me ? <Text style={{ color: colors.mangoSoft }}> · Du</Text> : null}
          </Text>
          {row.is_present ? (
            <View style={styles.live}>
              <LiveDot size={6} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: me ? colors.mango : colors.cyan }]} />
        </View>
        {row.role !== 'user' ? <Text style={styles.role}>{ROLE_LABEL[row.role] ?? row.role}</Text> : null}
      </View>
      <Text style={styles.time}>{hours(seconds)}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingRight: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  me: { borderColor: 'rgba(240,150,45,0.55)', backgroundColor: 'rgba(240,150,45,0.08)' },
  rank: { width: 26, textAlign: 'center', fontFamily: font.digits, fontSize: 18, color: colors.textSoft },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: font.display, fontSize: 15, color: colors.text },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: 'rgba(61,220,151,0.12)',
  },
  liveText: { fontFamily: font.label, fontSize: 9.5, letterSpacing: 1, color: colors.mint },
  track: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
  role: { fontFamily: font.labelSemi, fontSize: 11, color: colors.textMuted },
  time: { fontFamily: font.digitsBold, fontSize: 16, color: colors.text },
});
