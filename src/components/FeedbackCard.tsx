import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { STATUS_COLOR, STATUS_LABEL, type Feedback } from '@/lib/feedback';
import { relativeTime } from '@/lib/format';
import { colors, font, radius } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Pressy } from './Pressy';

type Props = {
  item: Feedback;
  index: number;
  now: number;
  mine: boolean;
  onVote: (id: string) => void;
  onDelete?: (f: Feedback) => void;
};

/** Upvote pill: pops when you vote, fills with the brand colour. */
function VoteButton({ count, voted, onPress, label }: { count: number; voted: boolean; onPress: () => void; label: string }) {
  const pop = useSharedValue(1);
  useEffect(() => {
    if (voted) pop.set(withSequence(withSpring(1.25, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 10 })));
  }, [voted, pop]);
  const arrow = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Pressy
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.vote, voted && styles.voteOn]}
      accessibilityLabel={label}
      accessibilityState={{ selected: voted }}
    >
      <Animated.View style={arrow}>
        <Ionicons name={voted ? 'caret-up' : 'caret-up-outline'} size={20} color={voted ? '#2A1300' : colors.text} />
      </Animated.View>
      <Text style={[styles.voteText, voted && { color: '#2A1300' }]}>{count}</Text>
    </Pressy>
  );
}

export const FeedbackCard = memo(function FeedbackCard({ item, index, now, mine, onVote, onDelete }: Props) {
  const st = STATUS_COLOR[item.status];
  const closed = item.status === 'done' || item.status === 'declined';
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 55)
        .springify()
        .damping(16)}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.card, closed && { opacity: 0.72 }]}
    >
      <View style={styles.row}>
        <VoteButton
          count={item.vote_count}
          voted={item.voted}
          onPress={() => onVote(item.id)}
          label={`${item.voted ? 'Stimme zurücknehmen' : 'Upvoten'}: ${item.title}, ${item.vote_count} Stimmen`}
        />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.metaRow}>
            <View style={[styles.status, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusText, { color: st.fg }]}>{STATUS_LABEL[item.status].toUpperCase()}</Text>
            </View>
            <Text style={styles.time}>{relativeTime(item.created_at, now)}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          {item.body ? (
            <Text style={styles.body} numberOfLines={4}>
              {item.body}
            </Text>
          ) : null}
          {item.admin_note ? (
            <View style={styles.note}>
              <Ionicons name="chatbubble-ellipses" size={13} color={colors.mango} />
              <Text style={styles.noteText}>{item.admin_note}</Text>
            </View>
          ) : null}
          <View style={styles.footer}>
            <Avatar name={item.author_name} photo={item.author_photo} id={item.user_id} size={20} />
            <Text style={styles.author} numberOfLines={1}>
              {mine ? 'Du' : (item.author_name ?? 'Mitglied')}
            </Text>
            {mine && onDelete ? (
              <Pressy onPress={() => onDelete(item)} accessibilityLabel={`Eintrag löschen: ${item.title}`} style={styles.trash}>
                <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
              </Pressy>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  row: { flexDirection: 'row', gap: 14 },
  vote: {
    width: 52,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  voteOn: { backgroundColor: colors.mango, borderColor: colors.mango },
  voteText: { fontFamily: font.displayBold, fontSize: 16, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusText: { fontFamily: font.label, fontSize: 9.5, letterSpacing: 0.8 },
  time: { fontFamily: font.body, fontSize: 12, color: colors.textMuted },
  title: { fontFamily: font.display, fontSize: 16, lineHeight: 21, color: colors.text },
  body: { fontFamily: font.bodyRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSoft },
  note: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(240,150,45,0.10)',
  },
  noteText: { flex: 1, fontFamily: font.body, fontSize: 12.5, lineHeight: 17, color: colors.text },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  author: { flex: 1, fontFamily: font.body, fontSize: 12, color: colors.textMuted },
  trash: { padding: 4 },
});
