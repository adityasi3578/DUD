import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost/db';
const { hashPassword, verifyPassword } = await import('../server/auth');

// Ensure hashing returns a value different from the original
test('hashPassword returns different value', async () => {
  const password = 'supersecret';
  const hash = await hashPassword(password);
  assert.notStrictEqual(hash, password);
});

// Ensure verifyPassword validates a correct password
test('verifyPassword succeeds for valid password/hash', async () => {
  const password = 'supersecret';
  const hash = await hashPassword(password);
  const valid = await verifyPassword(password, hash);
  assert.strictEqual(valid, true);
});
