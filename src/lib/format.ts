// Pure formatting helpers (unit-tested in __tests__/format.test.ts).

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

/** 3725 → "01:02:05" */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`;
}

/** 3725 → "1 h 02 min", 125 → "2 min", 20 → "< 1 min" */
export function duration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0 && m === 0) return s > 0 ? '< 1 min' : '0 min';
  if (h === 0) return `${m} min`;
  return `${h} h ${pad(m)} min`;
}

/** Compact hours for big numbers: 45000 → "12,5 h" */
export function hours(totalSeconds: number): string {
  const h = Math.max(0, totalSeconds) / 3600;
  const v = h >= 100 ? Math.round(h).toString() : h.toFixed(1).replace('.', ',');
  return `${v} h`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Gute Nacht';
  if (h < 11) return 'Guten Morgen';
  if (h < 14) return 'Mahlzeit';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export function weekdayShort(isoDay: string): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) {
    const d = Math.floor(diff / 86400);
    return d === 1 ? 'gestern' : `vor ${d} Tagen`;
  }
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '?';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? '');
  return (first + second).toUpperCase();
}

export function distanceLabel(m: number): string {
  if (m < 0) return '–';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

export const ROLE_LABEL: Record<string, string> = {
  user: 'Member',
  mitarbeiter: 'Team',
  helping_hands: 'Helping Hands',
  moderator: 'Moderator',
  admin: 'Admin',
  global_admin: 'Global Admin',
};
