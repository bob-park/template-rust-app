import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeUpdateStatus } from './updateStatus.ts';

const s = {
  idle: 'Not checked yet',
  checking: 'Checking…',
  upToDate: 'Up to date',
  ready: (v: string) => `Version ${v} is ready`,
  failed: 'Update check failed',
};

void test('describeUpdateStatus', () => {
  assert.equal(describeUpdateStatus({ status: 'idle' }, s), 'Not checked yet');
  assert.equal(describeUpdateStatus({ status: 'checking' }, s), 'Checking…');
  assert.equal(describeUpdateStatus({ status: 'upToDate', checkedAt: 0 }, s), 'Up to date');
  assert.equal(describeUpdateStatus({ status: 'ready', version: '0.2.0' }, s), 'Version 0.2.0 is ready');
  assert.equal(describeUpdateStatus({ status: 'failed', checkedAt: 0 }, s), 'Update check failed');
});
