import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { DEMO } from '@/lib/demo';
import { supabase } from '@/lib/supabase';
import { colors, font, radius } from '@/theme/tokens';

import { Button } from './Buttons';
import { Glass } from './Glass';
import { Txt } from './Txt';

type Release = { version: string; version_code: number; url: string; notes: string | null };

async function fetchRelease(app: string): Promise<Release | null> {
  if (DEMO) return { version: '1.4.0', version_code: 99, url: 'https://example.com/app.apk', notes: null };
  const { data } = await supabase
    .from('app_releases')
    .select('version, version_code, url, notes')
    .eq('app', app)
    .maybeSingle();
  return (data as Release | null) ?? null;
}

/** Newest APK of `app` (null while loading / not visible for this account). */
export function useLatestApk(app: string) {
  const [release, setRelease] = useState<Release | null>(null);
  useEffect(() => {
    let alive = true;
    fetchRelease(app)
      .then((r) => {
        if (alive) setRelease(r);
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, [app]);
  const installed = Platform.OS === 'android' ? Number(Application.nativeBuildVersion ?? 0) : 0;
  const newer = Boolean(release && Platform.OS === 'android' && release.version_code > installed);
  return { release, newer };
}

/**
 * "APK herunterladen" – one tap opens the download of the newest APK.
 * `onlyIfNewer` hides it unless the installed Android build is older.
 */
export function ApkDownload({ app, onlyIfNewer = false }: { app: string; onlyIfNewer?: boolean }) {
  const { release, newer } = useLatestApk(app);
  if (!release || Platform.OS === 'ios' || (onlyIfNewer && !newer)) return null;
  const subtitle = newer
    ? 'Neue App-Version – tippen zum Herunterladen und Installieren.'
    : Platform.OS === 'android'
      ? 'Du hast die neueste Version installiert.'
      : 'Für Android-Handys – einfach herunterladen und installieren.';
  return (
    <Glass padding={16} strong={newer}>
      <View style={styles.row}>
        <View style={[styles.icon, newer && { backgroundColor: colors.mango }]}>
          <Ionicons name="logo-android" size={20} color={newer ? '#2A1300' : colors.mint} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt style={styles.title}>{newer ? `Version ${release.version} ist da` : `App-APK ${release.version}`}</Txt>
          <Txt variant="small">{subtitle}</Txt>
        </View>
      </View>
      {release.notes ? (
        <Txt variant="small" style={{ marginTop: 8 }}>
          {release.notes}
        </Txt>
      ) : null}
      <View style={{ marginTop: 12 }}>
        <Button
          label={newer ? 'Jetzt herunterladen' : 'APK herunterladen'}
          icon="download-outline"
          variant={newer ? 'mango' : 'glass'}
          compact
          onPress={() => Linking.openURL(release.url).catch(() => null)}
        />
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(61,220,151,0.16)',
  },
  title: { fontFamily: font.display, fontSize: 16, color: colors.text },
});
