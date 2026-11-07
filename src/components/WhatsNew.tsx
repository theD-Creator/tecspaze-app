import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_VERSION, CHANGELOG, unseenEntries, type ChangelogEntry } from '@/lib/changelog';
import { colors, font, radius } from '@/theme/tokens';

import { Button } from './Buttons';
import { Pressy } from './Pressy';

const KEY = 'tecspaze:lastSeenVersion';

/** Shows "Neu in Version X" once after an update (signed-in users only). */
export function WhatsNew() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((seen) => {
        if (!alive) return;
        // no stored version = app was installed before the changelog existed → show the latest
        setEntries(seen ? unseenEntries(seen) : CHANGELOG.slice(0, 1));
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, []);

  if (entries.length === 0) return null;

  const close = (openAll = false) => {
    setEntries([]);
    AsyncStorage.setItem(KEY, APP_VERSION).catch(() => null);
    if (openAll) router.push('/changelog');
  };

  const items = entries.flatMap((e) => e.items).slice(0, 8);

  return (
    <Animated.View entering={FadeIn.delay(600)} exiting={FadeOut} style={styles.backdrop}>
      <Animated.View
        entering={ZoomIn.delay(700).springify().damping(14)}
        style={[styles.card, { marginTop: insets.top + 40, marginBottom: insets.bottom + 40 }]}
      >
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={26} color="#2A1300" />
        </View>
        <Text style={styles.kicker}>NEU IN VERSION {APP_VERSION}</Text>
        <Text style={styles.title}>{entries[0].title}</Text>
        <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          {items.map((it) => (
            <View key={it} style={styles.item}>
              <Ionicons name="checkmark-circle" size={18} color={colors.mint} style={{ marginTop: 1 }} />
              <Text style={styles.itemText}>{it}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={{ gap: 10, marginTop: 6 }}>
          <Button label="Cool, danke!" variant="mango" onPress={() => close()} />
          <Pressy onPress={() => close(true)} accessibilityLabel="Alle Änderungen ansehen">
            <Text style={styles.link}>Alle Änderungen ansehen</Text>
          </Pressy>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 200,
    backgroundColor: 'rgba(3,5,16,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 22,
    gap: 12,
    borderRadius: radius.xl,
    backgroundColor: '#131A3D',
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  badge: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mango,
    marginTop: -50,
    borderWidth: 4,
    borderColor: '#131A3D',
  },
  kicker: { fontFamily: font.label, fontSize: 11, letterSpacing: 1.4, color: colors.mangoSoft, textAlign: 'center' },
  title: { fontFamily: font.display, fontSize: 22, lineHeight: 28, color: colors.text, textAlign: 'center' },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  itemText: { flex: 1, fontFamily: font.body, fontSize: 14.5, lineHeight: 20, color: colors.textSoft },
  link: { fontFamily: font.label, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 6 },
});
