import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Buttons';
import { Backdrop } from '@/components/Backdrop';
import { Pressy } from '@/components/Pressy';
import { Txt } from '@/components/Txt';
import { useKeyboardAwareScroll } from '@/lib/keyboard';
import { chatError, startsNewDay, type SupportMessage } from '@/lib/support';
import { useAuth } from '@/state/auth';
import { useChat } from '@/state/support';
import { colors, font, MAX_WIDTH } from '@/theme/tokens';

const time = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const day = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(Date.now() - 864e5);
  if (d.toDateString() === today.toDateString()) return 'Heute';
  if (d.toDateString() === y.toDateString()) return 'Gestern';
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long' });
};

function Bubble({ m, mine }: { m: SupportMessage; mine: boolean }) {
  if (m.kind === 'status') {
    return (
      <View style={styles.statusPill}>
        <Ionicons name="flag" size={12} color={colors.cyan} />
        <Txt style={styles.statusText}>{m.body}</Txt>
      </View>
    );
  }
  const pending = m.id.startsWith('tmp-');
  return (
    <Animated.View entering={FadeInUp.duration(220)} style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
      {!mine ? <Avatar name={m.sender_name} photo={m.sender_photo} id={m.sender_id ?? undefined} size={28} /> : null}
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {!mine ? (
          <Txt style={styles.sender}>
            {m.from_team ? `${m.sender_name ?? 'Team'} · Team` : (m.sender_name ?? 'Mitglied')}
          </Txt>
        ) : null}
        <Txt selectable style={[styles.body, mine && { color: '#2A1300' }]}>
          {m.body}
        </Txt>
        <Txt style={[styles.time, mine && { color: 'rgba(42,19,0,0.6)' }]}>
          {pending ? 'sendet…' : time(m.created_at)}
        </Txt>
      </View>
    </Animated.View>
  );
}

export default function SupportChat() {
  const params = useLocalSearchParams<{ id: string; feedback?: string; subject?: string }>();
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const chat = useChat(params.id, params.feedback ?? null, params.subject ?? null);
  // only the keyboard height is needed here (Android edge-to-edge)
  const { extraBottom } = useKeyboardAwareScroll();
  const listRef = useRef<ScrollViewInstance>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const count = chat.messages.length;

  // the chat sticks to the newest message
  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: count > 0 }), 60);
    return () => clearTimeout(t);
  }, [count, extraBottom]);

  const send = async () => {
    const problem = chatError(text);
    if (problem || !session) {
      setErr(problem);
      return;
    }
    setSending(true);
    setErr(null);
    const body = text;
    setText('');
    const e = await chat.send(body, {
      id: session.user.id,
      name: profile?.display_name ?? null,
      photo: profile?.photo ?? null,
    });
    setSending(false);
    if (e) {
      setErr(e);
      setText(body);
    }
  };

  const title = chat.meta?.subject ?? params.subject ?? 'Support';
  const isMine = (m: SupportMessage) => !m.from_team && m.sender_id === session?.user.id;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <Backdrop />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerInner}>
            <IconButton
              icon="chevron-back"
              label="Zurück"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/support'))}
            />
            <View style={{ flex: 1 }}>
              <Txt variant="label" style={{ color: colors.mangoSoft }}>
                Support-Chat
              </Txt>
              <Txt numberOfLines={1} style={styles.title}>
                {title}
              </Txt>
            </View>
            <View style={styles.teamDot}>
              <Ionicons name="headset" size={18} color="#2A1300" />
            </View>
          </View>
        </View>

        <ScrollView
          ref={listRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        >
          <View style={styles.inner}>
            {chat.loading ? (
              <ActivityIndicator color={colors.cyan} style={{ marginTop: 40 }} />
            ) : chat.error ? (
              <Txt style={{ textAlign: 'center', marginTop: 40 }}>{chat.error}</Txt>
            ) : count === 0 ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="chatbubbles" size={28} color="#2A1300" />
                </View>
                <Txt variant="h2" style={{ textAlign: 'center' }}>
                  Schreib dem Team
                </Txt>
                <Txt variant="small" style={{ textAlign: 'center' }}>
                  Fragen, Probleme oder Ideen – wir antworten hier im Chat. Du bekommst eine Mitteilung, sobald jemand
                  antwortet.
                </Txt>
              </Animated.View>
            ) : (
              chat.messages.map((m, i) => (
                <View key={m.id} style={{ gap: 8 }}>
                  {startsNewDay(chat.messages, i) ? <Txt style={styles.day}>{day(m.created_at)}</Txt> : null}
                  <Bubble m={m} mine={isMine(m)} />
                </View>
              ))
            )}
            {chat.meta?.status === 'closed' ? (
              <Txt variant="small" style={{ textAlign: 'center' }}>
                Dieser Chat ist abgeschlossen. Schreib einfach, wenn du noch etwas brauchst.
              </Txt>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 10 + extraBottom }]}>
          {err ? <Txt style={styles.err}>{err}</Txt> : null}
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Nachricht ans Team…"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              maxLength={4000}
              accessibilityLabel="Nachricht schreiben"
              onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 250)}
            />
            <Pressy onPress={send} disabled={!text.trim() || sending} accessibilityLabel="Nachricht senden">
              <View style={[styles.send, !text.trim() && { opacity: 0.5 }]}>
                {sending ? (
                  <ActivityIndicator color="#2A1300" size="small" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#2A1300" />
                )}
              </View>
            </Pressy>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    backgroundColor: 'rgba(6,10,28,0.85)',
    alignItems: 'center',
  },
  headerInner: { width: '100%', maxWidth: MAX_WIDTH, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: font.display, fontSize: 17, color: colors.text },
  teamDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, paddingVertical: 16, alignItems: 'center', flexGrow: 1 },
  inner: { width: '100%', maxWidth: MAX_WIDTH, gap: 10 },
  day: { alignSelf: 'center', fontFamily: font.label, fontSize: 11, color: colors.textMuted, marginTop: 6 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { maxWidth: '80%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, gap: 3 },
  mine: { backgroundColor: colors.mango, borderBottomRightRadius: 6 },
  theirs: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderBottomLeftRadius: 6,
  },
  sender: { fontFamily: font.label, fontSize: 11, color: colors.mangoSoft },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 21, color: colors.text },
  time: { alignSelf: 'flex-end', fontFamily: font.body, fontSize: 10.5, color: colors.textMuted },
  statusPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(0,190,210,0.14)',
  },
  statusText: { fontFamily: font.label, fontSize: 12, color: '#7FE9F5' },
  empty: { alignItems: 'center', gap: 10, marginTop: 50, paddingHorizontal: 20 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    backgroundColor: 'rgba(6,10,28,0.92)',
    alignItems: 'center',
    gap: 6,
  },
  composer: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 6,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 130,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.text,
    fontFamily: font.body,
    fontSize: 15,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
  },
  err: { color: colors.danger, fontSize: 13 },
});
