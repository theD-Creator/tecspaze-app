import { useCallback, useMemo, useState } from 'react';

import { DEMO } from '@/lib/demo';
import { toggleVoteLocal, type Feedback, type FeedbackKind, type FeedbackSort } from '@/lib/feedback';
import { supabase } from '@/lib/supabase';

import { useAsync } from './data';

const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();

const demoFeedback: Feedback[] = [
  {
    id: 'f1',
    kind: 'feature',
    title: 'Helles Design zum Umschalten',
    body: 'Wäre cool, wenn man auch ein helles Design wählen kann.',
    status: 'planned',
    admin_note: 'Kommt mit einem der nächsten Updates.',
    device: null,
    vote_count: 14,
    created_at: ago(50),
    user_id: 'u1',
    author_name: 'Mila Schneider',
    author_photo: null,
    voted: true,
  },
  {
    id: 'f2',
    kind: 'feature',
    title: 'Wochen-Challenges mit Badges',
    body: 'Zum Beispiel 10 Stunden in einer Woche gibt ein Badge.',
    status: 'open',
    admin_note: null,
    device: null,
    vote_count: 9,
    created_at: ago(5),
    user_id: 'u2',
    author_name: 'Jonas K.',
    author_photo: null,
    voted: false,
  },
  {
    id: 'f3',
    kind: 'bug',
    title: 'Timer springt nach dem Entsperren',
    body: 'Nach dem Entsperren zeigt der Timer kurz 00:00 an und springt dann auf die richtige Zeit.',
    status: 'in_progress',
    admin_note: 'Wir schauen es uns an.',
    device: 'android · 1.0.0',
    vote_count: 4,
    created_at: ago(20),
    user_id: 'u3',
    author_name: 'Lea Wagner',
    author_photo: null,
    voted: false,
  },
];

export function useFeedback(kind: FeedbackKind, sort: FeedbackSort) {
  const res = useAsync<Feedback[]>(async () => {
    if (DEMO) return demoFeedback.filter((f) => f.kind === kind);
    const { data, error } = await supabase.rpc('feedback_list', { p_kind: kind, p_sort: sort });
    if (error) throw error;
    return (data as Feedback[]).map((f) => ({ ...f, vote_count: Number(f.vote_count) }));
  }, [kind, sort]);

  // optimistic layer; dropped automatically when a fresh list arrives
  const [local, setLocal] = useState<{ base: Feedback[] | null; list: Feedback[] } | null>(null);
  const list = useMemo(() => (local && local.base === res.data ? local.list : (res.data ?? [])), [local, res.data]);

  const toggleVote = useCallback(
    async (id: string) => {
      const before = list;
      const base = res.data;
      setLocal({ base, list: toggleVoteLocal(before, id) });
      if (DEMO) return;
      const { data, error } = await supabase.rpc('feedback_toggle_vote', { p_id: id });
      if (error) {
        setLocal({ base, list: before });
        return;
      }
      setLocal((l) => (l ? { ...l, list: l.list.map((f) => (f.id === id ? { ...f, vote_count: Number(data) } : f)) } : l));
    },
    [list, res.data],
  );

  return { ...res, list, toggleVote };
}

export async function createFeedback(kind: FeedbackKind, title: string, body: string, device: string): Promise<string | null> {
  if (DEMO) return null;
  const { error } = await supabase.rpc('feedback_create', {
    p_kind: kind,
    p_title: title.trim(),
    p_body: body.trim(),
    p_device: device,
  });
  return error ? error.message : null;
}

export async function deleteFeedback(id: string): Promise<string | null> {
  if (DEMO) return null;
  const { error } = await supabase.rpc('feedback_delete', { p_id: id });
  return error ? error.message : null;
}
