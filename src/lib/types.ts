export type Role = 'user' | 'mitarbeiter' | 'helping_hands' | 'moderator' | 'admin' | 'global_admin';

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  photo: string | null;
  bio: string | null;
  role: Role;
  verified: boolean;
  banned_at: string | null;
  created_at: string;
};

export type PingResult = {
  inside: boolean;
  distance_m: number;
  space_id: string | null;
  space_name: string | null;
  radius_m: number | null;
  session_id: string | null;
  started_at: string | null;
};

export type MyStats = {
  day: number;
  week: number;
  month: number;
  all: number;
  sessions: number;
  streak: number;
  current: { id: string; started_at: string; space_id: string } | null;
};

export type DailyRow = { day: string; seconds: number };

export type Period = 'day' | 'week' | 'month' | 'all';

export type LeaderRow = {
  user_id: string;
  display_name: string | null;
  photo: string | null;
  role: Role;
  verified: boolean;
  total_seconds: number;
  is_present: boolean;
  rank: number;
};

export type Author = Pick<Profile, 'id' | 'display_name' | 'photo' | 'role' | 'verified'>;

export type Post = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: Author | null;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: Author | null;
};

export type Space = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  active: boolean;
};
