import assert from 'node:assert/strict';
import { test } from 'node:test';

import { APP_VERSION, CHANGELOG, compareVersions, unseenEntries } from '../changelog.ts';

test('compareVersions orders numerically', () => {
  assert.ok(compareVersions('1.10.0', '1.2.0') > 0);
  assert.ok(compareVersions('1.2.0', '1.2.1') < 0);
  assert.equal(compareVersions('1.2', '1.2.0'), 0);
});

test('changelog is newest first and APP_VERSION is the top entry', () => {
  for (let i = 1; i < CHANGELOG.length; i++) {
    assert.ok(compareVersions(CHANGELOG[i - 1].version, CHANGELOG[i].version) > 0, `order at ${i}`);
  }
  assert.equal(APP_VERSION, CHANGELOG[0].version);
});

test('unseenEntries', () => {
  assert.deepEqual(unseenEntries(null), []);
  assert.deepEqual(unseenEntries(APP_VERSION), []);
  const fromOne = unseenEntries('1.0.0').map((e) => e.version);
  assert.ok(fromOne.includes(APP_VERSION));
  assert.ok(!fromOne.includes('1.0.0'));
});
