import test from 'node:test';
import assert from 'node:assert/strict';
import { googleNewsUrl, newsApiUrl, fetchLiveNews } from '../src/services/news';

test('Google News URL preserves the search query and India locale', () => {
  const url = new URL(googleNewsUrl('Tamil Nadu & civic issues'));
  assert.equal(url.hostname, 'news.google.com');
  assert.equal(url.searchParams.get('q'), 'Tamil Nadu & civic issues');
  assert.equal(url.searchParams.get('hl'), 'en-IN');
  assert.equal(url.searchParams.get('gl'), 'IN');
});

test('news API URL caps the requested result count', () => {
  const url = new URL(newsApiUrl('Chennai', 99), 'http://localhost');
  assert.equal(url.pathname, '/api/news/tamil-nadu');
  assert.equal(url.searchParams.get('q'), 'Chennai');
  assert.equal(url.searchParams.get('limit'), '20');
});

test('live news maps backend JSON into article cards', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    articles: [{
      title: 'Tamil Nadu civic update',
      url: 'https://example.com/news',
      extract: 'A current news article.',
      source: 'Example News',
      publishedAt: '2026-10-03T12:00:00Z',
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch;

  try {
    const articles = await fetchLiveNews(`test-news-${Date.now()}`, 5);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, 'Tamil Nadu civic update');
    assert.equal(articles[0].source, 'Example News');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
