import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'dist');
const temporaryDirectory = path.join(outputDirectory, '.server-build');
const tsc = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

await mkdir(temporaryDirectory, { recursive: true });
execFileSync(process.execPath, [
  tsc,
  path.join(projectRoot, 'server.ts'),
  '--target', 'ES2022',
  '--module', 'commonjs',
  '--moduleResolution', 'node',
  '--esModuleInterop',
  '--resolveJsonModule',
  '--skipLibCheck',
  '--types', 'node',
  '--outDir', temporaryDirectory,
], { cwd: projectRoot, stdio: 'inherit' });

await rm(path.join(outputDirectory, 'server.cjs'), { force: true });
await rename(path.join(temporaryDirectory, 'server.js'), path.join(outputDirectory, 'server.cjs'));
await copyFile(
  path.join(projectRoot, 'firebase-applet-config.json'),
  path.join(outputDirectory, 'firebase-applet-config.json'),
);
