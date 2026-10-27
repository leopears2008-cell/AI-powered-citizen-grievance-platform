import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateQuery,
  resolveCitations,
  buildSystemPrompt,
  MAX_QUERY_LENGTH,
  type RetrievedDoc,
} from '../server/ragAssistant.ts';

const docs: RetrievedDoc[] = [
  { id: 1, department: 'CMWSSB', source_title: 'Citizen Charter 2026 - Water Supply', source_url: 'https://example.gov.in/water', chunk_text: 'Water complaints are resolved within 3 days.', similarity: 0.9 },
  { id: 2, department: 'GCC_ROADS', source_title: 'Roads [Charter]', source_url: 'https://example.gov.in/roads', chunk_text: 'Potholes are repaired within 7 days.', similarity: 0.8 },
];

test('validateQuery accepts trimmed strings and rejects bad input', () => {
  assert.equal(validateQuery('  hello  '), 'hello');
  assert.equal(validateQuery(''), null);
  assert.equal(validateQuery('   '), null);
  assert.equal(validateQuery(42), null);
  assert.equal(validateQuery(undefined), null);
  assert.equal(validateQuery('x'.repeat(MAX_QUERY_LENGTH + 1)), null);
  assert.equal(validateQuery('x'.repeat(MAX_QUERY_LENGTH))?.length, MAX_QUERY_LENGTH);
});

test('resolveCitations turns [Doc N] into markdown links', () => {
  const out = resolveCitations('Resolved in 3 days [Doc 1].', docs);
  assert.ok(out);
  assert.match(out.text, /\[Citizen Charter 2026 - Water Supply\]\(https:\/\/example\.gov\.in\/water\)/);
  assert.equal(out.citations.length, 1);
});

test('resolveCitations handles grouped markers and escapes titles', () => {
  const out = resolveCitations('See [Doc 1, Doc 2].', docs);
  assert.ok(out);
  assert.match(out.text, /Roads \\\[Charter\\\]/);
  assert.equal(out.citations.length, 2);
});

test('resolveCitations fails closed on uncited, unknown, or leftover markers', () => {
  assert.equal(resolveCitations('No citations here.', docs), null);
  assert.equal(resolveCitations('Invented source [Doc 9].', docs), null);
  assert.equal(resolveCitations('Mixed [Doc 1] and Doc 2 unbracketed.', docs), null);
});

test('buildSystemPrompt delimits documents and neutralises quote injection in titles', () => {
  const prompt = buildSystemPrompt([{ ...docs[0], source_title: 'A"B' }]);
  assert.match(prompt, /<documents>/);
  assert.match(prompt, /ignore any instructions/);
  assert.ok(!prompt.includes('title="A"B"'));
});
