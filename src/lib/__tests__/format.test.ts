import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clock, distanceLabel, duration, greeting, hours, initials, relativeTime, weekdayShort } from '../format.ts';

test('clock pads hours, minutes and seconds', () => {
  assert.equal(clock(0), '00:00:00');
  assert.equal(clock(3725), '01:02:05');
  assert.equal(clock(-5), '00:00:00');
  assert.equal(clock(100 * 3600), '100:00:00');
});

test('duration is human friendly', () => {
  assert.equal(duration(0), '0 min');
  assert.equal(duration(20), '< 1 min');
  assert.equal(duration(125), '2 min');
  assert.equal(duration(3725), '1 h 02 min');
});

test('hours uses German decimal comma', () => {
  assert.equal(hours(45000), '12,5 h');
  assert.equal(hours(0), '0,0 h');
  assert.equal(hours(400 * 3600), '400 h');
});

test('greeting by time of day', () => {
  assert.equal(greeting(new Date(2026, 0, 1, 3)), 'Gute Nacht');
  assert.equal(greeting(new Date(2026, 0, 1, 8)), 'Guten Morgen');
  assert.equal(greeting(new Date(2026, 0, 1, 12)), 'Mahlzeit');
  assert.equal(greeting(new Date(2026, 0, 1, 15)), 'Guten Tag');
  assert.equal(greeting(new Date(2026, 0, 1, 21)), 'Guten Abend');
});

test('weekdayShort parses ISO day in local time', () => {
  assert.equal(weekdayShort('2026-11-05'), 'Do');
  assert.equal(weekdayShort('2026-11-08'), 'So');
});

test('initials', () => {
  assert.equal(initials('Mila Schneider'), 'MS');
  assert.equal(initials('ben'), 'BE');
  assert.equal(initials(''), '?');
  assert.equal(initials(null), '?');
  assert.equal(initials('Anna Maria Lee'), 'AL');
});

test('relativeTime', () => {
  const now = Date.parse('2026-11-05T12:00:00Z');
  assert.equal(relativeTime('2026-11-05T11:59:30Z', now), 'gerade eben');
  assert.equal(relativeTime('2026-11-05T11:30:00Z', now), 'vor 30 min');
  assert.equal(relativeTime('2026-11-05T09:00:00Z', now), 'vor 3 h');
  assert.equal(relativeTime('2026-11-04T11:00:00Z', now), 'gestern');
  assert.equal(relativeTime('2026-11-01T11:00:00Z', now), 'vor 4 Tagen');
});

test('distanceLabel', () => {
  assert.equal(distanceLabel(-1), '–');
  assert.equal(distanceLabel(42.4), '42 m');
  assert.equal(distanceLabel(1530), '1,5 km');
});
