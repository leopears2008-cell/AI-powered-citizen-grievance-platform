import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFeedUrl,
  createNewsService,
  isNewsCategory,
  NewsUnavailableError,
  parseFeed,
  parsePublishedAt,
  safeHttpsUrl,
  toPlainText,
} from '../server/newsService.ts';

// NOTE: the XML below is a unit-test fixture shaped like a Google News RSS response.
// It is never served by the application; production data always comes from the live feed.
const NOW = Date.parse('2026-10-27T10:00:00Z');

const item = (o: { title?: string; link?: string; pubDate?: string; source?: string }) =>
  `<item><title>${o.title ?? 'Headline'}</title><link>${o.link ?? 'https://news.example.com/a'}</link>` +
  (o.pubDate ? `<pubDate>${o.pubDate}</pubDate>` : '') +
  (o.source ? `<source url="https://pub.example.com">${o.source}</source>` : '') +
  `</item>`;
const feed = (...items: string[]) => `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title>${items.join('')}</channel></rss>`;

test('parseFeed extracts title, source, link and ISO date; strips the " - Source" suffix', () => {
  const xml = feed(
    item({ title: 'Chennai Metro adds trains - The Hindu', link: 'https://news.example.com/1', pubDate: 'Tue, 27 Oct 2026 08:30:00 GMT', source: 'The Hindu' }),
  );
  const [it] = parseFeed(xml, 'transport', NOW);
  assert.equal(it.title, 'Chennai Metro adds trains');
  assert.equal(it.source, 'The Hindu');
  assert.equal(it.url, 'https://news.example.com/1');
  assert.equal(it.publishedAt, '2026-10-27T08:30:00.000Z');
  assert.equal(it.category, 'transport');
  assert.match(it.id, /^[0-9a-f]{16}$/);
});

test('parseFeed falls back to the title suffix for source when <source> is absent, and null date when missing/invalid', () => {
  const xml = feed(
    item({ title: 'School reopening date announced - Dinamalar', link: 'https://news.example.com/2' }),
    item({ title: 'Another story', link: 'https://news.example.com/3', pubDate: 'not a date', source: 'Pub' }),
  );
  const items = parseFeed(xml, 'education', NOW);
  const a = items.find((i) => i.url.endsWith('/2'))!;
  assert.equal(a.source, 'Dinamalar');
  assert.equal(a.title, 'School reopening date announced');
  assert.equal(a.publishedAt, null);
  assert.equal(items.find((i) => i.url.endsWith('/3'))!.publishedAt, null);
});

test('parseFeed drops items with unsafe or missing links and strips markup from titles', () => {
  const xml = feed(
    item({ title: 'Bad scheme', link: 'javascript:alert(1)', source: 'X' }),
    item({ title: 'Plain http', link: 'http://news.example.com/x', source: 'X' }),
    item({ title: 'Creds', link: 'https://user:pw@news.example.com/x', source: 'X' }),
    item({ title: 'Localhost', link: 'https://localhost/x', source: 'X' }),
    item({ title: 'IP literal', link: 'https://10.0.0.1/x', source: 'X' }),
    item({ title: '&lt;script&gt;alert(1)&lt;/script&gt;Safe &lt;b&gt;title&lt;/b&gt; &amp; more', link: 'https://news.example.com/ok', source: 'Pub' }),
  );
  const items = parseFeed(xml, 'breaking', NOW);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Safe title & more');
  assert.ok(!/[<>]/.test(items[0].title));
});

test('parseFeed sorts newest first, de-duplicates, and rejects non-RSS / DTD payloads', () => {
  const xml = feed(
    item({ title: 'Older', link: 'https://n.example.com/1', pubDate: 'Mon, 26 Oct 2026 08:00:00 GMT', source: 'A' }),
    item({ title: 'Newer', link: 'https://n.example.com/2', pubDate: 'Tue, 27 Oct 2026 09:00:00 GMT', source: 'A' }),
    item({ title: 'Newer', link: 'https://n.example.com/2b', pubDate: 'Tue, 27 Oct 2026 09:00:00 GMT', source: 'B' }),
  );
  assert.deepEqual(parseFeed(xml, 'breaking', NOW).map((i) => i.title), ['Newer', 'Older']);
  assert.throws(() => parseFeed('<html><body>consent</body></html>', 'breaking', NOW), NewsUnavailableError);
  assert.throws(() => parseFeed('<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "b">]><rss><channel/></rss>', 'breaking', NOW), NewsUnavailableError);
  assert.throws(() => parseFeed('', 'breaking', NOW), NewsUnavailableError);
});

