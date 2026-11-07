import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { useState, type ComponentProps } from 'react';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Pressy } from '@/components/Pressy';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { APP_VERSION } from '@/lib/changelog';
import { hours, ROLE_LABEL } from '@/lib/format';
import { isGlobalAdmin, useAuth } from '@/state/auth';
import { useLeaderboard, useMyStats } from '@/state/data';
import { useMotion } from '@/state/motion';
import { usePresence } from '@/state/presence';
import { colors, font } from '@/theme/tokens';

function Row({
  icon,
  label,
  value,
  onPress,
  right,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const inner = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <Txt style={{ flex: 1, color: colors.text, fontFamily: font.display, fontSize: 15 }}>{label}</Txt>
      {value ? <Txt variant="small">{value}</Txt> : null}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </View>
  );
  return onPress ? (
    <Pressy onPress={onPress} scaleTo={0.98} accessibilityLabel={label}>
      {inner}
    </Pressy>
  ) : (
    inner
  );
}

const PERMISSION_TEXT = {
  always: 'Immer erlaubt',
  foreground: 'Nur bei Nutzung',
  denied: 'Abgelehnt',
  undetermined: 'Nicht gefragt',
} as const;

function confirm(title: string, msg: string, ok: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${msg}`));
  return new Promise((resolve) =>
    Alert.alert(title, msg, [
      { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function Profile() {
  const { profile, session, signOut } = useAuth();
  const presence = usePresence();
  const stats = useMyStats();
  const all = useLeaderboard('all', 500);
  const [checking, setChecking] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const rank = all.data?.find((r) => r.user_id === session?.user.id)?.rank;

  const checkUpdate = async () => {
    // the web app always loads the newest version – a reload is the update
    if (Platform.OS === 'web' && !__DEV__) return window.location.reload();
    if (__DEV__ || !Updates.isEnabled) return setUpdateMsg('Live-Updates sind nur in der installierten App aktiv.');
    setChecking(true);
    try {
      const r = await Updates.checkForUpdateAsync();
      if (r.isAvailable) {
        setUpdateMsg('Update wird geladen…');
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else setUpdateMsg('Du hast die neueste Version ✨');
    } catch {
      setUpdateMsg('Update-Server nicht erreichbar.');
    } finally {
      setChecking(false);
    }
  };

  const motion = useMotion();
  // shown version follows the changelog (bumps with every live update); build = native APK
  const build = `Build ${Application.nativeApplicationVersion ?? 'web'}${Updates.updateId ? ` · ${Updates.updateId.slice(0, 7)}` : ''}`;

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <Avatar
          name={profile?.display_name ?? null}
          photo={profile?.photo}
          id={profile?.id}
          size={104}
          ring={[colors.magenta, colors.violet, colors.cyan]}
        />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt variant="title">{profile?.display_name ?? 'Tecspaze Member'}</Txt>
            {profile?.verified ? <Ionicons name="checkmark-circle" size={20} color={colors.cyan} /> : null}
          </View>
          <View style={styles.rolePill}>
            <Txt variant="label" style={{ color: colors.text }}>
              {ROLE_LABEL[profile?.role ?? 'user']}
            </Txt>
          </View>
          {profile?.bio ? <Txt style={{ textAlign: 'center', marginTop: 6 }}>{profile.bio}</Txt> : null}
        </View>
        <Button
          label="Profil bearbeiten"
          icon="create-outline"
          variant="glass"
          compact
          onPress={() => router.push('/edit-profile')}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.grid}>
        {[
          { k: 'Gesamt', v: hours(stats.data?.all ?? 0), icon: 'time' as const, c: colors.cyan },
          { k: 'Platz', v: rank ? `#${rank}` : '–', icon: 'trophy' as const, c: colors.mango },
          { k: 'Besuche', v: String(stats.data?.sessions ?? 0), icon: 'enter' as const, c: colors.magenta },
          { k: 'Streak', v: `${stats.data?.streak ?? 0} Tage`, icon: 'flame' as const, c: colors.gold },
        ].map((s) => (
          <Glass key={s.k} padding={14} style={{ flexBasis: '47%', flexGrow: 1 }}>
            <Ionicons name={s.icon} size={18} color={s.c} />
            <Txt style={{ fontFamily: 'Doto_900Black', fontSize: 24, color: colors.text, marginTop: 8 }}>{s.v}</Txt>
            <Txt variant="label">{s.k}</Txt>
          </Glass>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(500)}>
        <Txt variant="label" style={styles.section}>
          Zeiterfassung
        </Txt>
        <Glass padding={6}>
          {presence.viewer ? (
            <Row icon="phone-portrait-outline" label="Auto-Tracking" value="Nur am Handy" />
          ) : (
            <>
              <Row
                icon="navigate"
                label="Auto-Tracking"
                right={
                  <Switch
                    value={presence.enabled}
                    disabled={presence.busy}
                    onValueChange={(v) => (v ? presence.enable() : presence.disable())}
                    trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.cyan }}
                    thumbColor="#fff"
                    accessibilityLabel="Auto-Tracking"
                  />
                }
              />
              <Row
                icon="shield-checkmark-outline"
                label="Standort-Zugriff"
                value={PERMISSION_TEXT[presence.permission]}
                onPress={() => router.push('/tracking')}
              />
            </>
          )}
          {isGlobalAdmin(profile) ? (
            <Row icon="map-outline" label="Tecspaze-Standort (Admin)" onPress={() => router.push('/admin-space')} />
          ) : null}
        </Glass>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(210).duration(500)}>
        <Txt variant="label" style={styles.section}>
          Feedback
        </Txt>
        <Glass padding={6}>
          <Row icon="bulb-outline" label="Ideen & Bugs ansehen" onPress={() => router.push('/feedback')} />
          <Row
            icon="sparkles-outline"
            label="Feature wünschen"
            onPress={() => router.push({ pathname: '/feedback-new', params: { kind: 'feature' } })}
          />
          <Row
            icon="bug-outline"
            label="Bug melden"
            onPress={() => router.push({ pathname: '/feedback-new', params: { kind: 'bug' } })}
          />
        </Glass>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(500)}>
        <Txt variant="label" style={styles.section}>
          App
        </Txt>
        <Glass padding={6}>
          <Row icon="cloud-download-outline" label={checking ? 'Suche Updates…' : 'Nach Updates suchen'} onPress={checkUpdate} />
          <Row
            icon="sparkles-outline"
            label="Was ist neu"
            value={`Version ${APP_VERSION}`}
            onPress={() => router.push('/changelog')}
          />
          <Row
            icon="pulse-outline"
            label="Weniger Animationen"
            right={
              <Switch
                value={motion.preferReduced}
                onValueChange={motion.setPreferReduced}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.cyan }}
                thumbColor="#fff"
                accessibilityLabel="Weniger Animationen"
              />
            }
          />
          <Row icon="information-circle-outline" label="Version" value={`${APP_VERSION} · ${build}`} />
          <Row icon="mail-outline" label="Konto" value={profile?.email ?? session?.user.email ?? ''} />
        </Glass>
        {updateMsg ? (
          <Txt variant="small" style={{ marginTop: 8, textAlign: 'center' }}>
            {updateMsg}
          </Txt>
        ) : null}
      </Animated.View>

      <Button
        label="Abmelden"
        icon="log-out-outline"
        variant="danger"
        onPress={async () => {
          if (await confirm('Abmelden?', 'Dein laufender Timer wird gestoppt.', 'Abmelden')) await signOut();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 14, paddingTop: 8 },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { marginBottom: 8, marginLeft: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, minHeight: 56 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
