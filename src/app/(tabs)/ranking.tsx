import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { LeaderItem } from '@/components/LeaderItem';
import { LiveDot } from '@/components/LiveDot';
import { Podium } from '@/components/Podium';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { hours } from '@/lib/format';
import type { LeaderRow, Period } from '@/lib/types';
import { useAuth } from '@/state/auth';
import { useLeaderboard, useNow } from '@/state/data';
import { colors } from '@/theme/tokens';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Heute' },
  { value: 'week', label: 'Woche' },
  { value: 'month', label: 'Monat' },
  { value: 'all', label: 'Gesamt' },
];

const PERIOD_TEXT: Record<Period, string> = {
  day: 'heute',
  week: 'diese Woche',
  month: 'diesen Monat',
  all: 'insgesamt',
};

export default function Ranking() {
  const { session } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const lb = useLeaderboard(period, 100);
  const now = useNow(1000);
  const [refreshing, setRefreshing] = useState(false);

  // Present users keep ticking locally between server refreshes.
  const liveSeconds = useCallback(
    (r: LeaderRow) => r.total_seconds + (r.is_present ? Math.max(0, (now - lb.fetchedAt) / 1000) : 0),
    [now, lb.fetchedAt],
  );

  const rows = useMemo(() => {
    const list = [...(lb.data ?? [])].sort((a, b) => liveSeconds(b) - liveSeconds(a));
    // Equal time → equal rank (1, 2, 2, 4 …)
    const secs = list.map((r) => Math.floor(liveSeconds(r)));
    const ranks = secs.map((s) => secs.indexOf(s)); // list is sorted desc
    return list.map((r, i) => ({ ...r, rank: ranks[i] + 1 }));
  }, [lb.data, liveSeconds]);

  const me = rows.find((r) => r.user_id === session?.user.id);
  const present = rows.filter((r) => r.is_present).length;
  const leader = rows[0] ? liveSeconds(rows[0]) : 0;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await lb.reload();
        setRefreshing(false);
      }}
    >
      <Animated.View entering={FadeInDown.duration(500)} style={styles.head}>
        <View style={{ flex: 1 }}>
          <Txt variant="label">Rangliste</Txt>
          <Txt variant="title">Wer ist am meisten da?</Txt>
        </View>
        <View style={styles.livePill} accessibilityLabel={`${present} Personen gerade im Tecspaze`}>
          <LiveDot size={7} />
          <Txt variant="label" style={{ color: colors.mint }}>
            {present} live
          </Txt>
        </View>
      </Animated.View>

      <Segmented options={PERIODS} value={period} onChange={setPeriod} />

      {lb.loading && !lb.data ? (
        <View style={{ paddingVertical: 60 }}>
          <ActivityIndicator color={colors.cyan} />
        </View>
      ) : lb.error ? (
        <Glass>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
            <Txt style={{ textAlign: 'center' }}>Rangliste konnte nicht geladen werden.</Txt>
            <Button label="Nochmal versuchen" variant="glass" compact onPress={lb.reload} />
          </View>
        </Glass>
      ) : rows.length === 0 ? (
        <Animated.View entering={FadeIn}>
          <Glass>
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }}>
              <Txt style={{ fontSize: 44 }}>🏁</Txt>
              <Txt variant="h2">Noch alles offen!</Txt>
              <Txt style={{ textAlign: 'center' }}>
                {PERIOD_TEXT[period][0].toUpperCase() + PERIOD_TEXT[period].slice(1)} hat noch niemand Zeit gesammelt. Geh ins
                Tecspaze und hol dir Platz 1.
              </Txt>
            </View>
          </Glass>
        </Animated.View>
      ) : (
        <>
          <Glass padding={16} radiusSize={30}>
            <Podium key={period} rows={rows.slice(0, 3)} liveSeconds={liveSeconds} myId={session?.user.id} />
          </Glass>

          {me ? (
            <Animated.View entering={FadeInDown.springify()} style={styles.meCard}>
              <Txt variant="label" style={{ color: colors.mangoSoft }}>
                Dein Platz {PERIOD_TEXT[period]}
              </Txt>
              <View style={styles.meRow}>
                <Txt style={styles.meRank}>#{me.rank}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt variant="h3">{hours(liveSeconds(me))} gesammelt</Txt>
                  <Txt variant="small">
                    {me.rank === 1
                      ? 'Du führst! Halte die Krone 👑'
                      : `Noch ${hours(Math.max(0, liveSeconds(rows[me.rank - 2] ?? rows[0]) - liveSeconds(me)))} bis Platz ${me.rank - 1}`}
                  </Txt>
                </View>
              </View>
            </Animated.View>
          ) : null}

          <View style={{ gap: 10 }}>
            {rows.slice(3).map((r, i) => (
              <LeaderItem
                key={r.user_id}
                row={r}
                index={i}
                seconds={liveSeconds(r)}
                me={r.user_id === session?.user.id}
                leaderSeconds={leader}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(61,220,151,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(61,220,151,0.3)',
  },
  meCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(240,150,45,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(240,150,45,0.4)',
    gap: 8,
  },
  meRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  meRank: { fontFamily: 'Doto_900Black', fontSize: 34, color: colors.mangoSoft },
});
