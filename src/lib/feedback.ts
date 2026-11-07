// Bug reports & feature requests (shared shape for Tecspaze + Admin app).

export type FeedbackKind = 'bug' | 'feature';
export type FeedbackStatus = 'open' | 'planned' | 'in_progress' | 'done' | 'declined';
export type FeedbackSort = 'top' | 'new';

export type Feedback = {
  id: string;
  kind: FeedbackKind;
  title: string;
  body: string;
  status: FeedbackStatus;
  admin_note: string | null;
  device: string | null;
  vote_count: number;
  created_at: string;
  user_id: string;
  author_name: string | null;
  author_photo: string | null;
  voted: boolean;
};

export const STATUS_LABEL: Record<FeedbackStatus, string> = {
  open: 'Offen',
  planned: 'Geplant',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
  declined: 'Abgelehnt',
};

export const STATUS_COLOR: Record<FeedbackStatus, { bg: string; fg: string }> = {
  open: { bg: 'rgba(255,255,255,0.10)', fg: '#E8ECFF' },
  planned: { bg: 'rgba(111,113,160,0.35)', fg: '#D6D8FF' },
  in_progress: { bg: 'rgba(0,190,210,0.22)', fg: '#7FE9F5' },
  done: { bg: 'rgba(61,220,151,0.20)', fg: '#3DDC97' },
  declined: { bg: 'rgba(255,90,110,0.16)', fg: '#FF8C9A' },
};

export const KIND_META: Record<FeedbackKind, { label: string; plural: string; icon: 'bug' | 'bulb' }> = {
  bug: { label: 'Bug', plural: 'Bugs', icon: 'bug' },
  feature: { label: 'Feature', plural: 'Features', icon: 'bulb' },
};

/** Optimistic vote toggle on a list (pure, unit-tested). */
export function toggleVoteLocal(list: Feedback[], id: string): Feedback[] {
  return list.map((f) =>
    f.id === id ? { ...f, voted: !f.voted, vote_count: Math.max(0, f.vote_count + (f.voted ? -1 : 1)) } : f,
  );
}

/** Validation for the create form; null when OK. */
export function feedbackError(title: string, body: string, kind: FeedbackKind): string | null {
  const t = title.trim();
  if (t.length < 3) return 'Der Titel braucht mindestens 3 Zeichen.';
  if (t.length > 120) return 'Der Titel darf höchstens 120 Zeichen haben.';
  if (body.length > 4000) return 'Die Beschreibung ist zu lang.';
  if (kind === 'bug' && body.trim().length < 10) return 'Beschreib kurz, was passiert ist (mind. 10 Zeichen).';
  return null;
}
