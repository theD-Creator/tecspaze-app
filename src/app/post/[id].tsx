import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Pressy } from '@/components/Pressy';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { relativeTime, ROLE_LABEL } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth';
import { usePost } from '@/state/data';
import { colors, font, radius } from '@/theme/tokens';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const res = usePost(id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    const content = text.trim();
    if (!content || !session) return;
    setSending(true);
    setErr(null);
    const { error } = await supabase.from('comments').insert({ post_id: id, user_id: session.user.id, content });
    setSending(false);
    if (error) setErr(profile?.banned_at ? 'Dein Konto ist gesperrt.' : 'Kommentar konnte nicht gesendet werden.');
    else {
      setText('');
      res.reload();
    }
  };

  const post = res.data?.post;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen tabs={false}>
        <View style={styles.top}>
          <IconButton
            icon="chevron-back"
            label="Zurück"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
          />
          <Txt variant="label">Beitrag</Txt>
          <View style={{ width: 46 }} />
        </View>

        {res.loading && !post ? (
          <ActivityIndicator color={colors.cyan} style={{ marginTop: 60 }} />
        ) : !post ? (
          <Txt style={{ textAlign: 'center', marginTop: 40 }}>Dieser Beitrag existiert nicht mehr.</Txt>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(450)} style={{ gap: 14 }}>
              <View style={styles.author}>
                <Avatar name={post.author?.display_name ?? null} photo={post.author?.photo} id={post.user_id} size={46} />
                <View style={{ flex: 1 }}>
                  <Txt variant="h3">{post.author?.display_name ?? 'Tecspaze Team'}</Txt>
                  <Txt variant="small">
                    {post.author?.role && post.author.role !== 'user' ? `${ROLE_LABEL[post.author.role]} · ` : ''}
                    {relativeTime(post.created_at)}
                  </Txt>
                </View>
              </View>
              <Txt variant="title">{post.title}</Txt>
              {post.image_url ? <Image source={{ uri: post.image_url }} style={styles.image} contentFit="cover" /> : null}
              <Txt style={{ color: colors.text, fontSize: 16, lineHeight: 25 }}>{post.content}</Txt>
            </Animated.View>

            <View style={styles.divider} />
            <Txt variant="h2">Kommentare · {res.data?.comments.length ?? 0}</Txt>

            <Glass padding={8} radiusSize={26}>
              <View style={styles.composer}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Schreib etwas Nettes…"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  multiline
                  maxLength={2000}
                  accessibilityLabel="Kommentar schreiben"
                />
                <Pressy onPress={send} disabled={!text.trim() || sending} accessibilityLabel="Kommentar senden">
                  <View style={styles.send}>
                    {sending ? (
                      <ActivityIndicator color="#2A1300" size="small" />
                    ) : (
                      <Ionicons name="arrow-up" size={20} color="#2A1300" />
                    )}
                  </View>
                </Pressy>
              </View>
            </Glass>
            {err ? <Txt style={{ color: colors.danger }}>{err}</Txt> : null}

            <View style={{ gap: 12 }}>
              {(res.data?.comments ?? []).map((c, i) => (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 40)} style={styles.comment}>
                  <Avatar name={c.author?.display_name ?? null} photo={c.author?.photo} id={c.user_id} size={34} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt style={{ fontFamily: font.display, color: colors.text, fontSize: 14 }}>
                      {c.author?.display_name ?? 'Unbekannt'}
                      <Txt variant="small">{`  ${relativeTime(c.created_at)}`}</Txt>
                    </Txt>
                    <Txt style={{ fontSize: 14.5 }}>{c.content}</Txt>
                  </View>
                </Animated.View>
              ))}
              {res.data && res.data.comments.length === 0 ? (
                <Txt variant="small">Noch keine Kommentare – mach den Anfang!</Txt>
              ) : null}
            </View>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
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
  comment: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
});
