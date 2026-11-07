import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ActionTile } from '@/components/ActionTile';
import { ApkDownload } from '@/components/ApkDownload';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { LiveDot } from '@/components/LiveDot';
import { Pressy } from '@/components/Pressy';
import { Screen } from '@/components/Screen';
import { TimerGauge } from '@/components/TimerGauge';
import { Txt } from '@/components/Txt';
import { WeekChart } from '@/components/WeekChart';
import { distanceLabel, duration, greeting, hours } from '@/lib/format';
import { useAuth } from '@/state/auth';
import { useInbox } from '@/state/inbox';
import { useLeaderboard, useMyDaily, useMyStats, useNow } from '@/state/data';
import { usePresence } from '@/state/presence';
import { colors, MAX_WIDTH } from '@/theme/tokens';

// daily goal: 90 minutes in the Tecspaze
const DAILY_GOAL = 90 * 60;

function TrackingHint() {
  const { enabled, permission, viewer } = usePresence();
  if (viewer) {
    return (
      <View style={styles.hint}>
        <View style={styles.hintIcon}>
          <Ionicons name="phone-portrait-outline" size={18} color="#2A1300" />
        </View>
        <Txt style={{ flex: 1, color: colors.text, fontSize: 14 }}>
          Am Computer wird keine Zeit erfasst – das macht dein Handy. Hier siehst du alles live.
        </Txt>
      </View>
    );
  }
  let text: string | null = null;
  if (!enabled) text = 'Auto-Tracking ist pausiert. Tippe hier, um es wieder einzuschalten.';
  else if (permission === 'undetermined' || permission === 'denied')
    text = 'Erlaube den Standort, damit dein Timer im Tecspaze automatisch startet.';
  else if (permission === 'foreground') text = 'Tipp: Mit „Immer erlauben“ läuft der Timer auch, wenn die App zu ist.';
  if (!text) return null;
  return (
    <Animated.View entering={FadeInDown.springify()}>
      <Pressy onPress={() => router.push('/tracking')} accessibilityLabel={text}>
        <View style={styles.hint}>
          <View style={styles.hintIcon}>
            <Ionicons name="navigate" size={18} color="#2A1300" />
          </View>
          <Txt style={{ flex: 1, color: colors.text, fontSize: 14 }}>{text}</Txt>
          <Ionicons name="chevron-forward" size={18} color={colors.textSoft} />
        </View>
      </Pressy>
    </Animated.View>
  );
}

