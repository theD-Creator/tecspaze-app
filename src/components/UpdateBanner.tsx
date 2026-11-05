import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius } from '@/theme/tokens';

import { Pressy } from './Pressy';

/**
 * Live updates (EAS Update): checks on launch and every time the app comes
 * back, downloads in the background, then offers a one-tap restart.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    let alive = true;
    const check = async () => {
      try {
        const res = await Updates.checkForUpdateAsync();
        if (alive && res.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // offline or no update server – ignore
      }
    };
    check();
    const t = setInterval(check, 15 * 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!isUpdatePending || dismissed) return null;
  return (
    <Animated.View entering={FadeInUp.springify()} exiting={FadeOutUp} style={[styles.wrap, { top: insets.top + 8 }]}>
      <View style={styles.card}>
        <Ionicons name="sparkles" size={18} color={colors.mango} />
        <Text style={styles.text}>Neues Update ist bereit</Text>
        <Pressy onPress={() => Updates.reloadAsync()} style={styles.btn} accessibilityLabel="Jetzt aktualisieren">
          <Text style={styles.btnText}>Neu laden</Text>
        </Pressy>
        <Pressy onPress={() => setDismissed(true)} accessibilityLabel="Später">
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressy>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  card: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingLeft: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(20,28,64,0.97)',
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  text: { flex: 1, fontFamily: font.display, color: colors.text, fontSize: 14.5 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.mango },
  btnText: { fontFamily: font.label, color: '#2A1300', fontSize: 12.5 },
});
