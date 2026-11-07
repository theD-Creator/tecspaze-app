import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEMO } from '@/lib/demo';
import {
  APP_ID,
  configureNotifications,
  enableNotifications,
  markInboxSeen,
  notifications as nativeNotifications,
  routeForNotification,
  type PushState,
} from '@/lib/notify';
import { prependUnique, shouldPopUp, type AppNotification } from '@/lib/support';
import { useForegroundRefresh } from '@/lib/refresh';
import { supabase } from '@/lib/supabase';

import { useAuth } from './auth';

const ASKED_KEY = 'tecspaze:notifyAsked';

// the chat that's on screen right now (no popup for it, and it's marked read live)
let activeThread: string | null = null;
export function setActiveThread(id: string | null) {
  activeThread = id;
}

type Inbox = {
  items: AppNotification[];
  unread: number;
  supportUnread: number;
  popup: AppNotification | null;
  dismissPopup: () => void;
  push: PushState | null;
  enablePush: () => Promise<PushState>;
  markAllRead: () => Promise<void>;
  reload: () => Promise<void>;
};

const Ctx = createContext<Inbox | null>(null);

type Fetched = { items: AppNotification[] | null; support: number | null };
async function fetchInbox(uid: string): Promise<Fetched> {
  const [n, t] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, app, kind, title, body, data, read_at, created_at')
      .eq('app', APP_ID)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('support_threads').select('user_unread').eq('user_id', uid).eq('app', APP_ID),
  ]);
  return {
    items: n.error ? null : (n.data as AppNotification[]),
    support: t.error ? null : (t.data as { user_unread: number }[]).reduce((a, r) => a + r.user_unread, 0),
  };
}

export function InboxProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const [items, setItems] = useState<AppNotification[]>([]);
  const [supportUnread, setSupportUnread] = useState(0);
  const [popup, setPopup] = useState<AppNotification | null>(null);
  const [push, setPush] = useState<PushState | null>(null);

  const apply = useCallback((r: Fetched) => {
    if (r.items) setItems(r.items);
    if (r.support !== null) setSupportUnread(r.support);
  }, []);
  const reload = useCallback(async () => {
    if (uid && !DEMO) apply(await fetchInbox(uid));
  }, [uid, apply]);

  // initial load + live updates
  useEffect(() => {
    if (!uid || DEMO) return;
    fetchInbox(uid)
      .then(apply)
      .catch(() => null);
    const ch = supabase
      .channel(`inbox-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          const n = payload.new as AppNotification;
          if (n.app !== APP_ID) return;
          setItems((list) => prependUnique(list, n));
          if (shouldPopUp(n, APP_ID, activeThread)) setPopup(n);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((list) => list.map((x) => (x.id === n.id ? n : x)));
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_threads', filter: `user_id=eq.${uid}` },
        () => {
          fetchInbox(uid)
            .then(apply)
            .catch(() => null);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, apply]);

  // notifications permission + push token (asked once per install, silently refreshed later)
  useEffect(() => {
    if (!uid || DEMO) return;
    let alive = true;
    (async () => {
      await configureNotifications();
      const asked = await AsyncStorage.getItem(ASKED_KEY).catch(() => '1');
      const state = await enableNotifications(!asked);
      if (!asked) await AsyncStorage.setItem(ASKED_KEY, '1').catch(() => null);
      if (alive) setPush(state);
    })().catch(() => null);
    return () => {
      alive = false;
    };
  }, [uid]);

  // tapping a system notification opens the right screen (also from a cold start)
  useEffect(() => {
    const N = nativeNotifications();
    if (!N || !uid) return;
    const open = (data: Record<string, unknown> | undefined) => {
      const to = routeForNotification(data);
      if (to) setTimeout(() => router.push(to as never), 50);
    };
    N.getLastNotificationResponseAsync()
      .then((r) => {
        if (r) {
          open(r.notification.request.content.data as Record<string, unknown>);
          N.clearLastNotificationResponseAsync?.().catch(() => null);
        }
      })
      .catch(() => null);
    const sub = N.addNotificationResponseReceivedListener((r) =>
      open(r.notification.request.content.data as Record<string, unknown>),
    );
    return () => sub.remove();
  }, [uid]);

  useForegroundRefresh(reload, Boolean(uid));

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((x) => (x.read_at ? x : { ...x, read_at: new Date().toISOString() })));
    await markInboxSeen();
    await supabase.rpc('notifications_mark_read', { p_ids: null });
  }, []);

  // nothing from a previous account is shown after signing out
  const visibleSupport = uid ? supportUnread : 0;
  const value = useMemo<Inbox>(() => {
    const visible = uid ? items : [];
    return {
      items: visible,
      unread: visible.filter((x) => !x.read_at).length,
      supportUnread: visibleSupport,
      popup,
      dismissPopup: () => setPopup(null),
      push,
      enablePush: async () => {
        const s = await enableNotifications(true);
        setPush(s);
        return s;
      },
      markAllRead,
      reload,
    };
  }, [uid, items, visibleSupport, popup, push, markAllRead, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInbox() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInbox outside InboxProvider');
  return v;
}
