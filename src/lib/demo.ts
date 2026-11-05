// Dev-only demo data for visual testing in the browser (`?demo=1`).
// `__DEV__` is false in release builds, so none of this ships.
import { Platform } from 'react-native';

import type { DailyRow, LeaderRow, MyStats, Post, Profile } from './types';

export const DEMO =
  __DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && /[?&]demo=1/.test(window.location.search);

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

export const demoProfile: Profile = {
  id: 'demo-me',
  email: 'demo@tecspaze.local',
  display_name: 'Ariyan Demo',
  photo: null,
  bio: 'Baut Roboter und trinkt zu viel Mate.',
  role: 'global_admin',
  verified: true,
  banned_at: null,
  created_at: iso(86400_000 * 40),
};

export const demoStats: MyStats = {
  day: 2 * 3600 + 14 * 60,
  week: 11 * 3600 + 30 * 60,
  month: 38 * 3600,
  all: 142 * 3600,
  sessions: 57,
  streak: 4,
  current: { id: 's1', started_at: iso(47 * 60_000), space_id: 'sp' },
};

export function demoDaily(days: number): DailyRow[] {
  const vals = [1.2, 3.1, 0.4, 2.6, 4.2, 1.8, 2.23];
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * 86400_000);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { day, seconds: Math.round((vals[i % vals.length] ?? 1) * 3600) };
  });
}

const NAMES: [string, number, boolean, LeaderRow['role']][] = [
  ['Mila Schneider', 31.5, true, 'mitarbeiter'],
  ['Jonas K.', 27.2, false, 'user'],
  ['Ariyan Demo', 24.9, true, 'global_admin'],
  ['Lea Wagner', 19.4, true, 'helping_hands'],
  ['Tim Becker', 15.1, false, 'user'],
  ['Sofia', 11.8, false, 'user'],
  ['Noah Fischer', 8.3, true, 'user'],
  ['Emma L.', 4.6, false, 'moderator'],
  ['Ben', 1.2, false, 'user'],
];

export function demoLeaderboard(): LeaderRow[] {
  return NAMES.map(([name, h, present, role], i) => ({
    user_id: name === 'Ariyan Demo' ? 'demo-me' : `u${i}`,
    display_name: name,
    photo: null,
    role,
    verified: role !== 'user',
    total_seconds: Math.round(h * 3600),
    is_present: present,
    rank: i + 1,
  }));
}

export const demoPosts: Post[] = [
  {
    id: 'p1',
    user_id: 'demo-me',
    title: 'Hackathon am Freitag 🚀',
    content:
      'Am Freitag ab 16 Uhr steigt unser erster Tecspaze-Hackathon. Bringt Ideen, Laptops und gute Laune mit – für Pizza ist gesorgt. Die Top 3 der Wochen-Rangliste bekommen exklusive Sticker!',
    image_url: null,
    like_count: 12,
    comment_count: 4,
    created_at: iso(3 * 3600_000),
    author: { id: 'demo-me', display_name: 'Ariyan Demo', photo: null, role: 'global_admin', verified: true },
  },
  {
    id: 'p2',
    user_id: 'demo-me',
    title: 'Neue 3D-Drucker sind da',
    content: 'Ab sofort stehen zwei neue Drucker im Maker-Bereich. Einweisung jeden Dienstag um 17 Uhr.',
    image_url: null,
    like_count: 7,
    comment_count: 1,
    created_at: iso(2 * 86400_000),
    author: { id: 'demo-me', display_name: 'Ariyan Demo', photo: null, role: 'global_admin', verified: true },
  },
];

export function demoPing() {
  return {
    inside: true,
    distance_m: 12,
    space_id: 'sp',
    space_name: 'Tecspaze',
    radius_m: 120,
    session_id: 's1',
    started_at: new Date(Date.now() - 47 * 60_000).toISOString(),
    at: Date.now(),
  };
}
