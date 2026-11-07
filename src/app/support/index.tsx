import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, IconButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Pressy } from '@/components/Pressy';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { relativeTime } from '@/lib/format';
import { useMyThreads } from '@/state/support';
import { colors, font, radius } from '@/theme/tokens';

export default function SupportList() {
  const threads = useMyThreads();
  const [refreshing, setRefreshing] = useState(false);
  const reloadThreads = threads.reload;
  useFocusEffect(
    useCallback(() => {
      reloadThreads();
    }, [reloadThreads]),
  );
  const list = threads.data ?? [];

  return (
    <Screen
      tabs={false}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await threads.reload();
        setRefreshing(false);
      }}
    >
      <View style={styles.top}>
        <IconButton
          icon="chevron-back"
          label="Zurück"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        />
        <Txt variant="label">Support</Txt>
        <View style={{ width: 46 }} />
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 6 }}>
        <Txt variant="title">Hilfe & Chat</Txt>
        <Txt variant="small">Schreib dem Team direkt. Antworten zu deinen Bugs und Ideen landen auch hier.</Txt>
      </Animated.View>

      <Button
        label="Neue Nachricht ans Team"
        icon="chatbubble-ellipses"
        variant="mango"
        onPress={() => router.push({ pathname: '/support/[id]', params: { id: 'new' } })}
      />

      {threads.loading && !threads.data ? (
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 30 }} />
      ) : threads.error ? (
        <Glass>
          <Txt style={{ textAlign: 'center' }}>Chats konnten nicht geladen werden.</Txt>
          <View style={{ marginTop: 12 }}>
            <Button label="Nochmal versuchen" variant="glass" compact onPress={threads.reload} />
          </View>
        </Glass>
      ) : list.length === 0 ? (
        <Txt variant="small" style={{ textAlign: 'center', marginTop: 10 }}>
          Noch keine Chats.
        </Txt>
      ) : (
        <View style={{ gap: 10 }}>
          {list.map((t, i) => (
            <Animated.View key={t.id} entering={FadeInDown.delay(Math.min(i, 8) * 45)}>
              <Pressy
                onPress={() => router.push({ pathname: '/support/[id]', params: { id: t.id } })}
                scaleTo={0.98}
                accessibilityLabel={`${t.subject}${t.unread ? `, ${t.unread} neu` : ''}`}
              >
                <View style={[styles.row, t.unread > 0 && styles.rowUnread]}>
                  <View style={[styles.icon, t.feedback_id ? styles.iconFeedback : null]}>
                    <Ionicons
                      name={t.feedback_id ? 'bulb' : 'headset'}
                      size={18}
                      color={t.feedback_id ? colors.mango : colors.cyan}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Txt numberOfLines={1} style={styles.subject}>
                        {t.subject}
                      </Txt>
                      <Txt variant="small">{relativeTime(t.last_message_at)}</Txt>
                    </View>
                    <Txt variant="small" numberOfLines={2} style={t.unread > 0 ? { color: colors.text } : null}>
                      {t.last_from_team ? 'Team: ' : 'Du: '}
                      {t.last_body ?? ''}
                    </Txt>
                  </View>
                  {t.unread > 0 ? (
                    <View style={styles.badge}>
                      <Txt style={styles.badgeText}>{t.unread}</Txt>
                    </View>
                  ) : t.status === 'closed' ? (
                    <Ionicons name="checkmark-done" size={18} color={colors.mint} />
                  ) : null}
                </View>
              </Pressy>
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  rowUnread: { borderColor: 'rgba(240,150,45,0.55)', backgroundColor: 'rgba(240,150,45,0.08)' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,190,210,0.14)',
  },
  iconFeedback: { backgroundColor: 'rgba(240,150,45,0.14)' },
  subject: { flex: 1, fontFamily: font.display, fontSize: 15, color: colors.text },
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
});
