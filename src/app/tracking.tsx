import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Button, IconButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { backgroundSupported, usePresence } from '@/state/presence';
import { colors } from '@/theme/tokens';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  { icon: 'location', title: 'Ankommen', text: 'Sobald du das Tecspaze betrittst, startet dein Timer automatisch.' },
  { icon: 'timer', title: 'Zeit sammeln', text: 'Die Zeit läuft im Hintergrund weiter – auch wenn die App zu ist.' },
  { icon: 'trophy', title: 'Aufsteigen', text: 'Wer am meisten Zeit im Tecspaze verbringt, steht ganz oben.' },
];

/** Explains location tracking before asking for permission (Android 11+ needs context). */
export default function Tracking() {
  const p = usePresence();
  if (p.viewer) {
    return (
      <Screen tabs={false}>
        <View style={styles.top}>
          <View style={{ width: 46 }} />
          <Txt variant="label">Auto-Tracking</Txt>
          <IconButton icon="close" label="Schließen" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.badge}>
          <Ionicons name="phone-portrait-outline" size={46} color="#2A1300" />
        </Animated.View>
        <Txt variant="title" style={{ textAlign: 'center' }}>
          Zeit erfasst dein Handy
        </Txt>
        <Txt style={{ textAlign: 'center' }}>
          Computer kennen ihren Standort nur ungefähr. Darum wird hier keine Zeit gemessen. Öffne Tecspaze auf deinem Handy –
          Timer, Rangliste und Statistik sind überall gleich.
        </Txt>
      </Screen>
    );
  }
  const done = p.enabled && p.permission === 'always';
  const partial = p.enabled && p.permission === 'foreground';
  const denied = p.permission === 'denied';

  return (
    <Screen tabs={false}>
      <View style={styles.top}>
        <View style={{ width: 46 }} />
        <Txt variant="label">Auto-Tracking</Txt>
        <IconButton icon="close" label="Schließen" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>

      <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.badge}>
        <Ionicons name={done ? 'checkmark' : 'navigate'} size={46} color="#2A1300" />
      </Animated.View>
      <Txt variant="title" style={{ textAlign: 'center' }}>
        {done ? 'Alles bereit!' : 'Dein Timer startet von selbst'}
      </Txt>
      <Txt style={{ textAlign: 'center' }}>
        Wir prüfen nur, ob du in der Nähe des Tecspaze bist. Dein genauer Standort wird nicht gespeichert – nur deine Zeit vor
        Ort.
      </Txt>

      <View style={{ gap: 10 }}>
        {STEPS.map((s, i) => (
          <Animated.View key={s.title} entering={FadeInDown.delay(120 + i * 90).springify()}>
            <Glass padding={14}>
              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <Ionicons name={s.icon} size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="h3">{s.title}</Txt>
                  <Txt variant="small" style={{ color: colors.textSoft }}>
                    {s.text}
                  </Txt>
                </View>
              </View>
            </Glass>
          </Animated.View>
        ))}
      </View>

      {partial && backgroundSupported ? (
        <Glass padding={14} style={{ borderColor: 'rgba(240,150,45,0.45)' }}>
          <Txt style={{ color: colors.text }}>
            Wähle in den Einstellungen „Immer zulassen“, damit der Timer auch bei geschlossener App läuft.
          </Txt>
        </Glass>
      ) : null}
      {!backgroundSupported ? (
        <Txt variant="small" style={{ textAlign: 'center' }}>
          Im Browser läuft das Tracking nur, solange die Seite offen ist. Für Hintergrund-Tracking nutze die Android-App.
        </Txt>
      ) : null}
      {p.error ? <Txt style={{ color: colors.danger, textAlign: 'center' }}>{p.error}</Txt> : null}

      <View style={{ gap: 12 }}>
        {done ? (
          <Button label="Fertig" icon="checkmark" onPress={() => router.back()} />
        ) : denied || partial ? (
          <>
            <Button label="Einstellungen öffnen" icon="settings-outline" onPress={() => Linking.openSettings()} />
            <Button label="Erneut prüfen" variant="glass" onPress={p.enable} loading={p.busy} />
          </>
        ) : (
          <Button label="Standort erlauben" icon="navigate" onPress={p.enable} loading={p.busy} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    alignSelf: 'center',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.5)',
    marginTop: 8,
  },
  step: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
