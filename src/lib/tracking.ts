import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { clearLastPing, sendPing } from './ping';
import { supabase } from './supabase';
import { LOCATION_TASK } from './trackingTask';

const ENABLED_KEY = 'tecspaze:trackingEnabled';

export type PermissionLevel = 'always' | 'foreground' | 'denied' | 'undetermined';

export async function isTrackingEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== '0';
  } catch {
    return true;
  }
}

async function setEnabledFlag(v: boolean) {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, v ? '1' : '0');
  } catch {
    // ignore
  }
}

export async function getPermissionLevel(): Promise<PermissionLevel> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') return fg.status === 'denied' ? 'denied' : 'undetermined';
  if (Platform.OS === 'web') return 'foreground';
  const bg = await Location.getBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'always' : 'foreground';
}

/** Asks for foreground, then background ("Immer erlauben") permission. */
export async function requestPermissions(): Promise<PermissionLevel> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  if (Platform.OS === 'web') return 'foreground';
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'always' : 'foreground';
}

export async function isBackgroundRunning(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    return false;
  }
}

/** Starts the background location service (needs "always" permission). */
export async function startBackground(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const level = await getPermissionLevel();
  if (level !== 'always') return false;
  if (await isBackgroundRunning()) return true;
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 90_000,
    distanceInterval: 0,
    deferredUpdatesInterval: 90_000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: false,
    activityType: Location.ActivityType.Other,
    foregroundService: {
      notificationTitle: 'Tecspaze Timer aktiv',
      notificationBody: 'Deine Zeit im Tecspaze wird automatisch erfasst.',
      notificationColor: '#C83278',
      killServiceOnDestroy: false,
    },
  });
  return true;
}

export async function stopBackground() {
  if (await isBackgroundRunning()) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

/** One fresh fix + ping (used on app open / pull-to-refresh). */
export async function pingNow(force = true) {
  const level = await getPermissionLevel();
  if (level === 'denied' || level === 'undetermined') return null;
  const pos =
    (await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 150 }).catch(() => null)) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return sendPing(pos.coords, { force, source: 'manual' });
}

/** Foreground fallback when background permission is missing (or on web). */
export async function watchForeground(): Promise<() => void> {
  const sub = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 60_000, distanceInterval: 15 },
    (loc) => {
      sendPing(loc.coords, { source: 'foreground' }).catch((e) => console.warn('[tracking] fg ping', e));
    },
  );
  return () => sub.remove();
}

export async function enableTracking(): Promise<PermissionLevel> {
  await setEnabledFlag(true);
  const level = await requestPermissions();
  if (level === 'always') await startBackground();
  if (level !== 'denied') await pingNow().catch(() => null);
  return level;
}

export async function disableTracking() {
  await setEnabledFlag(false);
  await stopBackground();
  await supabase.rpc('stop_tracking');
  await clearLastPing();
}

/** On sign-out: stop service and close the open session server-side. */
export async function teardownTracking() {
  await stopBackground().catch(() => null);
  await supabase.rpc('stop_tracking').then(
    () => null,
    () => null,
  );
  await clearLastPing();
}
