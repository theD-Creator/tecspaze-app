// "Was ist neu" – newest first. The first entry is the version shown in the app.
// Bump it with every live update (EAS Update), so users see that something changed.
// The native APK version (app.json) stays the same until a new APK is needed.

export type ChangelogEntry = { version: string; date: string; title: string; items: string[] };

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.4.0',
    date: '2026-11-07',
    title: 'Support-Chat & Mitteilungen',
    items: [
      'Neu: Support-Chat – schreib dem Team direkt (Profil → Support-Chat)',
      'Antwortet das Team auf deinen Bug oder deine Idee, öffnet sich sofort der Support-Modus',
      'Neu: Mitteilungen – Antworten vom Team und Updates landen in der Glocke auf dem Start-Screen',
      'Mitteilung, wenn deine Zeit im Tecspaze startet oder stoppt (im Profil abschaltbar)',
      'Push-Mitteilungen auf dem Sperrbildschirm mit der neuen App-Version',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-11-07',
    title: 'Euer Feedback umgesetzt',
    items: [
      'Neu: „Was ist neu“ – hier siehst du nach jedem Update, was dazukam',
      'Die Versionsnummer zählt jetzt bei jedem Update hoch',
      'Neu: „Weniger Animationen“ im Profil – das Intro läuft nur noch einmal pro Version',
      'Fix: Große Emojis wurden auf Android abgeschnitten',
      'Fix: Die Tastatur verdeckt keine Eingabefelder mehr',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-11-07',
    title: 'Ideen & Bugs',
    items: [
      'Bugs melden und Features wünschen im Profil',
      'Für Ideen abstimmen – die beliebtesten bauen wir zuerst',
      'Status und Antworten vom Team direkt am Eintrag',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-11-06',
    title: 'Tecspaze überall',
    items: [
      'Tecspaze als Web-App fürs iPhone und den Computer: tecspaze.expo.app',
      'Am Computer läuft der Timer live mit – gemessen wird nur am Handy',
      'Team-Mitglieder bekommen ihr Mitarbeiterfoto automatisch',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-06',
    title: 'Willkommen bei Tecspaze',
    items: ['Automatischer Timer per Standort', 'Live-Rangliste mit Podium', 'Community-Beiträge mit Likes und Kommentaren'],
  },
];

export const APP_VERSION = CHANGELOG[0].version;

/** "1.2.0" < "1.10.0" aware comparison; returns <0, 0, >0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Entries the user hasn't seen yet (newer than `lastSeen`). Empty on first install. */
export function unseenEntries(lastSeen: string | null, list: ChangelogEntry[] = CHANGELOG): ChangelogEntry[] {
  if (!lastSeen) return [];
  return list.filter((e) => compareVersions(e.version, lastSeen) > 0);
}
