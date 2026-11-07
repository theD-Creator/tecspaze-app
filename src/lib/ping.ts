import AsyncStorage from '@react-native-async-storage/async-storage';

import { notifyTrackingChange } from './notify';
import { supabase } from './supabase';
import type { PingResult } from './types';

const LAST_PING_KEY = 'tecspaze:lastPing';
/** Minimum gap between two server pings unless forced. */
export const MIN_PING_GAP_MS = 45_000;

export type StoredPing = PingResult & { at: number };

type Listener = (p: StoredPing) => void;
const listeners = new Set<Listener>();
let last: StoredPing | null = null;
let inflight: Promise<StoredPing | null> | null = null;

export function onPing(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function getLastPing(): Promise<StoredPing | null> {
  if (last) return last;
  try {
    const raw = await AsyncStorage.getItem(LAST_PING_KEY);
    last = raw ? (JSON.parse(raw) as StoredPing) : null;
  } catch {
    last = null;
  }
  return last;
}

export async function clearLastPing() {
  last = null;
  try {
    await AsyncStorage.removeItem(LAST_PING_KEY);
  } catch {
    // ignore
  }
}

type Coords = { latitude: number; longitude: number; accuracy?: number | null };

/**
 * Sends the position to `track_ping`. Throttled so the foreground watcher and
 * the background task do not double-ping. Returns null when skipped/signed out.
 */
export async function sendPing(
  coords: Coords,
  opts: { force?: boolean; source?: 'background' | 'foreground' | 'manual' } = {},
): Promise<StoredPing | null> {
  const prev = await getLastPing();
  if (!opts.force && prev && Date.now() - prev.at < MIN_PING_GAP_MS) return prev;
  if (inflight) return inflight;

  inflight = (async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return null;
    const { data, error } = await supabase.rpc('track_ping', {
      p_lat: coords.latitude,
      p_lng: coords.longitude,
      p_accuracy: coords.accuracy ?? null,
    });
    if (error) throw error;
    const stored: StoredPing = { ...(data as PingResult), at: Date.now() };
    last = stored;
    try {
      await AsyncStorage.setItem(LAST_PING_KEY, JSON.stringify(stored));
    } catch {
      // storage is a cache only
    }
    listeners.forEach((l) => l(stored));
    // timer started or stopped → system notification (muted while the app is open)
    if (prev && prev.inside !== stored.inside) void notifyTrackingChange(stored.inside, stored.space_name);
    return stored;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
