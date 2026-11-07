import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Button, IconButton } from '@/components/Buttons';
import { FeedbackCard } from '@/components/FeedbackCard';
import { Glass } from '@/components/Glass';
import { Pressy } from '@/components/Pressy';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { KIND_META, type Feedback, type FeedbackKind, type FeedbackSort } from '@/lib/feedback';
import { useAuth } from '@/state/auth';
import { useNow } from '@/state/data';
import { deleteFeedback, useFeedback } from '@/state/feedback';
import { colors, font, gradients } from '@/theme/tokens';

const confirmDelete = (title: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(window.confirm(`„${title}“ löschen?`))
    : new Promise<boolean>((resolve) =>
        Alert.alert('Eintrag löschen?', `„${title}“ wird entfernt.`, [
          { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Löschen', style: 'destructive', onPress: () => resolve(true) },
        ]),
      );

export default function FeedbackScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<FeedbackKind>(params.kind === 'bug' ? 'bug' : 'feature');
  const [sort, setSort] = useState<FeedbackSort>('top');
  const { session } = useAuth();
  const feed = useFeedback(kind, sort);
  const now = useNow(60_000);
  const [refreshing, setRefreshing] = useState(false);

  // a new entry was just created on the form screen → refresh on return
  const reload = feed.reload;
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const onDelete = useCallback(
    async (f: Feedback) => {
      if (!(await confirmDelete(f.title))) return;
      const err = await deleteFeedback(f.id);
      if (!err) reload();
    },
    [reload],
  );

  const meta = KIND_META[kind];

  return (
    <View style={{ flex: 1 }}>
      <Screen
        tabs={false}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await feed.reload();
          setRefreshing(false);
        }}
      >
        <View style={styles.top}>
          <IconButton
            icon="chevron-back"
            label="Zurück"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
          />
          <Txt variant="label">Feedback</Txt>
          <View style={{ width: 46 }} />
        </View>

        <Animated.View entering={FadeInDown.duration(450)}>
          <Txt variant="title">Ideen & Bugs</Txt>
          <Txt variant="small" style={{ marginTop: 4 }}>
            Stimm für das ab, was dir wichtig ist – die beliebtesten Ideen bauen wir zuerst.
          </Txt>
        </Animated.View>

        <Segmented
          options={[
            { value: 'feature', label: '💡 Features' },
            { value: 'bug', label: '🐞 Bugs' },
          ]}
          value={kind}
          onChange={setKind}
        />

        <View style={styles.sortRow}>
          {(['top', 'new'] as const).map((s) => (
            <Pressy
              key={s}
              onPress={() => setSort(s)}
              style={[styles.sort, sort === s && styles.sortOn]}
              scaleTo={0.94}
              accessibilityState={{ selected: sort === s }}
              accessibilityLabel={s === 'top' ? 'Nach Stimmen sortieren' : 'Neueste zuerst'}
            >
              <Ionicons name={s === 'top' ? 'flame' : 'time'} size={14} color={sort === s ? '#2A1300' : colors.textSoft} />
              <Txt style={[styles.sortText, sort === s && { color: '#2A1300' }]}>{s === 'top' ? 'Top' : 'Neu'}</Txt>
            </Pressy>
          ))}
        </View>

        {feed.loading && !feed.data ? (
          <ActivityIndicator color={colors.cyan} style={{ marginTop: 30 }} />
        ) : feed.error ? (
          <Glass>
            <Txt style={{ textAlign: 'center' }}>Konnte nicht geladen werden.</Txt>
            <View style={{ marginTop: 12 }}>
              <Button label="Nochmal versuchen" variant="glass" compact onPress={feed.reload} />
            </View>
          </Glass>
        ) : feed.list.length === 0 ? (
          <Glass>
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 16 }}>
              <Txt style={{ fontSize: 42 }}>{kind === 'bug' ? '🐞' : '💡'}</Txt>
              <Txt variant="h2">{kind === 'bug' ? 'Keine Bugs gemeldet' : 'Noch keine Ideen'}</Txt>
              <Txt style={{ textAlign: 'center' }}>
                {kind === 'bug' ? 'Läuft alles rund? Super! Sonst melde es hier.' : 'Sei die erste Person mit einer Idee.'}
              </Txt>
            </View>
          </Glass>
        ) : (
          <View style={{ gap: 12 }}>
            {feed.list.map((f, i) => (
              <FeedbackCard
                key={f.id}
                item={f}
                index={i}
                now={now}
                mine={f.user_id === session?.user.id}
                onVote={feed.toggleVote}
                onDelete={onDelete}
              />
            ))}
          </View>
        )}
        <View style={{ height: 80 }} />
      </Screen>

      <Animated.View entering={ZoomIn.delay(250).springify()} style={styles.fab}>
        <Pressy
          onPress={() => router.push({ pathname: '/feedback-new', params: { kind } })}
          scaleTo={0.92}
          accessibilityLabel={kind === 'bug' ? 'Bug melden' : 'Feature vorschlagen'}
        >
          <LinearGradient colors={gradients.mango} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
            <Ionicons name={meta.icon} size={20} color="#2A1300" />
            <Txt style={styles.fabText}>{kind === 'bug' ? 'Bug melden' : 'Idee teilen'}</Txt>
          </LinearGradient>
        </Pressy>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortRow: { flexDirection: 'row', gap: 8 },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sortOn: { backgroundColor: colors.mango, borderColor: colors.mango },
  sortText: { fontFamily: font.label, fontSize: 12.5, color: colors.textSoft },
  fab: { position: 'absolute', right: 20, bottom: 34, alignSelf: 'flex-end' },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.5)',
  },
  fabText: { fontFamily: font.label, fontSize: 14.5, color: '#2A1300' },
});
