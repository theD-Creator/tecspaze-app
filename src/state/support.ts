import { useCallback, useEffect, useState } from 'react';

import { DEMO } from '@/lib/demo';
import { APP_ID } from '@/lib/notify';
import { mergeMessage, type SupportMessage, type SupportThread } from '@/lib/support';
import { supabase } from '@/lib/supabase';

import { useAsync } from './data';
import { setActiveThread } from './inbox';

const demoThreads: SupportThread[] = [
  {
    id: 'demo-t1',
    subject: 'Timer springt nach dem Entsperren',
    status: 'open',
    feedback_id: 'f3',
    unread: 1,
    last_message_at: new Date(Date.now() - 36e5).toISOString(),
    last_body: 'Danke für die Meldung! Ist mit dem nächsten Update behoben.',
    last_from_team: true,
  },
];

export function useMyThreads() {
  return useAsync<SupportThread[]>(async () => {
    if (DEMO) return demoThreads;
    const { data, error } = await supabase.rpc('support_my_threads', { p_app: APP_ID });
    if (error) throw error;
    return data as SupportThread[];
  }, []);
}

type ThreadMeta = { id: string; subject: string; status: 'open' | 'closed'; feedback_id: string | null };

async function fetchChat(tid: string) {
  const [m, t] = await Promise.all([
    supabase.rpc('support_messages_list', { p_thread: tid }),
    supabase.from('support_threads').select('id, subject, status, feedback_id').eq('id', tid).maybeSingle(),
  ]);
  void supabase.rpc('support_mark_read', { p_thread: tid });
  return { messages: m.error ? null : (m.data as SupportMessage[]), meta: (t.data as ThreadMeta | null) ?? null };
}

/**
 * One chat. `id` may be 'new': then the chat of `feedbackId` (or the open general
 * support chat) is looked up and created with the first message.
 */
export function useChat(id: string, feedbackId: string | null, subject: string | null) {
  const [threadId, setThreadId] = useState<string | null>(id === 'new' ? null : id);
  const [meta, setMeta] = useState<ThreadMeta | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(!DEMO);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((r: Awaited<ReturnType<typeof fetchChat>>) => {
    if (r.messages) setMessages(r.messages);
    else setError('Chat konnte nicht geladen werden.');
    if (r.meta) setMeta(r.meta);
    setLoading(false);
  }, []);
  const load = useCallback(
    (tid: string) =>
      fetchChat(tid)
        .then(apply)
        .catch(() => null),
    [apply],
  );

  // resolve 'new' → existing thread if there is one
  useEffect(() => {
    if (DEMO) return;
    if (threadId) {
      fetchChat(threadId)
        .then(apply)
        .catch(() => null);
      return;
    }
    let alive = true;
    (async () => {
      let q = supabase.from('support_threads').select('id').eq('app', APP_ID);
      q = feedbackId ? q.eq('feedback_id', feedbackId) : q.is('feedback_id', null).eq('status', 'open');
      const { data } = await q.order('last_message_at', { ascending: false }).limit(1).maybeSingle();
      if (!alive) return;
      if (data?.id) setThreadId(data.id as string);
      else setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      alive = false;
    };
  }, [threadId, feedbackId, apply]);

  // live messages + no popup for this chat while it's open
  useEffect(() => {
    if (!threadId || DEMO) return;
    setActiveThread(threadId);
    const ch = supabase
      .channel(`chat-${threadId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `thread_id=eq.${threadId}` },
        () => void load(threadId),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_threads', filter: `id=eq.${threadId}` },
        (p) => setMeta((m) => (m ? { ...m, ...(p.new as Partial<ThreadMeta>) } : m)),
      )
      .subscribe();
    return () => {
      setActiveThread(null);
      supabase.removeChannel(ch);
    };
  }, [threadId, load]);

  const send = useCallback(
    async (body: string, me: { id: string; name: string | null; photo: string | null }): Promise<string | null> => {
      const text = body.trim();
      const temp: SupportMessage = {
        id: `tmp-${Date.now()}`,
        from_team: false,
        kind: 'message',
        body: text,
        created_at: new Date().toISOString(),
        sender_id: me.id,
        sender_name: me.name,
        sender_photo: me.photo,
      };
      if (DEMO) {
        setMessages((list) => mergeMessage(list, { ...temp, id: `demo-${temp.id}` }));
        return null;
      }
      setMessages((list) => mergeMessage(list, temp));
      const res = threadId
        ? await supabase.rpc('support_send', { p_thread: threadId, p_body: text })
        : await supabase.rpc('support_start', {
            p_app: APP_ID,
            p_body: text,
            p_feedback: feedbackId,
            p_subject: subject,
          });
      if (res.error) {
        setMessages((list) => list.filter((m) => m.id !== temp.id));
        return res.error.message.includes('Zu viele') ? res.error.message : 'Nachricht konnte nicht gesendet werden.';
      }
      if (threadId) void load(threadId);
      else setThreadId(res.data as string);
      return null;
    },
    [threadId, feedbackId, subject, load],
  );

  return { threadId, meta, messages, loading, error, send };
}
