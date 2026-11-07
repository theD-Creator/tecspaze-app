import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { threadOf } from '@/lib/support';
import { useInbox } from '@/state/inbox';
import { colors, font, radius } from '@/theme/tokens';

import { Button } from './Buttons';
import { Pressy } from './Pressy';

/** "Support-Modus": slides up as soon as the team answers, straight into the chat. */
export function SupportPopup() {
  const insets = useSafeAreaInsets();
  const { popup, dismissPopup } = useInbox();
  if (!popup) return null;
  const thread = threadOf(popup);
  const status = popup.kind === 'status';

  const open = () => {
    dismissPopup();
    if (thread) router.push({ pathname: '/support/[id]', params: { id: thread } });
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
      <Pressy style={StyleSheet.absoluteFill} onPress={dismissPopup} accessibilityLabel="Schließen" scaleTo={1}>
        <View />
      </Pressy>
      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}
        accessibilityViewIsModal
      >
        <View style={styles.grab} />
        <View style={styles.head}>
          <View style={styles.icon}>
            <Ionicons name={status ? 'flag' : 'headset'} size={22} color="#2A1300" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>SUPPORT-MODUS</Text>
            <Text style={styles.title}>{popup.title}</Text>
          </View>
        </View>
        <View style={styles.quote}>
          <Text style={styles.body} numberOfLines={6}>
            {popup.body}
          </Text>
        </View>
        <Button label="Zum Chat" icon="chatbubbles" variant="mango" onPress={open} />
        <Pressy onPress={dismissPopup} accessibilityLabel="Später">
          <Text style={styles.later}>Später</Text>
        </Pressy>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 210,
    backgroundColor: 'rgba(3,5,16,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 22,
    paddingTop: 10,
    gap: 14,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: '#131A3D',
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.mango,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { fontFamily: font.label, fontSize: 11, letterSpacing: 1.4, color: colors.mangoSoft },
  title: { fontFamily: font.display, fontSize: 19, lineHeight: 24, color: colors.text },
  quote: {
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: colors.mango,
  },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 21, color: colors.textSoft },
  later: { fontFamily: font.label, fontSize: 13, color: colors.textSoft, textAlign: 'center', paddingVertical: 4 },
});
