import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ReducedMotionConfig, ReduceMotion, useReducedMotion as useSystemReducedMotion } from 'react-native-reanimated';

const KEY = 'tecspaze:reduceMotion';

type MotionState = {
  /** user switch in Profil → "Weniger Animationen" */
  preferReduced: boolean;
  setPreferReduced: (v: boolean) => void;
  /** effective value: user switch OR the phone's accessibility setting */
  reduced: boolean;
  /** preference has been read from storage */
  ready: boolean;
};

const MotionContext = createContext<MotionState | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const system = useSystemReducedMotion();
  const [preferReduced, setPref] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setPref(v === '1'))
      .catch(() => null)
      .finally(() => setReady(true));
  }, []);

  const setPreferReduced = useCallback((v: boolean) => {
    setPref(v);
    AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => null);
  }, []);

  const reduced = preferReduced || system;
  const value = useMemo(
    () => ({ preferReduced, setPreferReduced, reduced, ready }),
    [preferReduced, setPreferReduced, reduced, ready],
  );

  return (
    <MotionContext.Provider value={value}>
      {/* switches off entering/exiting/layout animations app-wide */}
      <ReducedMotionConfig mode={reduced ? ReduceMotion.Always : ReduceMotion.System} />
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error('useMotion must be used inside MotionProvider');
  return ctx;
}

/** Drop-in for Reanimated's hook that also honours the in-app switch. */
export function useReducedMotion(): boolean {
  const ctx = useContext(MotionContext);
  const system = useSystemReducedMotion();
  return ctx ? ctx.reduced : system;
}
