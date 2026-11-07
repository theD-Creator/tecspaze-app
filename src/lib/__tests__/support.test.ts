import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chatError, mergeMessage, prependUnique, shouldPopUp, startsNewDay, threadOf, type SupportMessage } from '../support.ts';

const msg = (id: string, at: string): SupportMessage => ({
  id,
  from_team: false,
  kind: 'message',
  body: id,
  created_at: at,
  sender_id: null,
  sender_name: null,
  sender_photo: null,
});

test('shouldPopUp only for team answers of this app, not the open chat', () => {
  const n = { kind: 'team_reply' as const, app: 'tecspaze', data: { thread_id: 't1' } };
  assert.equal(shouldPopUp(n, 'tecspaze', null), true);
  assert.equal(shouldPopUp(n, 'tecspaze', 't1'), false);
  assert.equal(shouldPopUp(n, 'universe', null), false);
  assert.equal(shouldPopUp({ ...n, kind: 'update' }, 'tecspaze', null), false);
  assert.equal(shouldPopUp({ ...n, data: {} }, 'tecspaze', null), false);
});

test('threadOf', () => {
  assert.equal(threadOf({ data: { thread_id: 'x' } }), 'x');
  assert.equal(threadOf({ data: { thread_id: 5 } }), null);
  assert.equal(threadOf({ data: null }), null);
});

test('prependUnique dedupes and caps', () => {
  const list = [{ id: 'a' }, { id: 'b' }];
  assert.deepEqual(prependUnique(list, { id: 'b' }).map((x) => x.id), ['b', 'a']);
  assert.equal(prependUnique(list, { id: 'c' }, 2).length, 2);
});

test('mergeMessage keeps order and replaces duplicates', () => {
  const list = [msg('a', '2026-11-07T10:00:00Z'), msg('c', '2026-11-07T12:00:00Z')];
  assert.deepEqual(mergeMessage(list, msg('b', '2026-11-07T11:00:00Z')).map((m) => m.id), ['a', 'b', 'c']);
  assert.equal(mergeMessage(list, { ...msg('a', '2026-11-07T10:00:00Z'), body: 'neu' })[0].body, 'neu');
  assert.equal(mergeMessage(list, msg('a', '2026-11-07T10:00:00Z')).length, 2);
});

test('startsNewDay', () => {
  const list = [msg('a', '2026-11-06T23:00:00Z'), msg('b', '2026-11-06T23:30:00Z'), msg('c', '2026-11-07T08:00:00Z')];
  assert.deepEqual([0, 1, 2].map((i) => startsNewDay(list, i)), [true, false, true]);
});

test('chatError', () => {
  assert.ok(chatError('   '));
  assert.equal(chatError('Hallo'), null);
  assert.ok(chatError('x'.repeat(4001)));
});
