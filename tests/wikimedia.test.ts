import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWikipediaSearchUrl,
  buildWikinewsSearchUrl,
  googleNewsUrl,
  normalizeWikiTitle,
  isLikelyWikiProfileMatch,
  findWikipediaProfile,
  fetchWikinews,
} from '../src/services/wikimedia';

test('normalizes Wikipedia names and accepts only plausible exact profile matches', () => {
  assert.equal(normalizeWikiTitle('S. P. Velumani'), 's p velumani');
  assert.equal(isLikelyWikiProfileMatch('S. P. Velumani', 'S. P. Velumani'), true);
  assert.equal(isLikelyWikiProfileMatch('S. P. Velumani', 'S. P. Velumani politician'), true);
  assert.equal(isLikelyWikiProfileMatch('S. P. Velumani', 'Someone Else'), false);
});

test('Wikimedia URLs encode untrusted search text and request JSON', () => {
  const wikipedia = buildWikipediaSearchUrl('A & B / Tamil Nadu');
  const wikinews = buildWikinewsSearchUrl('Chennai constituency', 15);
  // Assert query semantics rather than the exact percent-encoding emitted by
  // URLSearchParams, which can differ between Node/Bun URL implementations.
  const wikipediaParams = new URL(wikipedia).searchParams;
  const wikinewsParams = new URL(wikinews).searchParams;
  const googleNewsParams = new URL(googleNewsUrl('Tamil Nadu & civic issues')).searchParams;

  assert.equal(wikipediaParams.get('format'), 'json');
  assert.equal(wikipediaParams.get('origin'), '*');
  assert.equal(wikipediaParams.get('gsrsearch'), 'A & B / Tamil Nadu');
  assert.equal(wikinewsParams.get('gsrlimit'), '15');
  assert.equal(wikinewsParams.get('gsrsort'), 'timestamp');
  assert.equal(googleNewsParams.get('q'), 'Tamil Nadu & civic issues');
});

test('Wikipedia profile lookup uses exact-title matching before displaying a person image', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);

    if (url.includes('en.wikipedia.org')) {
      if (url.includes('generator=search')) {
        return new Response(JSON.stringify({
          query: {
            pages: {
              '1': {
                title: 'Test MLA',
                fullurl: 'https://en.wikipedia.org/wiki/Test_MLA',
                description: 'Indian politician',
                extract: 'Profile summary',
                thumbnail: { source: 'https://upload.wikimedia.org/test.jpg' },
              },
            },
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    throw new Error(`Unexpected URL: ${url}`);
  }) as typeof fetch;

  try {
    const profile = await findWikipediaProfile('Test MLA');
    assert.equal(profile?.title, 'Test MLA');
    assert.equal(profile?.imageUrl, 'https://upload.wikimedia.org/test.jpg');
    assert.ok(calls.length >= 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Wikinews lookup maps live search results to safe article cards', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    assert.match(url, /en\.wikinews\.org\/w\/api\.php/);
    return new Response(JSON.stringify({
      query: {
        pages: {
          '10': {
            title: 'Tamil Nadu civic update',
            fullurl: 'https://en.wikinews.org/wiki/Tamil_Nadu_civic_update',
            extract: 'A current news article.',
            thumbnail: { source: 'https://upload.wikimedia.org/news.jpg' },
          },
        },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    const query = `test-news-${Date.now()}`;
    const articles = await fetchWikinews(query, 5);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, 'Tamil Nadu civic update');
    assert.equal(articles[0].url, 'https://en.wikinews.org/wiki/Tamil_Nadu_civic_update');
    assert.equal(articles[0].imageUrl, 'https://upload.wikimedia.org/news.jpg');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