export default function Home() {
  const { width } = useWindowDimensions();
  const { profile, session } = useAuth();
  const presence = usePresence();
  const inbox = useInbox();
  const stats = useMyStats();
  const daily = useMyDaily(7);
  const today = useLeaderboard('day', 50);
  const week = useLeaderboard('week', 50);
  const now = useNow(1000);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await presence.refresh();
    await Promise.all([stats.reload(), daily.reload(), today.reload(), week.reload()]);
    setRefreshing(false);
  }, [presence, stats, daily, today, week]);

  const content = Math.min(width, MAX_WIDTH + 40) - 40;
  const gaugeSize = Math.min(content - 24, 310);
  const live = presence.inside ? Math.max(0, (now - stats.fetchedAt) / 1000) : 0;
  const todaySecs = (stats.data?.day ?? 0) + live;
  const liveDaily = presence.inside ? Math.max(0, (now - daily.fetchedAt) / 1000) : 0;
  const weekLive = (r: { total_seconds: number; is_present: boolean }) =>
    r.total_seconds + (r.is_present ? Math.max(0, (now - week.fetchedAt) / 1000) : 0);
  const sessionSecs = presence.sessionStart ? Math.max(0, (now - presence.sessionStart) / 1000) : 0;
  const myRank = week.data?.find((r) => r.user_id === session?.user.id)?.rank;
  const hereNow = (today.data ?? []).filter((r) => r.is_present);
  const firstName = (profile?.display_name ?? 'du').split(' ')[0];
  const weekTotal = (daily.data ?? []).reduce((a, r) => a + r.seconds, 0) + liveDaily;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Pressy onPress={() => router.push('/profile')} accessibilityLabel="Profil öffnen">
          <Avatar
            name={profile?.display_name ?? null}
            photo={profile?.photo}
            id={profile?.id}
            size={52}
            ring={[colors.mango, colors.magenta]}
          />
        </Pressy>
        <View style={{ flex: 1 }}>
          <Txt variant="small" style={{ color: colors.textSoft }}>
            Hey {firstName} 👋
          </Txt>
          <Txt variant="editorial" numberOfLines={1} style={{ fontSize: 27, lineHeight: 33 }}>
            {greeting()}
          </Txt>
        </View>
        <IconButton
          icon="notifications-outline"
          label={`Mitteilungen${inbox.unread + inbox.supportUnread > 0 ? `, ${inbox.unread + inbox.supportUnread} neu` : ''}`}
          onPress={() => router.push('/notifications')}
          badge={inbox.unread + inbox.supportUnread > 0}
        />
      </Animated.View>

      <TrackingHint />
      <ApkDownload app="tecspaze" onlyIfNewer />

      <Animated.View entering={FadeInDown.delay(80).duration(600)}>
        <Glass padding={0} radiusSize={32} strong>
          <View style={{ alignItems: 'center', paddingTop: 22, paddingBottom: 8 }}>
            <TimerGauge
              size={gaugeSize}
              inside={presence.inside}
              sessionSeconds={sessionSecs}
              todaySeconds={todaySecs}
              goalSeconds={DAILY_GOAL}
              spaceName={presence.ping?.space_name}
            />
          </View>
          <View style={styles.statRow}>
            {[
              { k: 'Woche', v: hours((stats.data?.week ?? 0) + live) },
              { k: 'Monat', v: hours((stats.data?.month ?? 0) + live) },
              { k: 'Streak', v: `${stats.data?.streak ?? 0} 🔥` },
            ].map((s, i) => (
              <View key={s.k} style={[styles.stat, i > 0 && styles.statDivider]}>
                <Txt variant="label">{s.k}</Txt>
                <Txt variant="h2" style={{ fontFamily: 'Doto_900Black', fontSize: 21 }}>
                  {s.v}
                </Txt>
              </View>
            ))}
          </View>
          {!presence.inside && presence.ping && presence.ping.distance_m >= 0 ? (
            <Txt variant="small" style={{ textAlign: 'center', paddingBottom: 16, marginTop: -4 }}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} /> {distanceLabel(presence.ping.distance_m)}{' '}
              bis zum {presence.ping.space_name ?? 'Tecspaze'}
            </Txt>
          ) : null}
        </Glass>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.tiles}>
        <ActionTile
          icon="trophy"
          tone="mango"
          label="Rangliste"
          value={myRank ? `#${myRank}` : '–'}
          onPress={() => router.push('/ranking')}
        />
        <ActionTile icon="chatbubbles" tone="magenta" label="Community" value="News" onPress={() => router.push('/community')} />
        <ActionTile
          icon="stats-chart"
          tone="cyan"
          label="Gesamt"
          value={hours((stats.data?.all ?? 0) + live)}
          onPress={() => router.push('/profile')}
        />
        <ActionTile
          icon={presence.viewer ? 'radio' : presence.enabled ? 'locate' : 'pause'}
          tone="lilac"
          label={presence.viewer ? 'Status' : presence.enabled ? 'Check-in' : 'Pausiert'}
          value={presence.inside ? 'Drin' : presence.viewer ? 'Nicht da' : 'Prüfen'}
          onPress={() => (presence.enabled ? presence.refresh() : router.push('/tracking'))}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(600)}>
        <Glass padding={18}>
          <View style={styles.cardHead}>
            <View>
              <Txt variant="h2">Deine Woche</Txt>
              <Txt variant="small">{duration(weekTotal)} in den letzten 7 Tagen</Txt>
            </View>
            <View style={styles.pill}>
              <Txt variant="label" style={{ color: colors.text }}>
                7 Tage
              </Txt>
            </View>
          </View>
          {daily.data ? (
            <WeekChart data={daily.data} width={content - 36} liveExtraToday={liveDaily} />
          ) : (
            <View style={{ height: 170 }} />
          )}
        </Glass>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(320).duration(600)}>
        <Glass padding={18}>
          <View style={styles.cardHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LiveDot />
              <Txt variant="h2">Gerade im Tecspaze</Txt>
            </View>
            <Txt variant="h3" style={{ color: colors.textSoft }}>
              {hereNow.length}
            </Txt>
          </View>
          {hereNow.length === 0 ? (
            <Txt variant="small">Noch niemand da – sei die erste Person heute! 🚀</Txt>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {hereNow.map((r) => (
                <View key={r.user_id} style={{ alignItems: 'center', width: 62, gap: 6 }}>
                  <Avatar name={r.display_name} photo={r.photo} id={r.user_id} size={52} ring={[colors.mint, colors.cyan]} />
                  <Txt variant="small" numberOfLines={1} style={{ color: colors.text }}>
                    {(r.display_name ?? '?').split(' ')[0]}
                  </Txt>
                </View>
              ))}
            </ScrollView>
          )}
        </Glass>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(600)}>
        <Pressy onPress={() => router.push('/ranking')} scaleTo={0.98} accessibilityLabel="Zur Rangliste">
          <Glass padding={18}>
            <View style={styles.cardHead}>
              <Txt variant="h2">Top diese Woche</Txt>
              <Ionicons name="arrow-forward" size={20} color={colors.textSoft} />
            </View>
            <View style={{ gap: 12 }}>
              {(week.data ?? []).slice(0, 3).map((r, i) => (
                <View key={r.user_id} style={styles.topRow}>
                  <Txt
                    style={{
                      fontFamily: 'Doto_900Black',
                      fontSize: 18,
                      width: 22,
                      color: [colors.gold, colors.silver, colors.bronze][i],
                    }}
                  >
                    {r.rank}
                  </Txt>
                  <Avatar name={r.display_name} photo={r.photo} id={r.user_id} size={36} />
                  <Txt variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                    {r.display_name}
                  </Txt>
                  <Txt style={{ fontFamily: 'Doto_900Black', color: colors.text }}>{hours(weekLive(r))}</Txt>
                </View>
              ))}
              {week.data && week.data.length === 0 ? (
                <Txt variant="small">Diese Woche hat noch niemand Zeit gesammelt.</Txt>
              ) : null}
            </View>
          </Glass>
        </Pressy>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(240,150,45,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240,150,45,0.4)',
  },
  hintIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.glassBorder, marginTop: 6, marginBottom: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
  statDivider: { borderLeftWidth: 1, borderColor: colors.glassBorder },
  tiles: { flexDirection: 'row', gap: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.08)' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
