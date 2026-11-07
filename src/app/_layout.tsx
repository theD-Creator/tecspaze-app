import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IntroAnimation } from '@/components/IntroAnimation';
import { InstallHint } from '@/components/InstallHint';
import { UpdateBanner } from '@/components/UpdateBanner';
import { DEMO } from '@/lib/demo';
import { AuthProvider, useAuth } from '@/state/auth';
import { PresenceProvider } from '@/state/presence';
import { fontAssets } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => null);
SystemUI.setBackgroundColorAsync(colors.bg).catch(() => null);

function RootStack() {
  const { session, loading } = useAuth();
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [intro, setIntro] = useState(!DEMO);
  const endIntro = useCallback(() => setIntro(false), []);
  const ready = !loading && (fontsLoaded || Boolean(fontError));

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
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="post/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="tracking" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="admin-space" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="feedback" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="feedback-new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="get-started" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>
      </Stack>
      <UpdateBanner />
      {signedIn ? <InstallHint /> : null}
      {intro ? <IntroAnimation onDone={endIntro} /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PresenceProvider>
          <RootStack />
        </PresenceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
