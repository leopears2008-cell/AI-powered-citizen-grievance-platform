export type NewsArticle = { title: string; url: string; extract: string; source: string; publishedAt?: string };

function clean(value: unknown, max: number) { return typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, max) : ''; }

async function fetchNewsApi(query: string, limit: number): Promise<NewsArticle[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) throw new Error('NEWS_API_KEY is required for NEWS_PROVIDER=newsapi.');
  const params = new URLSearchParams({ q: query, language: 'en', sortBy: 'publishedAt', pageSize: String(limit), apiKey: key });
  const response = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`, { signal: AbortSignal.timeout(8_000), headers: { Accept: 'application/json', 'User-Agent': 'NivaranAI/1.0 licensed-news-service' } });
  if (!response.ok) throw new Error(`Licensed news provider returned HTTP ${response.status}`);
  const body = await response.json() as { status?: string; articles?: Array<{ title?: string; url?: string; description?: string; source?: { name?: string }; publishedAt?: string }> };
  if (body.status !== 'ok') throw new Error('Licensed news provider returned an invalid response.');
  return (body.articles ?? []).filter((a) => /^https?:\\/\\//i.test(a.url || '')).map((a) => ({
    title: clean(a.title, 300), url: clean(a.url, 2000), extract: clean(a.description, 600), source: clean(a.source?.name || 'Licensed News API', 200), publishedAt: clean(a.publishedAt, 100) || undefined,
  }));
}

async function fetchGoogleRss(query: string, limit: number): Promise<NewsArticle[]> {
  const params = new URLSearchParams({ q: query, hl: 'en-IN', gl: 'IN', ceid: 'IN:en' });
  const response = await fetch(`https://news.google.com/rss/search?${params.toString()}`, { signal: AbortSignal.timeout(8_000), headers: { Accept: 'application/rss+xml, application/xml;q=0.9', 'User-Agent': 'NivaranAI/1.0 civic-news-service' } });
  if (!response.ok) throw new Error(`Google News RSS returned HTTP ${response.status}`);
  const xml = await response.text();
  const items = xml.match(/<item\\b[^>]*>[\\s\\S]*?<\\/item>/gi) ?? [];
  const out: NewsArticle[] = [];
  for (const item of items) {
    if (out.length >= limit) break;
    const tag = (name: string) => clean(item.match(new RegExp('<' + name + '\\\\b[^>]*>([\\s\\S]*?)</' + name + '>', 'i'))?.[1], 2000).replace(/<!\\[CDATA\\[|\\]\\]>/g, '');
    const title = tag('title'); const url = tag('link');
    if (!title || !/^https?:\\/\\//i.test(url)) continue;
    out.push({ title, url, extract: tag('description').slice(0,600), source: tag('source') || 'Google News', publishedAt: tag('pubDate') || undefined });
  }
  return out;
}

export async function fetchNews(query: string, limit: number) {
  const provider = (process.env.NEWS_PROVIDER || 'google-rss').toLowerCase();
  if (provider === 'newsapi') return { provider: 'NewsAPI', articles: await fetchNewsApi(query, limit) };
  if (provider === 'google-rss') return { provider: 'Google News RSS', articles: await fetchGoogleRss(query, limit) };
  throw new Error('Unsupported NEWS_PROVIDER. Use newsapi or google-rss.');
}
