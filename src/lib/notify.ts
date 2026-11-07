import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';
import { AppState, Platform } from 'react-native';

import { supabase } from './supabase';

// System notifications: tracking start/stop (local), team replies + updates (push, or
// a background check when push is unavailable). Everything degrades gracefully:
// web and older APKs without the native module simply skip system notifications.

export const APP_ID = 'tecspaze';
const TRACKING_PREF_KEY = 'tecspaze:notifyTracking';
const PUSH_TOKEN_KEY = 'tecspaze:pushToken';
const LAST_SEEN_KEY = 'tecspaze:notifyLastSeen';
const LAST_CHECK_KEY = 'tecspaze:notifyLastCheck';
const CHECK_GAP_MS = 2 * 60_000;

type N = typeof import('expo-notifications');
let cached: N | null | undefined;

/** The expo-notifications module, or null on web / APKs built before it was added. */
export function notifications(): N | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web' || !requireOptionalNativeModule('ExpoNotificationScheduler')) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as N;
  } catch {
    cached = null;
  }
  return cached;
}

export const notificationsAvailable = () => notifications() !== null;

let configured = false;
/** Foreground behaviour + Android channels. Safe to call often. */
export async function configureNotifications() {
  const N = notifications();
  if (!N || configured) return;
  configured = true;
  N.setNotificationHandler({
    handleNotification: async (n) => {
      const kind = (n.request.content.data as { kind?: string } | undefined)?.kind;
      // while the app is open the UI already shows tracking + support (popup) live
      const quiet = AppState.currentState === 'active' && (kind === 'tracking' || kind === 'team_reply' || kind === 'status');
      return { shouldShowBanner: !quiet, shouldShowList: true, shouldPlaySound: !quiet, shouldSetBadge: false };
    },
  });
  if (Platform.OS === 'android') {
    await Promise.all([
      N.setNotificationChannelAsync('default', { name: 'Neuigkeiten & Updates', importance: N.AndroidImportance.DEFAULT }),
      N.setNotificationChannelAsync('support', {
        name: 'Antworten vom Team',
        importance: N.AndroidImportance.HIGH,
        lightColor: '#F0962D',
      }),
      N.setNotificationChannelAsync('tracking', { name: 'Zeiterfassung', importance: N.AndroidImportance.DEFAULT }),
    ]).catch(() => null);
  }
}

export type PushState = 'unavailable' | 'denied' | 'local' | 'push';

/**
 * Asks for permission and registers an Expo push token for this user.
 * 'local' = notifications allowed but no push token (e.g. Android without Firebase):
 * the background task then checks for new notifications itself.
 */
export async function enableNotifications(ask = true): Promise<PushState> {
  const N = notifications();
  if (!N) return 'unavailable';
  await configureNotifications();
  let perm = await N.getPermissionsAsync();
  if (!perm.granted && ask && perm.canAskAgain) perm = await N.requestPermissionsAsync();
  if (!perm.granted) return 'denied';
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_app: APP_ID, p_platform: Platform.OS });
    if (error) throw error;
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return 'push';
  } catch {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY).catch(() => null);
    return 'local';
  }
}

/** Call before signing out so the next person on this phone gets no pushes for the old account. */
export async function disablePushForAccount() {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (token) await supabase.rpc('unregister_push_token', { p_token: token });
    await AsyncStorage.multiRemove([PUSH_TOKEN_KEY, LAST_SEEN_KEY]);
  } catch {
    // best effort
  }
}

export async function trackingNotificationsOn(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TRACKING_PREF_KEY)) !== '0';
  } catch {
    return true;
  }
}
export async function setTrackingNotifications(on: boolean) {
  await AsyncStorage.setItem(TRACKING_PREF_KEY, on ? '1' : '0').catch(() => null);
}

async function present(title: string, body: string, data: Record<string, unknown>, channelId: string) {
  const N = notifications();
  if (!N) return;
  await configureNotifications();
  const perm = await N.getPermissionsAsync();
  if (!perm.granted) return;
  await N.scheduleNotificationAsync({
    content: { title, body, data, sound: 'default' },
    trigger: Platform.OS === 'android' ? { channelId } : null,
  });
}

/** Local notification when the server starts or stops the timer. */
export async function notifyTrackingChange(inside: boolean, spaceName: string | null) {
  if (!(await trackingNotificationsOn())) return;
  const place = spaceName ?? 'Tecspaze';
  await present(
    inside ? '⏱️ Deine Zeit läuft' : 'Zeit gestoppt',
    inside ? `Willkommen im ${place}! Deine Zeit wird jetzt automatisch erfasst.` : `Bis bald! Deine Zeit im ${place} ist gespeichert.`,
    { kind: 'tracking', url: '/' },
    'tracking',
  ).catch(() => null);
}

type Row = { id: string; kind: string; title: string; body: string; data: Record<string, unknown>; created_at: string };

/**
 * Fallback for phones without push: runs in the background location task and shows
 * unread notifications that arrived since the last check as local notifications.
 */
export async function checkInboxInBackground() {
  if (!notifications()) return;
  try {
    if (await AsyncStorage.getItem(PUSH_TOKEN_KEY)) return; // real push handles it
    const lastCheck = Number((await AsyncStorage.getItem(LAST_CHECK_KEY)) ?? 0);
    if (Date.now() - lastCheck < CHECK_GAP_MS) return;
    await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return;
    const since = (await AsyncStorage.getItem(LAST_SEEN_KEY)) ?? new Date(Date.now() - 6 * 3600_000).toISOString();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, kind, title, body, data, created_at')
      .eq('app', APP_ID)
      .is('read_at', null)
      .gt('created_at', since)
      .order('created_at', { ascending: true })
      .limit(5);
    if (error || !data?.length) return;
    for (const n of data as Row[]) {
      await present(
        n.title,
        n.body,
        { ...n.data, kind: n.kind, notification_id: n.id },
        n.kind === 'team_reply' || n.kind === 'status' ? 'support' : 'default',
      );
    }
    await AsyncStorage.setItem(LAST_SEEN_KEY, (data[data.length - 1] as Row).created_at);
  } catch {
    // never break tracking because of notifications
  }
}

/** Marks everything up to now as seen for the background check (called when the app shows the inbox). */
export async function markInboxSeen() {
  await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString()).catch(() => null);
}

/** Where a tapped notification should lead. */
export function routeForNotification(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data.thread_id === 'string') return `/support/${data.thread_id}`;
  if (data.kind === 'update' || data.kind === 'info') return '/notifications';
  if (typeof data.url === 'string') return data.url;
  return null;
}
