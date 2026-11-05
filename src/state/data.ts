import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { DEMO, demoDaily, demoLeaderboard, demoPosts, demoStats } from '@/lib/demo';
import { onPing } from '@/lib/ping';
import { supabase } from '@/lib/supabase';
import type { Comment, DailyRow, LeaderRow, MyStats, Period, Post } from '@/lib/types';

import { useAuth } from './auth';

type Async<T> = { data: T | null; loading: boolean; error: string | null; fetchedAt: number; reload: () => Promise<void> };

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): Async<T> {
  const [state, setState] = useState<Omit<Async<T>, 'reload'>>(() => ({
    data: null,
    loading: true,
    error: null,
    fetchedAt: Date.now(),
  }));
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const run = useCallback(
    () =>
      fnRef.current().then(
        (data) => ({ data, error: null as string | null }),
        (e: unknown) => ({ data: undefined, error: e instanceof Error ? e.message : 'Laden fehlgeschlagen' }),
      ),
    [],
  );

  const apply = useCallback((r: { data: T | undefined; error: string | null }) => {
    setState((s) => ({
      data: r.data === undefined ? s.data : r.data,
      error: r.error,
      loading: false,
      fetchedAt: r.data === undefined ? s.fetchedAt : Date.now(),
    }));
  }, []);

  const reload = useCallback(async () => {
    apply(await run());
  }, [run, apply]);

  useEffect(() => {
    let alive = true;
    run().then((r) => {
      if (alive) apply(r);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass their own dependency list
  }, deps);

  return { ...state, reload };
}

/** Debounced reload whenever any time_session row changes (live leaderboard). */
function useSessionRealtime(channel: string, reload: () => void) {
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (t) clearTimeout(t);
      t = setTimeout(reload, 1200);
    };
    const ch = supabase
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_sessions' }, bump)
      .subscribe();
    const off = onPing(bump);
    return () => {
      if (t) clearTimeout(t);
      off();
      supabase.removeChannel(ch);
    };
  }, [channel, reload]);
}

export function useMyStats() {
  const { session } = useAuth();
  const res = useAsync<MyStats>(async () => {
    if (DEMO) return demoStats;
    const { data, error } = await supabase.rpc('get_my_stats');
    if (error) throw error;
    return data as MyStats;
  }, [session?.user.id]);
  const { reload } = res;
  useEffect(() => onPing(() => reload()), [reload]);
  return res;
}

export function useMyDaily(days = 7) {
  const { session } = useAuth();
  const res = useAsync<DailyRow[]>(async () => {
    if (DEMO) return demoDaily(days);
    const { data, error } = await supabase.rpc('get_my_daily', { p_days: days });
    if (error) throw error;
    return (data as DailyRow[]).map((r) => ({ day: r.day, seconds: Number(r.seconds) }));
  }, [session?.user.id, days]);
  const { reload } = res;
  useEffect(() => onPing(() => reload()), [reload]);
  return res;
}

export function useLeaderboard(period: Period, limit = 100) {
  const res = useAsync<LeaderRow[]>(async () => {
    if (DEMO)
      return demoLeaderboard().map((r) => ({
        ...r,
        total_seconds: Math.round(r.total_seconds * ({ day: 0.08, week: 0.4, month: 1, all: 3 } as const)[period]),
      }));
    const { data, error } = await supabase.rpc('get_leaderboard', { p_period: period, p_limit: limit });
    if (error) throw error;
    return (data as LeaderRow[]).map((r) => ({ ...r, total_seconds: Number(r.total_seconds), rank: Number(r.rank) }));
  }, [period, limit]);
  useSessionRealtime(`lb-${period}-${limit}`, res.reload);
  return res;
}

const POST_SELECT = '*, author:profiles!posts_user_id_fkey(id, display_name, photo, role, verified)';

export function usePosts() {
  const { session } = useAuth();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const res = useAsync<Post[]>(async () => {
    if (DEMO) return demoPosts;
    const { data, error } = await supabase.from('posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    const uid = session?.user.id;
    if (uid) {
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', uid);
      setLiked(new Set((likes ?? []).map((l) => l.post_id as string)));
    }
    return data as Post[];
  }, [session?.user.id]);

  const reloadFeed = res.reload;
  useEffect(() => {
    const ch = supabase
      .channel('feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => reloadFeed())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [reloadFeed]);

  const toggleLike = useCallback(
    async (postId: string) => {
      const uid = session?.user.id;
      if (!uid) return;
      const was = liked.has(postId);
      // optimistic update
      setLiked((s) => {
        const n = new Set(s);
        if (was) n.delete(postId);
        else n.add(postId);
        return n;
      });
      const { error } = was
        ? await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', uid)
        : await supabase.from('post_likes').insert({ post_id: postId, user_id: uid });
      if (error) {
        setLiked((s) => {
          const n = new Set(s);
          if (was) n.add(postId);
          else n.delete(postId);
          return n;
        });
      }
    },
    [liked, session?.user.id],
  );

  return { ...res, liked, toggleLike };
}

export function usePost(id: string) {
  return useAsync<{ post: Post; comments: Comment[] }>(async () => {
    if (DEMO) {
      const post = demoPosts.find((p) => p.id === id) ?? demoPosts[0];
      return { post, comments: [] };
    }
    const [{ data: post, error }, { data: comments, error: cErr }] = await Promise.all([
      supabase.from('posts').select(POST_SELECT).eq('id', id).single(),
      supabase
        .from('comments')
        .select('*, author:profiles!comments_user_id_fkey(id, display_name, photo, role, verified)')
        .eq('post_id', id)
        .order('created_at', { ascending: true }),
    ]);
    if (error) throw error;
    if (cErr) throw cErr;
    return { post: post as Post, comments: (comments ?? []) as Comment[] };
  }, [id]);
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
