export type NewsArticle = { title: string; url: string; extract: string; source: string; publishedAt?: string };

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; articles: NewsArticle[] }>();

function clean(value: unknown, max: number) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function dedupe(articles: NewsArticle[], limit: number) {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (!article.title || !validUrl(article.url)) return false;
    const key = article.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(8_000) });
      if (response.ok || (response.status !== 429 && response.status < 500) || attempt === retries) return response;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('News provider request failed.');
}

async function fetchNewsApi(query: string, limit: number): Promise<NewsArticle[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) throw new Error('NEWS_API_KEY is required for NEWS_PROVIDER=newsapi.');

  const params = new URLSearchParams({
    q: query,
    language: 'en',
    sortBy: 'publishedAt',
    pageSize: String(limit),
  });

  const response = await fetchWithRetry('https://newsapi.org/v2/everything?' + params.toString(), {
    headers: {
      Accept: 'application/json',
      'X-Api-Key': key,
      'User-Agent': 'NivaranAI/1.0 licensed-news-service',
    },
  });

  if (!response.ok) throw new Error(`Licensed news provider returned HTTP ${response.status}`);

  const body = await response.json() as {
    status?: string;
    articles?: Array<{
      title?: string;
      url?: string;
      description?: string;
      source?: { name?: string };
      publishedAt?: string;
    }>;
  };

  if (body.status !== 'ok' || !Array.isArray(body.articles)) {
    throw new Error('Licensed news provider returned an invalid response.');
  }

  return dedupe(body.articles.map((article) => ({
    title: clean(article.title, 300),
    url: clean(article.url, 2000),
    extract: clean(article.description, 600),
    source: clean(article.source?.name || 'Licensed News API', 200),
    publishedAt: clean(article.publishedAt, 100) || undefined,
  })), limit);
}

async function fetchGoogleRss(query: string, limit: number): Promise<NewsArticle[]> {
  const params = new URLSearchParams({ q: query, hl: 'en-IN', gl: 'IN', ceid: 'IN:en' });
  const response = await fetchWithRetry(`https://news.google.com/rss/search?${params.toString()}`, {
    headers: {
      Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      'User-Agent': 'NivaranAI/1.0 civic-news-service',
    },
  });

  if (!response.ok) throw new Error(`Google News RSS returned HTTP ${response.status}`);
  const xml = await response.text();
  if (xml.length > 2_000_000) throw new Error('News provider response is too large.');

  const items = xml.match(/<item\\b[^>]*>[\\s\\S]*?<\\/item>/gi) ?? [];
  const articles: NewsArticle[] = [];

  for (const item of items) {
    if (articles.length >= limit) break;
    const tag = (name: string) => clean(
      item.match(new RegExp('<' + name + '\\\\b[^>]*>([\\s\\S]*?)</' + name + '>', 'i'))?.[1],
      2000,
    ).replace(/<!\\[CDATA\\[|\\]\\]>/g, '');

    const title = tag('title');
    const url = tag('link');
    if (!title || !validUrl(url)) continue;
    articles.push({
      title,
      url,
      extract: tag('description').slice(0, 600),
      source: tag('source') || 'Google News',
      publishedAt: tag('pubDate') || undefined,
    });
  }

  return dedupe(articles, limit);
}

export async function fetchNews(query: string, limit: number) {
  const safeQuery = query.trim().slice(0, 180);
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  if (!safeQuery) return { provider: 'none', articles: [] as NewsArticle[] };

  const provider = (process.env.NEWS_PROVIDER || (process.env.NODE_ENV === 'production' ? 'newsapi' : 'google-rss')).toLowerCase();
  const cacheKey = `${provider}:${safeQuery.toLowerCase()}:${safeLimit}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { provider: provider === 'newsapi' ? 'NewsAPI' : 'Google News RSS', articles: cached.articles };
  }

  const articles = provider === 'newsapi'
    ? await fetchNewsApi(safeQuery, safeLimit)
    : provider === 'google-rss'
      ? await fetchGoogleRss(safeQuery, safeLimit)
      : (() => { throw new Error('Unsupported NEWS_PROVIDER. Use newsapi or google-rss.'); })();

  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, articles });
  if (cache.size > 100) cache.delete(cache.keys().next().value as string);

  return { provider: provider === 'newsapi' ? 'NewsAPI' : 'Google News RSS', articles };
}

export function clearNewsCacheForTests() {
  cache.clear();
}
