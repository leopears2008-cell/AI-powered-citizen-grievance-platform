import test from 'node:test';
import assert from 'node:assert/strict';
import { newsApiUrl, fetchLiveNews } from '../src/services/news';
import { clearNewsCacheForTests, fetchNews } from '../server/newsProvider';

test('news API URL caps the requested result count', () => {
  const url = new URL(newsApiUrl('Chennai', 99), 'http://localhost');
  assert.equal(url.pathname, '/api/news/tamil-nadu');
  assert.equal(url.searchParams.get('q'), 'Chennai');
  assert.equal(url.searchParams.get('limit'), '20');
});

test('live news maps backend JSON into article cards', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    articles: [{ title: 'Tamil Nadu civic update', url: 'https://example.com/news', extract: 'A current news article.', source: 'Example News', publishedAt: '2026-10-03T12:00:00Z' }],
  }), { status: 200 })) as unknown as typeof fetch;
  try {
    const articles = await fetchLiveNews(`test-news-${Date.now()}`, 5);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, 'Tamil Nadu civic update');
  } finally { globalThis.fetch = originalFetch; }
});

test('FreeNewsAPI.ai uses India filtering, sanitizes, validates and deduplicates', async () => {
  const originalFetch = globalThis.fetch;
  clearNewsCacheForTests();
  let requested = '';
  globalThis.fetch = (async (input) => {
    requested = String(input);
    return new Response(JSON.stringify({
      results: [
        { title: '<b>Safe title</b>', url: 'https://example.com/a', description: '<script>alert(1)</script>hello', sitename: 'Example' },
        { title: 'Duplicate', url: 'https://example.com/a', description: 'duplicate', sitename: 'Example' },
        { title: 'Bad URL', url: 'javascript:alert(1)', description: 'bad', sitename: 'Bad' },
      ],
    }), { status: 200 });
  }) as unknown as typeof fetch;
  try {
    const result = await fetchNews('Tamil Nadu', 10);
    const url = new URL(requested);
    assert.equal(url.hostname, 'freenewsapi.ai');
    assert.equal(url.pathname, '/v1/search');
    assert.equal(url.searchParams.get('country'), 'IN');
    assert.equal(url.searchParams.get('date'), '24h');
    assert.equal(url.searchParams.get('sort'), 'date');
    assert.equal(result.provider, 'FreeNewsAPI.ai');
    assert.equal(result.articles.length, 1);
    assert.equal(result.articles[0].title, 'Safe title');
    assert.equal(result.articles[0].extract, 'alert(1) hello');
  } finally { globalThis.fetch = originalFetch; clearNewsCacheForTests(); }
});

test('FreeNewsAPI.ai retries transient 429 and succeeds', async () => {
  const originalFetch = globalThis.fetch;
  clearNewsCacheForTests();
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls < 2) return new Response('rate limited', { status: 429 });
    return new Response(JSON.stringify({ results: [] }), { status: 200 });
  }) as unknown as typeof fetch;
  try {
    await fetchNews('retry-test', 5);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; clearNewsCacheForTests(); }
});
