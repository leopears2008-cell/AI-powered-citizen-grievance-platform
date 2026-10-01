import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();

test('initial Supabase migration contains required tables and security', async () => {
  const sql = await readFile(join(root, 'supabase/migrations/001_initial_schema.sql'), 'utf8');
  for (const table of [
    'admins',
    'departments',
    'officers',
    'grievances',
    'grievance_status_history',
    'grievance_attachments',
    'audit_logs',
  ]) {
    assert.ok(sql.toLowerCase().includes('create table if not exists public.' + table));
  }
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /create policy grievances_select/i);
  assert.match(sql, /create policy grievances_insert_own/i);
  assert.doesNotMatch(sql, /grievances_department_id_fkey/i);
});

test('application source has no Firestore client database imports', async () => {
  const firebaseClient = await readFile(join(root, 'src/lib/firebase.ts'), 'utf8');
  assert.doesNotMatch(firebaseClient, /firebase\\/firestore|firebase-admin\\/firestore|getFirestore|collection\\(/);
});

test('Supabase service client is server-only', async () => {
  const serverClient = await readFile(join(root, 'server/supabase.ts'), 'utf8');
  assert.match(serverClient, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(serverClient, /createClient/);
});
