import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Same Supabase project as the previous Tecspaze apps (shared accounts).
// Only the publishable key belongs in the client – RLS protects the data.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://yjfoxqwgvutzsxjvqwgx.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_lI5JnfKB3naAxa-qUeeyCA_HTT6Qj3q';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground (Supabase RN guidance).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
