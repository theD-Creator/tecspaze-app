import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius } from '@/theme/tokens';

import { Pressy } from './Pressy';

const KEY = 'tecspaze:installHintDismissed';

/** iPhone/iPad Safari that is not yet running as a home-screen app. */
function shouldShow(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const ios = /iphone|ipad|ipod/i.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  const standalone = nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
  if (!ios || standalone) return false;
  try {
    return window.localStorage.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}

/** Web only: explains "Teilen → Zum Home-Bildschirm" so Tecspaze runs like an app on iOS. */
export function InstallHint() {
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(shouldShow);
  if (!show) return null;

  const close = () => {
    setShow(false);
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      // private mode – fine, hint comes back next time
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(1200).springify()}
      exiting={FadeOutDown}
      style={[styles.wrap, { bottom: insets.bottom + 110 }]}
    >
      <View style={styles.card}>
        <Ionicons name="phone-portrait-outline" size={22} color={colors.mango} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>Tecspaze als App installieren</Text>
          <Text style={styles.text}>
            Tippe unten auf <Ionicons name="share-outline" size={13} color={colors.text} /> „Teilen“ und dann auf „Zum
            Home-Bildschirm“.
          </Text>
        </View>
        <Pressy onPress={close} accessibilityLabel="Hinweis schließen">
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressy>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 90 },
  card: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(20,28,64,0.97)',
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  title: { fontFamily: font.display, color: colors.text, fontSize: 14.5 },
  text: { fontFamily: font.body, color: colors.textSoft, fontSize: 13, lineHeight: 18 },
});
