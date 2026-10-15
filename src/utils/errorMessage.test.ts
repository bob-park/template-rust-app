import assert from 'node:assert/strict';
import { test } from 'node:test';

import { errorMessage } from './errorMessage.ts';

const errors = {
  INVALID_INPUT: 'invalid',
  DB: 'db',
  IO: 'io',
  SCHEMA_TOO_NEW: 'too new',
  UNKNOWN: 'unknown',
  dismiss: 'dismiss',
};

void test('errorMessage maps a known code', () => {
  assert.equal(errorMessage({ code: 'DB', message: 'disk I/O error' }, errors), 'db');
});

void test('errorMessage falls back for an unknown code', () => {
  assert.equal(errorMessage({ code: 'NEW_CODE', message: 'x' }, errors), 'unknown');
});