test('parseFeed returns an empty list for a valid feed with no items', () => {
  assert.deepEqual(parseFeed(feed(), 'breaking', NOW), []);
});

test('helpers: safeHttpsUrl, toPlainText, parsePublishedAt, isNewsCategory', () => {
  assert.equal(safeHttpsUrl('https://example.com/a?b=1'), 'https://example.com/a?b=1');
  for (const bad of ['', 'ftp://example.com', 'data:text/html,hi', '//example.com', 'https://[::1]/', undefined, 42]) {
    assert.equal(safeHttpsUrl(bad as never), null, String(bad));
  }
  assert.equal(toPlainText('  a\u0000b <i>c</i>\n d  '), 'a b c d');
  assert.equal(toPlainText('x'.repeat(500), 50).length, 50);
  assert.equal(parsePublishedAt('Wed, 01 Jan 2200 00:00:00 GMT', NOW), null);
  assert.ok(isNewsCategory('public-services'));
  assert.ok(!isNewsCategory('sports'));
  assert.ok(!isNewsCategory(undefined));
});

test('buildFeedUrl targets only the fixed Google News host with encoded, allow-listed queries', () => {
  for (const lang of ['en', 'ta'] as const) {
    const u = new URL(buildFeedUrl('government', lang));
    assert.equal(u.origin + u.pathname, 'https://news.google.com/rss/search');
    assert.equal(u.searchParams.get('gl'), 'IN');
    assert.ok(u.searchParams.get('q'));
  }
});

const okResponse = (xml: string) => new Response(xml, { status: 200, headers: { 'content-type': 'application/rss+xml' } });

test('service caches within the TTL and shares one upstream call between concurrent requests', async () => {
  let calls = 0;
  let clock = NOW;
  const svc = createNewsService({
    now: () => clock,
    ttlMs: 60_000,
    fetchImpl: (async () => {
      calls++;
      return okResponse(feed(item({ title: 'One', link: 'https://n.example.com/1', source: 'A', pubDate: 'Tue, 27 Oct 2026 09:00:00 GMT' })));
    }) as typeof fetch,
  });
  const [a, b] = await Promise.all([svc.getNews('breaking', 'en'), svc.getNews('breaking', 'en')]);
  assert.equal(calls, 1);
  assert.equal(a.items.length, 1);
  assert.equal(b.stale, false);
  await svc.getNews('breaking', 'en');
  assert.equal(calls, 1, 'served from cache');
  clock += 61_000;
  await svc.getNews('breaking', 'en');
  assert.equal(calls, 2, 'refetched after TTL');
  await svc.getNews('education', 'en');
  assert.equal(calls, 3, 'cache is per category');
});

test('service serves the last good copy flagged stale when the feed fails, and errors when nothing is cached', async () => {
  let fail = false;
  let clock = NOW;
  const svc = createNewsService({
    now: () => clock,
    ttlMs: 1_000,
    fetchImpl: (async () => {
      if (fail) throw new Error('network down');
      return okResponse(feed(item({ title: 'One', link: 'https://n.example.com/1', source: 'A' })));
    }) as typeof fetch,
  });
  await assert.doesNotReject(svc.getNews('breaking', 'en'));
  clock += 5_000;
  fail = true;
  const stale = await svc.getNews('breaking', 'en');
  assert.equal(stale.stale, true);
  assert.equal(stale.items.length, 1);
  await assert.rejects(svc.getNews('transport', 'en'), NewsUnavailableError);
});

test('service maps upstream HTTP errors and non-feed bodies to NewsUnavailableError and honours the limit', async () => {
  const bad = createNewsService({ fetchImpl: (async () => new Response('nope', { status: 503 })) as typeof fetch });
  await assert.rejects(bad.getNews('breaking', 'en'), NewsUnavailableError);

  const html = createNewsService({ fetchImpl: (async () => okResponse('<html>consent</html>')) as typeof fetch });
  await assert.rejects(html.getNews('breaking', 'en'), NewsUnavailableError);

  const many = feed(...Array.from({ length: 10 }, (_, i) => item({ title: `T${i}`, link: `https://n.example.com/${i}`, source: 'S' })));
  const svc = createNewsService({ fetchImpl: (async () => okResponse(many)) as typeof fetch });
  assert.equal((await svc.getNews('breaking', 'en', 3)).items.length, 3);
});
