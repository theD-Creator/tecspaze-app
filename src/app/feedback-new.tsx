import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { router, useLocalSearchParams } from 'expo-router';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Button, IconButton } from '@/components/Buttons';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Pressy } from '@/components/Pressy';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { feedbackError, type FeedbackKind } from '@/lib/feedback';
import { createFeedback } from '@/state/feedback';
import { colors, font, radius } from '@/theme/tokens';

const KINDS: { value: FeedbackKind; title: string; text: string; icon: 'bug' | 'bulb' }[] = [
  { value: 'bug', title: 'Bug melden', text: 'Etwas funktioniert nicht', icon: 'bug' },
  { value: 'feature', title: 'Idee teilen', text: 'Wünsch dir ein Feature', icon: 'bulb' },
];

/** App version + platform, attached to bug reports so we can reproduce them. */
function deviceInfo(): string {
  const os =
    Platform.OS === 'web'
      ? `web (${typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : '?'})`
      : `${Platform.OS} ${Platform.Version}`;
  const v = Application.nativeApplicationVersion ?? 'web';
  const upd = Updates.updateId ? ` · ${Updates.updateId.slice(0, 7)}` : '';
  return `${os} · App ${v}${upd}`;
}

export default function FeedbackNew() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<FeedbackKind>(params.kind === 'bug' ? 'bug' : 'feature');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const problem = feedbackError(title, body, kind);
    if (problem) return setErr(problem);
    setErr(null);
    setBusy(true);
    const e = await createFeedback(kind, title, body, deviceInfo());
    setBusy(false);
    if (e) return setErr(e);
    setDone(true);
  };

  if (done) {
    return (
      <Screen tabs={false}>
        <Animated.View entering={ZoomIn.springify().damping(11)} style={styles.doneIcon}>
          <Txt style={{ fontSize: 48 }}>{kind === 'bug' ? '🐞' : '💡'}</Txt>
        </Animated.View>
        <Txt variant="title" style={{ textAlign: 'center' }}>
          Danke dir!
        </Txt>
        <Txt style={{ textAlign: 'center' }}>
          {kind === 'bug'
            ? 'Dein Bug ist gemeldet. Andere können ihn jetzt bestätigen, damit wir wissen, wie dringend er ist.'
            : 'Deine Idee ist online. Je mehr Upvotes sie bekommt, desto früher bauen wir sie.'}
        </Txt>
        <Button
          label="Zur Übersicht"
          icon="list"
          variant="mango"
          onPress={() => (router.canGoBack() ? router.back() : router.replace({ pathname: '/feedback', params: { kind } }))}
        />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen tabs={false}>
        <View style={styles.top}>
          <IconButton
            icon="close"
            label="Schließen"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/feedback'))}
          />
          <Txt variant="label">Feedback</Txt>
          <View style={{ width: 46 }} />
        </View>

        <View style={styles.kinds}>
          {KINDS.map((k, i) => {
            const on = kind === k.value;
            return (
              <Animated.View key={k.value} entering={FadeInDown.delay(i * 70).springify()} style={{ flex: 1 }}>
                <Pressy
                  onPress={() => {
                    setKind(k.value);
                    setErr(null);
                  }}
                  scaleTo={0.95}
                  style={[styles.kind, on && styles.kindOn]}
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={k.title}
                >
                  <Ionicons name={k.icon} size={26} color={on ? '#2A1300' : colors.text} />
                  <Txt style={[styles.kindTitle, on && { color: '#2A1300' }]}>{k.title}</Txt>
                  <Txt style={[styles.kindText, on && { color: '#3A2200' }]}>{k.text}</Txt>
                </Pressy>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeIn.duration(300)} key={kind}>
          <Glass padding={18}>
            <View style={{ gap: 16 }}>
              <Field
                label="Titel"
                icon={kind === 'bug' ? 'alert-circle-outline' : 'sparkles-outline'}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                placeholder={kind === 'bug' ? 'z. B. Timer startet nicht' : 'z. B. Wochen-Challenges'}
              />
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt variant="label">{kind === 'bug' ? 'Was ist passiert?' : 'Beschreibung (optional)'}</Txt>
                  <Txt variant="small">{body.length}/4000</Txt>
                </View>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  multiline
                  maxLength={4000}
                  placeholder={
                    kind === 'bug'
                      ? 'Was hast du gemacht? Was ist passiert? Was hättest du erwartet?'
                      : 'Wie soll es funktionieren und warum wäre es cool?'
                  }
                  placeholderTextColor={colors.textMuted}
                  style={styles.area}
                  textAlignVertical="top"
                  accessibilityLabel="Beschreibung"
                />
              </View>
              {kind === 'bug' ? (
                <View style={styles.info}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
                  <Txt variant="small" style={{ flex: 1 }}>
                    App-Version und Gerät werden automatisch mitgeschickt (nur für das Team sichtbar).
                  </Txt>
                </View>
              ) : null}
            </View>
          </Glass>
        </Animated.View>

        {err ? <Txt style={{ color: colors.danger, textAlign: 'center' }}>{err}</Txt> : null}

        <Button
          label={kind === 'bug' ? 'Bug melden' : 'Idee veröffentlichen'}
          icon="paper-plane"
          variant="mango"
          loading={busy}
          onPress={submit}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kinds: { flexDirection: 'row', gap: 12 },
  kind: {
    flex: 1,
    gap: 6,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  kindOn: { backgroundColor: colors.mango, borderColor: colors.mango },
  kindTitle: { fontFamily: font.display, fontSize: 16, color: colors.text },
  kindText: { fontFamily: font.body, fontSize: 12.5, color: colors.textSoft },
  area: {
    minHeight: 150,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 21,
  },
  info: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  doneIcon: {
    alignSelf: 'center',
    marginTop: 50,
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,150,45,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(240,150,45,0.5)',
  },
});
