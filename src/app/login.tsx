import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Button, IconButton } from '@/components/Buttons';
import { Field } from '@/components/Field';
import { Glass } from '@/components/Glass';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { useAuth } from '@/state/auth';
import { colors } from '@/theme/tokens';

type Mode = 'login' | 'register';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>(params.mode === 'login' ? 'login' : 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const pwRef = useRef<TextInputInstance>(null);

  const validate = (): string | null => {
    if (mode === 'register' && name.trim().length < 2) return 'Wie sollen wir dich nennen? (mind. 2 Zeichen)';
    if (!EMAIL_RE.test(email.trim())) return 'Bitte gib eine gültige E-Mail ein.';
    if (password.length < 6) return 'Das Passwort muss mindestens 6 Zeichen haben.';
    return null;
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    const v = validate();
    if (v) return setError(v);
    setBusy(true);
    const err = mode === 'login' ? await signIn(email, password) : await signUp(email, password, name);
    setBusy(false);
    if (err === 'CONFIRM_EMAIL') {
      setInfo('Fast geschafft! Wir haben dir eine Bestätigungs-Mail geschickt. Danach kannst du dich anmelden.');
      setMode('login');
    } else if (err) setError(err);
  };

  const forgot = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError('Gib zuerst deine E-Mail ein, dann schicken wir dir einen Link.');
    setBusy(true);
    const err = await resetPassword(email);
    setBusy(false);
    if (err) setError(err);
    else setInfo('Link zum Zurücksetzen ist unterwegs – schau in dein Postfach.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen tabs={false}>
        <View style={styles.header}>
          <IconButton
            icon="chevron-back"
            label="Zurück"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/get-started'))}
          />
          <Logo kind="wordmark" width={112} />
          <View style={{ width: 46 }} />
        </View>

        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ gap: 6, marginTop: 12 }}>
          <Txt variant="editorial">{mode === 'login' ? 'Willkommen zurück' : 'Schön, dass du da bist'}</Txt>
          <Txt>
            {mode === 'login'
              ? 'Melde dich mit deinem Tecspaze-Konto an.'
              : 'Ein Konto für alle Tecspaze-Apps – auch die Community.'}
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <Segmented
            options={[
              { value: 'register', label: 'Registrieren' },
              { value: 'login', label: 'Anmelden' },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(500)} layout={LinearTransition.springify()}>
          <Glass padding={20} radiusSize={28}>
            <View style={{ gap: 16 }}>
              {mode === 'register' ? (
                <Animated.View entering={FadeIn} exiting={FadeOut}>
                  <Field
                    label="Anzeigename"
                    icon="person-outline"
                    placeholder="z. B. Alex"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    maxLength={40}
                  />
                </Animated.View>
              ) : null}
              <Field
                ref={emailRef}
                label="E-Mail"
                icon="mail-outline"
                placeholder="du@beispiel.de"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
              />
              <Field
                ref={pwRef}
                label="Passwort"
                icon="lock-closed-outline"
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChangeText={setPassword}
                secure
                autoCapitalize="none"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                textContentType={mode === 'login' ? 'password' : 'newPassword'}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              {mode === 'login' ? (
                <Pressable onPress={forgot} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-end' }}>
                  <Txt variant="small" style={{ color: colors.cyan }}>
                    Passwort vergessen?
                  </Txt>
                </Pressable>
              ) : null}
            </View>
          </Glass>
        </Animated.View>

        {error ? (
          <Animated.View entering={FadeInDown} style={[styles.msg, styles.err]} accessibilityLiveRegion="polite">
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Txt style={{ flex: 1, color: colors.text }}>{error}</Txt>
          </Animated.View>
        ) : null}
        {info ? (
          <Animated.View entering={FadeInDown} style={[styles.msg, styles.ok]} accessibilityLiveRegion="polite">
            <Ionicons name="checkmark-circle" size={18} color={colors.mint} />
            <Txt style={{ flex: 1, color: colors.text }}>{info}</Txt>
          </Animated.View>
        ) : null}

        <Button
          label={mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          icon={mode === 'login' ? 'log-in-outline' : 'sparkles'}
          onPress={submit}
          loading={busy}
        />
        <Txt variant="small" style={{ textAlign: 'center' }}>
          Du nutzt dasselbe Konto wie in der Tecspaze Community.
        </Txt>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  msg: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 18, borderWidth: 1 },
  err: { backgroundColor: 'rgba(255,90,110,0.10)', borderColor: 'rgba(255,90,110,0.35)' },
  ok: { backgroundColor: 'rgba(61,220,151,0.10)', borderColor: 'rgba(61,220,151,0.35)' },
});
