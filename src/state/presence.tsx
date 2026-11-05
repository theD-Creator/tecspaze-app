import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { DEMO, demoPing } from '@/lib/demo';
import { getLastPing, onPing, type StoredPing } from '@/lib/ping';
import {
  disableTracking,
  enableTracking,
  getPermissionLevel,
  isTrackingEnabled,
  pingNow,
  startBackground,
  watchForeground,
  type PermissionLevel,
} from '@/lib/tracking';

import { useAuth } from './auth';
import { useNow } from './data';

type PresenceState = {
  enabled: boolean;
  permission: PermissionLevel;
  ping: StoredPing | null;
  /** true while the server says we are inside the Tecspaze */
  inside: boolean;
  /** start of the running session (ms epoch) */
  sessionStart: number | null;
  error: string | null;
  busy: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  refresh: () => Promise<void>;
};

const PresenceContext = createContext<PresenceState | null>(null);

// A ping older than this is not trusted to say "inside" (server window is 20 min).
const STALE_MS = 20 * 60_000;

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [permission, setPermission] = useState<PermissionLevel>(DEMO ? 'always' : 'undetermined');
  const [rawPing, setPing] = useState<StoredPing | null>(() => (DEMO ? demoPing() : null));
  const now = useNow(30_000);
  // Signed out → no presence (avoids a setState-in-effect reset).
  const ping = session ? rawPing : null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const stopWatch = useRef<null | (() => void)>(null);

  useEffect(() => onPing(setPing), []);

  type SyncResult = { on: boolean; level: PermissionLevel; error: string | null };

  /** Talks to the OS/location service only; state is applied by the caller. */
  const syncTracking = useCallback(async (): Promise<SyncResult | null> => {
    if (!session || DEMO) return null;
    const on = await isTrackingEnabled();
    const level = await getPermissionLevel();
    stopWatch.current?.();
    stopWatch.current = null;
    if (!on || level === 'denied' || level === 'undetermined') return { on, level, error: null };
    try {
      if (level === 'always') await startBackground();
      else stopWatch.current = await watchForeground();
      await pingNow(false);
      return { on, level, error: null };
    } catch (e) {
      return { on, level, error: e instanceof Error ? e.message : 'Standort nicht verfügbar' };
    }
  }, [session]);

  const applySync = useCallback((r: SyncResult | null) => {
    if (!r) return;
    setEnabled(r.on);
    setPermission(r.level);
    setError(r.error);
  }, []);

  const ensureRunning = useCallback(async () => applySync(await syncTracking()), [syncTracking, applySync]);

  useEffect(() => {
    getLastPing().then((p) => p && setPing(p));
    syncTracking().then(applySync);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') syncTracking().then(applySync);
    });
    return () => {
      sub.remove();
      stopWatch.current?.();
      stopWatch.current = null;
    };
  }, [syncTracking, applySync]);

  const value = useMemo<PresenceState>(() => {
    const fresh = ping && now - ping.at < STALE_MS;
    const inside = Boolean(enabled && fresh && ping?.inside && ping.started_at);
    return {
      enabled,
      permission,
      ping,
      inside,
      sessionStart: inside && ping?.started_at ? new Date(ping.started_at).getTime() : null,
      error,
      busy,
      async enable() {
        setBusy(true);
        try {
          const level = await enableTracking();
          setPermission(level);
          setEnabled(true);
          if (level === 'denied') setError('Standort-Zugriff wurde abgelehnt.');
          else await ensureRunning();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Fehler beim Aktivieren');
        } finally {
          setBusy(false);
        }
      },
      async disable() {
        setBusy(true);
        try {
          stopWatch.current?.();
          stopWatch.current = null;
          await disableTracking();
          setEnabled(false);
          setPing(null);
        } finally {
          setBusy(false);
        }
      },
      async refresh() {
        try {
          await pingNow(true);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Standort nicht verfügbar');
        }
      },
    };
  }, [enabled, permission, ping, now, error, busy, ensureRunning]);

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error('usePresence must be used inside PresenceProvider');
  return ctx;
}

export const backgroundSupported = Platform.OS !== 'web';
