import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveLocale } from './locale.ts';

void test('resolveLocale', () => {
  assert.equal(resolveLocale('ko', 'en-US'), 'ko');
  assert.equal(resolveLocale('en', 'ko-KR'), 'en');
  assert.equal(resolveLocale('system', 'ko-KR'), 'ko');
  assert.equal(resolveLocale('system', 'fr-FR'), 'en');
});
