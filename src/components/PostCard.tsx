import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { relativeTime, ROLE_LABEL } from '@/lib/format';
import type { Post } from '@/lib/types';
import { colors, font, radius } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Pressy } from './Pressy';

type Props = { post: Post; liked: boolean; onLike: (id: string) => void; index: number; featured?: boolean };

function LikeButton({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (liked) s.value = withSequence(withSpring(1.35, { damping: 6 }), withSpring(1));
  }, [liked, s]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressy
      onPress={onPress}
      style={styles.action}
      accessibilityLabel={liked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'}
      accessibilityState={{ selected: liked }}
    >
      <Animated.View style={anim}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.magenta : colors.textSoft} />
      </Animated.View>
      <Text style={styles.actionText}>{count}</Text>
    </Pressy>
  );
}

export const PostCard = memo(function PostCard({ post, liked, onLike, index, featured }: Props) {
  // like_count from DB doesn't include our optimistic toggle yet
  const count = Math.max(0, post.like_count);
  const open = () => router.push({ pathname: '/post/[id]', params: { id: post.id } });
  const role = post.author?.role;
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 70)
        .springify()
        .damping(16)}
    >
      <View style={[styles.card, featured && styles.featured]}>
        {featured ? (
          <LinearGradient
            colors={['rgba(240,150,45,0.28)', 'rgba(200,50,120,0.18)', 'rgba(0,190,210,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Pressy
          onPress={open}
          scaleTo={0.985}
          haptic={false}
          style={{ gap: 10 }}
          accessibilityLabel={`Beitrag öffnen: ${post.title}`}
        >
          <View style={styles.head}>
            <Avatar name={post.author?.display_name ?? 'Tecspaze'} photo={post.author?.photo} id={post.user_id} size={40} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text numberOfLines={1} style={styles.author}>
                  {post.author?.display_name ?? 'Tecspaze Team'}
                </Text>
                {post.author?.verified || role === 'global_admin' ? (
                  <Ionicons name="checkmark-circle" size={15} color={colors.cyan} />
                ) : null}
              </View>
              <Text style={styles.meta}>
                {role && role !== 'user' ? `${ROLE_LABEL[role]} · ` : ''}
                {relativeTime(post.created_at)}
              </Text>
            </View>
            {featured ? (
              <View style={styles.newPill}>
                <Text style={styles.newText}>NEU</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.title, featured && { fontSize: 22, lineHeight: 28 }]}>{post.title}</Text>
          <Text style={styles.body} numberOfLines={featured ? 6 : 4}>
            {post.content}
          </Text>
          {post.image_url ? (
            <Image
              source={{ uri: post.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={250}
              accessibilityLabel="Beitragsbild"
            />
          ) : null}
        </Pressy>
        <View style={styles.actions}>
          <LikeButton liked={liked} count={count} onPress={() => onLike(post.id)} />
          <Pressy onPress={open} style={styles.action} accessibilityLabel="Kommentare">
            <Ionicons name="chatbubble-outline" size={19} color={colors.textSoft} />
            <Text style={styles.actionText}>{post.comment_count}</Text>
          </Pressy>
          <View style={{ flex: 1 }} />
          <Ionicons name="arrow-forward-circle-outline" size={22} color={colors.textMuted} />
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 18,
    gap: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  featured: { borderColor: 'rgba(240,150,45,0.45)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  author: { fontFamily: font.display, color: colors.text, fontSize: 15, flexShrink: 1 },
  meta: { fontFamily: font.body, color: colors.textMuted, fontSize: 12 },
  title: { fontFamily: font.display, color: colors.text, fontSize: 18, lineHeight: 24, marginTop: 4 },
  body: { fontFamily: font.bodyRegular, color: colors.textSoft, fontSize: 14.5, lineHeight: 21 },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, marginTop: 4, backgroundColor: colors.glass },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 4 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionText: { fontFamily: font.bodyBold, color: colors.textSoft, fontSize: 13 },
  newPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, backgroundColor: colors.mango },
  newText: { fontFamily: font.label, fontSize: 10, letterSpacing: 1, color: '#2A1300' },
});
