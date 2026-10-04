import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const hero = read('src/components/HeroSection.tsx');
const css = read('src/index.css');

test('hero does not show Gemini branding', () => {
  assert.doesNotMatch(hero, /gemini/i);
});

test('hero keeps real workflow wiring', () => {
  assert.match(hero, /setActiveTab\('file'\)/);
  assert.match(hero, /onOpenVoiceModal/);
  assert.match(hero, /NivaranAI Citizen Assistant/);
});

test('particle count stays within the 8-15 budget', () => {
  const match = hero.match(/makeMotes\((\d+)\)/);
  assert.ok(match, 'makeMotes(count) call not found');
  const count = Number(match[1]);
  assert.ok(count >= 8 && count <= 15, `unexpected particle count ${count}`);
});

test('Ken Burns runs 15-20s, ends near 1.05 and alternates (seamless loop)', () => {
  const duration = css.match(/animation:\s*hero-kenburns\s+(\d+)s[^;]*alternate/);
  assert.ok(duration, 'hero-kenburns alternate animation not found');
  assert.ok(Number(duration[1]) >= 15 && Number(duration[1]) <= 20);
  assert.match(css, /--kb-scale:\s*1\.05/);
  assert.match(css, /--kb-scale:\s*1\.025/);
});

test('reduced motion disables continuous hero animation and parallax', () => {
  const block = css.slice(css.indexOf('Reduced motion: keep a simple fade'));
  for (const cls of ['.hero-kb', '.hero-light', '.hero-mote', '.hero-float', '.hero-par-bg']) {
    assert.ok(block.includes(cls), `${cls} missing from reduced-motion block`);
  }
  assert.match(block, /animation:\s*none\s*!important/);
});

test('parallax hook avoids React state and gates on mouse / fine pointer', () => {
  const hook = read('src/lib/heroMotion.ts');
  assert.doesNotMatch(hook, /useState/);
  assert.match(hook, /pointerType !== 'mouse'/);
  assert.match(hook, /prefers-reduced-motion/);
});
