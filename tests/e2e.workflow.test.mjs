import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 43187;
const baseUrl = `http://127.0.0.1:${port}`;

test('production server health and read APIs respond correctly', { timeout: 30_000 }, async (t) => {
  const child = spawn(process.execPath, ['dist/server.cjs'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  t.after(() => {
    if (!child.killed) child.kill('SIGTERM');
  });

  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) {
      assert.fail(`Production server exited early. Output: ${output}`);
    }
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) {
        const payload = await response.json();
        assert.equal(payload.status, 'ok');
        ready = true;
        break;
      }
    } catch {
      // Server may still be starting; retry briefly.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, `Production server did not become ready. Output: ${output}`);

  for (const [route, expectedType] of [
    ['/api/departments', 'array'],
    ['/api/officers', 'array'],
    ['/api/notifications', 'array'],
    ['/api/analytics', 'object'],
  ]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} should return HTTP 200`);
    const payload = await response.json();
    assert.equal(Array.isArray(payload) ? 'array' : 'object', expectedType, `${route} should return JSON ${expectedType}`);
  }

  const missingApi = await fetch(`${baseUrl}/api/route-that-does-not-exist`);
  assert.equal(missingApi.status, 404);
  assert.match(missingApi.headers.get('content-type') ?? '', /application\/json/);
});
