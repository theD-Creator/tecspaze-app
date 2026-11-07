import { useEffect } from 'react';
import { AppState } from 'react-native';

/** User data is reloaded this often while the app is open. */
export const REFRESH_MS = 5 * 60_000;
/** Coming back to the app (unlock, tab visible again) reloads unless the last load was this recent. */
const RESUME_GAP_MS = 30_000;

/**
 * Calls `reload` every 5 minutes while the app is in the foreground, and right
 * after it comes back (screen unlocked / tab shown again). While the app is in the
 * background nothing is loaded – the first interaction afterwards catches up.
 */
export function useForegroundRefresh(reload: () => unknown, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let last = Date.now();
    const run = () => {
      last = Date.now();
      void reload();
    };
    const iv = setInterval(() => {
      if (AppState.currentState === 'active') run();
    }, REFRESH_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && Date.now() - last > RESUME_GAP_MS) run();
    });
    return () => {
      clearInterval(iv);
      sub.remove();
    };
  }, [reload, enabled]);
}
