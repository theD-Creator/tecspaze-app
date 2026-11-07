import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, IconButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Pressy } from '@/components/Pressy';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { relativeTime } from '@/lib/format';
import { markInboxSeen, routeForNotification } from '@/lib/notify';
import { NOTIFICATION_ICON } from '@/lib/support';
import { supabase } from '@/lib/supabase';
import { useInbox } from '@/state/inbox';
import { colors, font, radius } from '@/theme/tokens';

function PushHint() {
  const inbox = useInbox();
  if (Platform.OS === 'web' || inbox.push === null || inbox.push === 'push' || inbox.push === 'local') return null;
  const denied = inbox.push === 'denied';
  return (
    <Glass padding={16}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Ionicons name="notifications-off-outline" size={22} color={colors.mango} />
        <Txt style={{ flex: 1, fontSize: 14 }}>
          {denied
            ? 'Mitteilungen sind aus. Erlaube sie, damit du Antworten vom Team und Updates sofort bekommst.'
            : 'Für Mitteilungen auf dem Sperrbildschirm brauchst du die neueste App-Version (APK).'}
        </Txt>
      </View>
      {denied ? (
        <View style={{ marginTop: 12 }}>
          <Button
            label="Mitteilungen erlauben"
            variant="glass"
            compact
            onPress={async () => {
              const s = await inbox.enablePush();
              if (s === 'denied') Linking.openSettings().catch(() => null);
            }}
          />
        </View>
      ) : null}
    </Glass>
  );
}

export default function Notifications() {
  const inbox = useInbox();
  const [refreshing, setRefreshing] = useState(false);
  const reloadInbox = inbox.reload;
  useFocusEffect(
    useCallback(() => {
      reloadInbox();
      void markInboxSeen();
    }, [reloadInbox]),
  );

  return (
    <Screen
      tabs={false}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await inbox.reload();
        setRefreshing(false);
      }}
    >
      <View style={styles.top}>
        <IconButton
          icon="chevron-back"
          label="Zurück"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <Txt variant="label">Mitteilungen</Txt>
        <View style={{ width: 46 }} />
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.head}>
        <Txt variant="title" style={{ flex: 1 }}>
          Neuigkeiten
        </Txt>
        {inbox.unread > 0 ? (
          <Pressy onPress={inbox.markAllRead} accessibilityLabel="Alle als gelesen markieren" scaleTo={0.94}>
            <Txt style={styles.markAll}>Alle gelesen</Txt>
          </Pressy>
        ) : null}
      </Animated.View>

      <PushHint />

      <Pressy onPress={() => router.push('/support')} accessibilityLabel="Support-Chat öffnen" scaleTo={0.98}>
        <Glass padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.supportIcon}>
              <Ionicons name="headset" size={18} color="#2A1300" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="h3">Support-Chat</Txt>
              <Txt variant="small">
                {inbox.supportUnread > 0 ? `${inbox.supportUnread} neue Antwort${inbox.supportUnread === 1 ? '' : 'en'}` : 'Schreib dem Team'}
              </Txt>
            </View>
            {inbox.supportUnread > 0 ? (
              <View style={styles.badge}>
                <Txt style={styles.badgeText}>{inbox.supportUnread}</Txt>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Glass>
      </Pressy>

      {inbox.items.length === 0 ? (
        <Txt variant="small" style={{ textAlign: 'center', marginTop: 16 }}>
          Noch keine Mitteilungen. Hier landen Antworten vom Team und App-Updates.
        </Txt>
      ) : (
        <View style={{ gap: 10 }}>
          {inbox.items.map((n, i) => {
            const meta = NOTIFICATION_ICON[n.kind] ?? NOTIFICATION_ICON.info;
            const to = routeForNotification({ ...n.data, kind: n.kind });
            return (
              <Animated.View key={n.id} entering={FadeInDown.delay(Math.min(i, 10) * 40)}>
                <Pressy
                  scaleTo={0.98}
                  accessibilityLabel={`${n.title}. ${n.body}`}
                  onPress={() => {
                    if (!n.read_at) void supabase.rpc('notifications_mark_read', { p_ids: [n.id] });
                    if (to && to !== '/notifications') router.push(to as never);
                  }}
                >
                  <View style={[styles.item, !n.read_at && styles.unread]}>
                    <View style={[styles.itemIcon, { backgroundColor: `${meta.color}26` }]}>
                      <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={18} color={meta.color} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <Txt style={styles.itemTitle} numberOfLines={1}>
                          {n.title}
                        </Txt>
                        <Txt variant="small">{relativeTime(n.created_at)}</Txt>
                      </View>
                      {n.body ? (
                        <Txt variant="small" style={{ color: colors.textSoft }}>
                          {n.body}
                        </Txt>
                      ) : null}
                    </View>
                    {!n.read_at ? <View style={styles.dot} /> : null}
                  </View>
                </Pressy>
              </Animated.View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markAll: { fontFamily: font.label, fontSize: 13, color: colors.mangoSoft, padding: 6 },
  supportIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: font.displayBold, fontSize: 12, color: '#2A1300' },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  unread: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: colors.glassBorderStrong },
  itemIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { flex: 1, fontFamily: font.display, fontSize: 15, color: colors.text },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.mango, marginTop: 6 },
});
