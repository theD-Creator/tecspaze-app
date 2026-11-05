import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Logo } from '@/components/Logo';
import { PostCard } from '@/components/PostCard';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useNow, usePosts } from '@/state/data';
import { colors } from '@/theme/tokens';

export default function Community() {
  const feed = usePosts();
  const [refreshing, setRefreshing] = useState(false);
  const posts = feed.data ?? [];
  const now = useNow(60_000);
  const fresh = (iso: string) => now - new Date(iso).getTime() < 3 * 86400_000;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await feed.reload();
        setRefreshing(false);
      }}
    >
      <Animated.View entering={FadeInDown.duration(500)} style={styles.head}>
        <View style={{ flex: 1 }}>
          <Txt variant="label">Community</Txt>
          <Txt variant="title">Neues aus dem Tecspaze</Txt>
        </View>
        <Logo kind="signet" width={34} />
      </Animated.View>

      {feed.loading && !feed.data ? (
        <View style={{ paddingVertical: 60 }}>
          <ActivityIndicator color={colors.cyan} />
        </View>
      ) : feed.error ? (
        <Glass>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
            <Txt style={{ textAlign: 'center' }}>Beiträge konnten nicht geladen werden.</Txt>
            <Button label="Nochmal versuchen" variant="glass" compact onPress={feed.reload} />
          </View>
        </Glass>
      ) : posts.length === 0 ? (
        <Glass>
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
            <Txt style={{ fontSize: 44 }}>📣</Txt>
            <Txt variant="h2">Bald geht’s los</Txt>
            <Txt style={{ textAlign: 'center' }}>Hier erscheinen Neuigkeiten und Events vom Tecspaze-Team.</Txt>
          </View>
        </Glass>
      ) : (
        <View style={{ gap: 14 }}>
          {posts.map((p, i) => (
            <PostCard
              key={p.id}
              post={p}
              index={i}
              liked={feed.liked.has(p.id)}
              onLike={feed.toggleLike}
              featured={i === 0 && fresh(p.created_at)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ head: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 } });
