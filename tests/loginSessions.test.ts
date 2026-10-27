import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractBearerToken,
  sanitizeClientField,
  MAX_USER_AGENT_LENGTH,
} from '../server/loginSessions.ts';

test('extractBearerToken parses well-formed headers only', () => {
  assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(extractBearerToken('bearer   tok'), 'tok');
  assert.equal(extractBearerToken('Basic abc'), null);
  assert.equal(extractBearerToken('Bearer'), null);
  assert.equal(extractBearerToken('Bearer a b'), null);
  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken(['Bearer x']), null);
});

test('sanitizeClientField trims, strips control characters and caps length', () => {
  assert.equal(sanitizeClientField('  Mozilla/5.0  ', 100), 'Mozilla/5.0');
  assert.equal(sanitizeClientField('a\r\nb\u0000c', 100), 'abc');
  assert.equal(sanitizeClientField('x'.repeat(MAX_USER_AGENT_LENGTH + 50), MAX_USER_AGENT_LENGTH)?.length, MAX_USER_AGENT_LENGTH);
  assert.equal(sanitizeClientField('   ', 10), null);
  assert.equal(sanitizeClientField(undefined, 10), null);
  assert.equal(sanitizeClientField(123, 10), null);
});
