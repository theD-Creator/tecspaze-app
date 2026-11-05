import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Buttons';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Pressy } from '@/components/Pressy';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { supabase } from '@/lib/supabase';
import type { Space } from '@/lib/types';
import { isGlobalAdmin, useAuth } from '@/state/auth';
import { usePresence } from '@/state/presence';
import { colors } from '@/theme/tokens';

/** Global admins pin the Tecspaze geofence to their current position. */
export default function AdminSpace() {
  const { profile } = useAuth();
  const presence = usePresence();
  const [space, setSpace] = useState<Space | null>(null);
  const [name, setName] = useState('Tecspaze');
  const [radius, setRadius] = useState(120);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchSpace = useCallback(
    () => supabase.from('spaces').select('*').eq('active', true).order('created_at').limit(1).maybeSingle(),
    [],
  );
  const applySpace = useCallback((data: Space | null) => {
    if (!data) return;
    setSpace(data);
    setName(data.name);
    setRadius(data.radius_m);
  }, []);
  const load = useCallback(async () => applySpace((await fetchSpace()).data as Space | null), [fetchSpace, applySpace]);
  useEffect(() => {
    fetchSpace().then(({ data }) => applySpace(data as Space | null));
  }, [fetchSpace, applySpace]);

  if (!isGlobalAdmin(profile)) return <Redirect href="/profile" />;

  const save = async (usePosition: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      let coords = space ? { latitude: space.latitude, longitude: space.longitude } : null;
      if (usePosition) {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') throw new Error('Standort-Zugriff fehlt.');
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      }
      if (!coords) throw new Error('Kein Standort vorhanden.');
      const patch = { name: name.trim() || 'Tecspaze', radius_m: radius, ...coords, updated_at: new Date().toISOString() };
      const { error } = space
        ? await supabase.from('spaces').update(patch).eq('id', space.id)
        : await supabase.from('spaces').insert(patch);
      if (error) throw error;
      await load();
      await presence.refresh();
      setMsg('Gespeichert ✅');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen tabs={false}>
      <View style={styles.top}>
        <IconButton icon="chevron-back" label="Zurück" onPress={() => router.back()} />
        <Txt variant="label">Global Admin</Txt>
        <View style={{ width: 46 }} />
      </View>
      <Txt variant="title">Tecspaze-Standort</Txt>
      <Txt>
        Stell dich ins Tecspaze und tippe auf „Hier setzen“. Alle Mitglieder in diesem Radius sammeln dann automatisch Zeit.
      </Txt>

      <Glass padding={18}>
        {space ? (
          <View style={{ gap: 6 }}>
            <Txt variant="label">Aktuell</Txt>
            <Txt variant="h3">
              {space.latitude.toFixed(5)}, {space.longitude.toFixed(5)}
            </Txt>
            <Txt variant="small">Radius {space.radius_m} m</Txt>
          </View>
        ) : (
          <ActivityIndicator color={colors.cyan} />
        )}
      </Glass>

      <Glass padding={18}>
        <View style={{ gap: 16 }}>
          <Field label="Name" icon="business-outline" value={name} onChangeText={setName} maxLength={80} />
          <View style={{ gap: 8 }}>
            <Txt variant="label">Radius</Txt>
            <View style={styles.stepper}>
              <Pressy onPress={() => setRadius((r) => Math.max(20, r - 10))} accessibilityLabel="Radius verkleinern">
                <View style={styles.stepBtn}>
                  <Ionicons name="remove" size={22} color={colors.text} />
                </View>
              </Pressy>
              <Txt style={{ fontFamily: 'Doto_900Black', fontSize: 28, color: colors.text }}>{radius} m</Txt>
              <Pressy onPress={() => setRadius((r) => Math.min(2000, r + 10))} accessibilityLabel="Radius vergrößern">
                <View style={styles.stepBtn}>
                  <Ionicons name="add" size={22} color={colors.text} />
                </View>
              </Pressy>
            </View>
          </View>
        </View>
      </Glass>

      {msg ? <Txt style={{ textAlign: 'center', color: colors.text }}>{msg}</Txt> : null}
      <Button label="Hier setzen (meine Position)" icon="locate" onPress={() => save(true)} loading={busy} />
      <Button label="Nur Name & Radius speichern" variant="glass" onPress={() => save(false)} disabled={busy || !space} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
