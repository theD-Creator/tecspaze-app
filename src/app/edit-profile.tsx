import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Buttons';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/state/auth';
import { colors } from '@/theme/tokens';

export default function EditProfile() {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [photo, setPhoto] = useState(profile?.photo ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (name.trim().length < 2) return setErr('Der Name braucht mindestens 2 Zeichen.');
    if (photo.trim() && !/^https:\/\/\S+$/.test(photo.trim())) return setErr('Das Profilbild muss ein https-Link sein.');
    setBusy(true);
    const e = await updateProfile({ display_name: name.trim(), bio: bio.trim() || null, photo: photo.trim() || null });
    setBusy(false);
    if (e) setErr('Speichern fehlgeschlagen.');
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen tabs={false}>
        <View style={styles.top}>
          <View style={{ width: 46 }} />
          <Txt variant="label">Profil bearbeiten</Txt>
          <IconButton icon="close" label="Schließen" onPress={() => router.back()} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Avatar name={name || null} photo={photo} id={profile?.id} size={96} ring={[colors.magenta, colors.cyan]} />
        </View>
        <Glass padding={20}>
          <View style={{ gap: 16 }}>
            <Field label="Anzeigename" icon="person-outline" value={name} onChangeText={setName} maxLength={40} />
            <Field
              label="Über mich"
              icon="chatbox-ellipses-outline"
              value={bio}
              onChangeText={setBio}
              maxLength={160}
              placeholder="Was machst du im Tecspaze?"
            />
            <Field
              label="Profilbild (Link)"
              icon="image-outline"
              value={photo}
              onChangeText={setPhoto}
              autoCapitalize="none"
              placeholder="https://…"
            />
          </View>
        </Glass>
        {err ? <Txt style={{ color: colors.danger }}>{err}</Txt> : null}
        <Button label="Speichern" icon="checkmark" onPress={save} loading={busy} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } });
