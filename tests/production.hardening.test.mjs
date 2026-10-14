import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [server, validator, envExample] = await Promise.all([
  readFile(new URL('../server.ts', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/validate-production.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../.env.example', import.meta.url), 'utf8'),
]);

test('server exposes a health endpoint for deployment probes', () => {
  assert.match(server, /app\.get\('\/healthz'/);
});

test('request payloads have an explicit size limit', () => {
  assert.match(server, /express\.json\(\{\s*limit:\s*'10mb'\s*\}\)/);
});

test('production mode returns JSON for unknown API routes', () => {
  assert.match(server, /app\.use\('\/api',[\s\S]*?res\.status\(404\)\.json\(\{\s*error:\s*'API route not found'/);
});

test('production validation checks required deployment configuration', () => {
  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY', 'CORS_ORIGINS']) {
    assert.ok(validator.includes(key), `Missing production validation for ${key}`);
    assert.ok(envExample.includes(key), `Missing documented environment variable ${key}`);
  }
});
