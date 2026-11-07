import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { IconButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { APP_VERSION, CHANGELOG } from '@/lib/changelog';
import { colors } from '@/theme/tokens';

const fmt = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

export default function Changelog() {
  return (
    <Screen tabs={false}>
      <View style={styles.top}>
        <IconButton
          icon="chevron-back"
          label="Zurück"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        />
        <Txt variant="label">Was ist neu</Txt>
        <View style={{ width: 46 }} />
      </View>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Txt variant="title">Changelog</Txt>
        <Txt variant="small" style={{ marginTop: 4 }}>
          Du nutzt Version {APP_VERSION}. Updates kommen automatisch – ohne neue App.
        </Txt>
      </Animated.View>

      {CHANGELOG.map((e, i) => (
        <Animated.View key={e.version} entering={FadeInDown.delay(80 + i * 70).duration(400)}>
          <Glass padding={18} strong={i === 0}>
            <View style={styles.head}>
              <View style={[styles.version, i === 0 && { backgroundColor: colors.mango }]}>
                <Txt style={[styles.versionText, i === 0 && { color: '#2A1300' }]}>{e.version}</Txt>
              </View>
              <Txt variant="small">{fmt(e.date)}</Txt>
              {i === 0 ? (
                <Txt variant="label" style={{ color: colors.mint, marginLeft: 'auto' }}>
                  Aktuell
                </Txt>
              ) : null}
            </View>
            <Txt variant="h2" style={{ marginTop: 10 }}>
              {e.title}
            </Txt>
            <View style={{ gap: 8, marginTop: 10 }}>
              {e.items.map((it) => (
                <View key={it} style={styles.item}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={i === 0 ? colors.mint : colors.textMuted}
                    style={{ marginTop: 2 }}
                  />
                  <Txt style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{it}</Txt>
                </View>
              ))}
            </View>
          </Glass>
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  version: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.1)' },
  versionText: { fontFamily: 'Fredoka_700Bold', fontSize: 13, color: colors.text },
  item: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
});
