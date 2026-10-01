/**
 * Wikimedia-backed civic information helpers.
 *
 * Wikipedia is used for person/profile metadata. Wikinews is used for news.
 * The Google News URL helper is only an external discovery link; it is never
 * presented as if its content came from Wikipedia/Wikinews.
 */

export interface WikipediaProfile {
  title: string;
  url: string;
  description: string;
  extract: string;
  imageUrl?: string;
}

export interface WikinewsArticle {
  title: string;
  url: string;
  extract: string;
  imageUrl?: string;
}

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const WIKINEWS_API = 'https://en.wikinews.org/w/api.php';
const PROFILE_TTL_MS = 15 * 60 * 1000;
const NEWS_TTL_MS = 60 * 1000;

const profileCache = new Map<string, { expiresAt: number; value: WikipediaProfile | null }>();
const newsCache = new Map<string, { expiresAt: number; value: WikinewsArticle[] }>();

export const normalizeWikiTitle = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .toLowerCase();

export const isLikelyWikiProfileMatch = (requestedName: string, pageTitle: string): boolean => {
  const requested = normalizeWikiTitle(requestedName);
  const title = normalizeWikiTitle(pageTitle);
  if (!requested || !title) return false;
  if (requested === title) return true;

  // Accept a standard Wikipedia disambiguation suffix while rejecting unrelated
  // search results that merely happen to contain the same surname.
  return title === `${requested} politician`
    || title === `${requested} tamil nadu`;
};

export const buildWikipediaSearchUrl = (name: string): string => {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: name,
    gsrnamespace: '0',
    gsrlimit: '8',
    prop: 'pageimages|extracts|info',
    piprop: 'thumbnail',
    pithumbsize: '640',
    exintro: '1',
    explaintext: '1',
    inprop: 'url',
    format: 'json',
    origin: '*',
  });
  return `${WIKIPEDIA_API}?${params.toString()}`;
};

export const buildWikinewsSearchUrl = (query: string, limit = 12): string => {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '0',
    gsrlimit: String(limit),
    gsrsort: 'timestamp',
    gsrdir: 'descending',
    prop: 'pageimages|extracts|info',
    piprop: 'thumbnail',
    pithumbsize: '960',
    exintro: '1',
    explaintext: '1',
    inprop: 'url',
    format: 'json',
    origin: '*',
  });
  return `${WIKINEWS_API}?${params.toString()}`;
};

export const googleNewsUrl = (query: string): string =>
  `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN%3Aen`;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Wikimedia request failed with HTTP ${response.status}`);
    }
    return await response.json() as T;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

interface WikiSearchPage {
  title?: string;
  fullurl?: string;
  extract?: string;
  description?: string;
  thumbnail?: { source?: string };
}

interface WikiApiResponse {
  query?: {
    pages?: Record<string, WikiSearchPage>;
  };
}

export async function findWikipediaProfile(name: string): Promise<WikipediaProfile | null> {
  const normalized = name.trim();
  if (!normalized || normalized.length > 120) return null;

  const cached = profileCache.get(normalized.toLowerCase());
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const data = await fetchJson<WikiApiResponse>(buildWikipediaSearchUrl(normalized));
    const pages = Object.values(data.query?.pages ?? {});
    const page = pages.find((candidate) =>
      typeof candidate.title === 'string' && isLikelyWikiProfileMatch(normalized, candidate.title)
    );

    const value = page?.title
      ? {
          title: page.title,
          url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
          description: page.description || 'Wikipedia profile',
          extract: page.extract || '',
          imageUrl: page.thumbnail?.source,
        }
      : null;

    profileCache.set(normalized.toLowerCase(), {
      expiresAt: Date.now() + PROFILE_TTL_MS,
      value,
    });
    return value;
  } catch {
    profileCache.set(normalized.toLowerCase(), {
      expiresAt: Date.now() + 30_000,
      value: null,
    });
    return null;
  }
}

export async function fetchWikinews(query: string, limit = 12): Promise<WikinewsArticle[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length > 180) return [];

  const normalizedKey = `${cleanQuery.toLowerCase()}::${Math.min(Math.max(limit, 1), 20)}`;
  const cached = newsCache.get(normalizedKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const safeLimit = Math.min(Math.max(limit, 1), 20);
    const data = await fetchJson<WikiApiResponse>(buildWikinewsSearchUrl(cleanQuery, safeLimit));
    const pages = Object.values(data.query?.pages ?? {});

    const articles = pages
      .filter((page) => typeof page.title === 'string')
      .map((page) => ({
        title: page.title as string,
        url: page.fullurl || `https://en.wikinews.org/wiki/${encodeURIComponent((page.title as string).replace(/ /g, '_'))}`,
        extract: page.extract || page.description || '',
        imageUrl: page.thumbnail?.source,
      }))
      .filter((article) => article.title.length > 0);

    newsCache.set(normalizedKey, {
      expiresAt: Date.now() + NEWS_TTL_MS,
      value: articles,
    });
    return articles;
  } catch {
    return [];
  }
}
