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

async function fetchFreeNewsApi(query: string, limit: number): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    q: query,
    country: 'IN',
    date: '24h',
    sort: 'date',
    size: String(limit),
  });

  const response = await fetchWithRetry(
    'https://freenewsapi.ai/v1/search?' + params.toString(),
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NivaranAI/1.0 civic-news-service (+https://github.com/leopears2008-cell/AI-powered-citizen-grievance-platform)',
        'X-Agent': 'agent_name=NivaranAI; version=1.0; software=Node.js; purpose=Tamil Nadu civic live news',
      },
    },
  );

  if (!response.ok) throw new Error(`FreeNewsAPI.ai returned HTTP ${response.status}`);

  const body = await response.json() as {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
      host?: string;
      sitename?: string;
      published_at?: string;
    }>;
  };

  if (!Array.isArray(body.results)) throw new Error('FreeNewsAPI.ai returned an invalid response.');

  return dedupe(body.results.map((article) => ({
    title: clean(article.title, 300),
    url: clean(article.url, 2000),
    extract: clean(article.description, 600),
    source: clean(article.sitename || article.host || 'FreeNewsAPI.ai', 200),
    publishedAt: clean(article.published_at, 100) || undefined,
  })), limit);
}

export async function fetchNews(query: string, limit: number) {
  const safeQuery = query.trim().slice(0, 180);
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  if (!safeQuery) return { provider: 'none', articles: [] as NewsArticle[] };

  const cacheKey = `freenewsapi:${safeQuery.toLowerCase()}:${safeLimit}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { provider: 'FreeNewsAPI.ai', articles: cached.articles };
  }

  const articles = await fetchFreeNewsApi(safeQuery, safeLimit);
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, articles });
  if (cache.size > 100) cache.delete(cache.keys().next().value as string);

  return { provider: 'FreeNewsAPI.ai', articles };
}

export function clearNewsCacheForTests() {
  cache.clear();
}
