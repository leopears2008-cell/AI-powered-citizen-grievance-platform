import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('grievance operations migration includes required workflow tables and fields', () => {
  const sql = readFileSync(new URL('../supabase/migrations/002_grievance_operations.sql', import.meta.url), 'utf8').toLowerCase();
  for (const required of [
    'resolution_verification_token',
    'grievance_notifications',
    'grievance_appeals',
    'add column if not exists title',
    "type in ('image', 'document')",
  ]) {
    assert.ok(sql.includes(required.toLowerCase()), 'Missing migration element: ' + required);
  }
});
