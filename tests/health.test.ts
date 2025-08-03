import test from 'node:test';
import assert from 'node:assert/strict';
import { healthCheck } from '../server/health.js';

test('healthCheck responds with status ok', () => {
  let payload: any;
  const res = {
    json(data: any) {
      payload = data;
    },
  } as any;

  healthCheck({} as any, res);

  assert.deepStrictEqual(payload, { status: 'ok' });
});
