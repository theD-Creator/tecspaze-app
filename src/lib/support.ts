// Support chat + notification inbox (shared shape for Tecspaze, Universe and the Admin app).

export type SupportThread = {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  feedback_id: string | null;
  unread: number;
  last_message_at: string;
  last_body: string | null;
  last_from_team: boolean | null;
};

export type SupportMessage = {
  id: string;
  from_team: boolean;
  kind: 'message' | 'status';
  body: string;
  created_at: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_photo: string | null;
};

export type AppNotification = {
  id: string;
  app: string;
  kind: 'team_reply' | 'status' | 'update' | 'info';
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export const NOTIFICATION_ICON: Record<AppNotification['kind'], { icon: string; color: string }> = {
  team_reply: { icon: 'chatbubbles', color: '#F0962D' },
  status: { icon: 'flag', color: '#00BED2' },
  update: { icon: 'sparkles', color: '#3DDC97' },
  info: { icon: 'megaphone', color: '#9C8CFF' },
};

/** Thread id a notification belongs to (team replies / status changes). */
export const threadOf = (n: { data?: Record<string, unknown> | null }): string | null =>
  typeof n.data?.thread_id === 'string' ? n.data.thread_id : null;

/** The in-app "support mode" popup shows team answers, but not for the chat you're already reading. */
export function shouldPopUp(n: Pick<AppNotification, 'kind' | 'data' | 'app'>, app: string, activeThread: string | null) {
  if (n.app !== app) return false;
  if (n.kind !== 'team_reply' && n.kind !== 'status') return false;
  const t = threadOf(n);
  return t !== null && t !== activeThread;
}

/** Adds a realtime row to a newest-first list without duplicates. */
export function prependUnique<T extends { id: string }>(list: T[], row: T, max = 50): T[] {
  return [row, ...list.filter((x) => x.id !== row.id)].slice(0, max);
}

/** Appends a chat message (realtime or optimistic) keeping chronological order and no duplicates. */
export function mergeMessage(list: SupportMessage[], m: SupportMessage): SupportMessage[] {
  if (list.some((x) => x.id === m.id)) return list.map((x) => (x.id === m.id ? { ...x, ...m } : x));
  return [...list, m].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** Whether to print a day separator above message i. */
export function startsNewDay(list: SupportMessage[], i: number): boolean {
  if (i === 0) return true;
  return list[i - 1].created_at.slice(0, 10) !== list[i].created_at.slice(0, 10);
}

export function chatError(body: string): string | null {
  const t = body.trim();
  if (!t) return 'Schreib zuerst eine Nachricht.';
  if (t.length > 4000) return 'Die Nachricht ist zu lang (max. 4000 Zeichen).';
  return null;
}
