import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IntroAnimation } from '@/components/IntroAnimation';
import { InstallHint } from '@/components/InstallHint';
import { UpdateBanner } from '@/components/UpdateBanner';
import { WhatsNew } from '@/components/WhatsNew';
import { APP_VERSION } from '@/lib/changelog';
import { DEMO } from '@/lib/demo';
import { AuthProvider, useAuth } from '@/state/auth';
import { MotionProvider, useMotion } from '@/state/motion';
import { PresenceProvider } from '@/state/presence';
import { fontAssets } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

const INTRO_KEY = 'tecspaze:introSeenVersion';

SplashScreen.preventAutoHideAsync().catch(() => null);
SystemUI.setBackgroundColorAsync(colors.bg).catch(() => null);

function RootStack() {
  const { session, loading } = useAuth();
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const motion = useMotion();
  // intro plays once per app version (and never with "Weniger Animationen")
  const [introSeen, setIntroSeen] = useState<boolean | null>(DEMO ? true : null);
  useEffect(() => {
    if (DEMO) return;
    AsyncStorage.getItem(INTRO_KEY)
      .then((v) => setIntroSeen(v === APP_VERSION))
      .catch(() => setIntroSeen(false));
  }, []);
  const endIntro = useCallback(() => {
    setIntroSeen(true);
    AsyncStorage.setItem(INTRO_KEY, APP_VERSION).catch(() => null);
  }, []);
  const ready = !loading && (fontsLoaded || Boolean(fontError)) && motion.ready && introSeen !== null;
  const intro = introSeen === false && !motion.reduced;
  const anim = <T extends string>(a: T): T | 'none' => (motion.reduced ? 'none' : a);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => null);
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const signedIn = Boolean(session);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: anim('fade_from_bottom'),
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ animation: anim('fade') }} />
          <Stack.Screen name="post/[id]" options={{ animation: anim('slide_from_right') }} />
          <Stack.Screen name="tracking" options={{ presentation: 'modal', animation: anim('slide_from_bottom') }} />
          <Stack.Screen name="admin-space" options={{ animation: anim('slide_from_right') }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: anim('slide_from_bottom') }} />
          <Stack.Screen name="feedback" options={{ animation: anim('slide_from_right') }} />
          <Stack.Screen name="feedback-new" options={{ presentation: 'modal', animation: anim('slide_from_bottom') }} />
          <Stack.Screen name="changelog" options={{ animation: anim('slide_from_right') }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="get-started" options={{ animation: anim('fade') }} />
          <Stack.Screen name="login" options={{ animation: anim('slide_from_right') }} />
        </Stack.Protected>
      </Stack>
      <UpdateBanner />
      {signedIn ? <InstallHint /> : null}
      {signedIn && !intro ? <WhatsNew /> : null}
      {intro ? <IntroAnimation onDone={endIntro} /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PresenceProvider>
          <MotionProvider>
            <RootStack />
          </MotionProvider>
        </PresenceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
