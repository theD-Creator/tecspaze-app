import assert from 'node:assert/strict';
import { test } from 'node:test';

import { feedbackError, toggleVoteLocal, type Feedback } from '../feedback.ts';

const base: Feedback = {
  id: 'a',
  kind: 'feature',
  title: 'Dark Mode',
  body: '',
  status: 'open',
  admin_note: null,
  device: null,
  vote_count: 3,
  created_at: '2026-11-07T10:00:00Z',
  user_id: 'u',
  author_name: 'X',
  author_photo: null,
  voted: false,
};

test('toggleVoteLocal adds and removes a vote', () => {
  const up = toggleVoteLocal([base, { ...base, id: 'b' }], 'a');
  assert.equal(up[0].vote_count, 4);
  assert.equal(up[0].voted, true);
  assert.equal(up[1].vote_count, 3);
  const down = toggleVoteLocal(up, 'a');
  assert.equal(down[0].vote_count, 3);
  assert.equal(down[0].voted, false);
});

test('toggleVoteLocal never goes below zero', () => {
  assert.equal(toggleVoteLocal([{ ...base, vote_count: 0, voted: true }], 'a')[0].vote_count, 0);
});

test('feedbackError validates', () => {
  assert.equal(feedbackError('Dark Mode', '', 'feature'), null);
  assert.match(feedbackError('ab', '', 'feature')!, /3 Zeichen/);
  assert.match(feedbackError('x'.repeat(121), '', 'feature')!, /120/);
  assert.match(feedbackError('Timer hängt', 'kurz', 'bug')!, /10 Zeichen/);
  assert.equal(feedbackError('Timer hängt', 'Timer bleibt bei 00:00 stehen', 'bug'), null);
});
