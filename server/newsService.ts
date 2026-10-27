import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import { NEWS_CATEGORIES, NewsCategory, NewsItem, NewsLanguage, NewsResponse } from '../src/types';

/**
 * Tamil Nadu live-news adapter (Google News RSS).
 *
 * - The browser never talks to the feed; only this service does.
 * - The upstream host is fixed and the only inputs are allow-listed enums, so there is no SSRF surface.
 * - Feed text is reduced to plain text and every link is validated; no feed HTML is ever returned.
 * - Results are cached in memory, concurrent requests share one upstream call, and the last good copy is
 *   served (flagged `stale`) if the feed is temporarily unavailable.
 * - Nothing is fabricated: if the feed cannot be read and nothing is cached, callers get an error.
 */

const FEED_HOST = 'https://news.google.com/rss/search';
const MAX_ITEMS_STORED = 20;
const MAX_FEED_BYTES = 2_000_000;
const MAX_STALE_MS = 6 * 60 * 60 * 1000;
const EMPTY_RESULT_TTL_MS = 2 * 60 * 1000;

type QuerySet = Record<NewsCategory, string>;

// Google News has no "breaking" flag, so "breaking" means the most recent (last 24h) Tamil Nadu coverage.
const QUERIES: Record<NewsLanguage, { hl: string; ceid: string; q: QuerySet }> = {
  en: {
    hl: 'en-IN',
    ceid: 'IN:en',
    q: {
      breaking: 'Tamil Nadu when:1d',
      government: 'Tamil Nadu Government OR "TN Government" when:7d',
      education: 'Tamil Nadu education OR schools OR university OR TNPSC when:7d',
      'public-services': 'Tamil Nadu ration OR "water supply" OR electricity OR "public services" when:7d',
      transport: 'Tamil Nadu transport OR TNSTC OR "Chennai Metro" OR railway when:7d',
    },
  },
  ta: {
    hl: 'ta',
    ceid: 'IN:ta',
    q: {
      breaking: 'தமிழ்நாடு when:1d',
      government: 'தமிழ்நாடு அரசு when:7d',
      education: 'தமிழ்நாடு கல்வி OR பள்ளி OR பல்கலைக்கழகம் when:7d',
      'public-services': 'தமிழ்நாடு குடிநீர் OR மின்சாரம் OR ரேஷன் when:7d',
      transport: 'தமிழ்நாடு போக்குவரத்து OR பேருந்து OR மெட்ரோ when:7d',
    },
  },
};

export class NewsUnavailableError extends Error {
  constructor(message = 'News feed is temporarily unavailable') {
    super(message);
    this.name = 'NewsUnavailableError';
  }
}

export const isNewsCategory = (v: unknown): v is NewsCategory =>
  typeof v === 'string' && (NEWS_CATEGORIES as readonly string[]).includes(v);

export const isNewsLanguage = (v: unknown): v is NewsLanguage => v === 'en' || v === 'ta';

// ---------------------------------------------------------------------------
// Sanitisation helpers (exported for unit tests)
// ---------------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, body: string) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? m;
  });
}

/** Reduces any feed value to bounded plain text: no tags, no control characters, collapsed whitespace. */
export function toPlainText(input: unknown, maxLength = 300): string {
  let s = typeof input === 'string' ? input : typeof input === 'number' ? String(input) : '';
  const stripTags = (v: string) =>
    v
      .replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi, ' ')
      .replace(/<[^>]*>/g, ' ');
  s = stripTags(s);
  s = decodeEntities(s);
  s = stripTags(s); // entities may have decoded into markup
  s = s.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > maxLength ? `${s.slice(0, maxLength - 1).trimEnd()}…` : s;
}

/** Returns a normalised absolute https URL, or null. Rejects other schemes, credentials, and IP/localhost hosts. */
export function safeHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return null;
  if (host.includes(':') || /^[\d.]+$/.test(host)) return null; // IPv6 / IPv4 literals
  return url.toString();
}

export function parsePublishedAt(raw: unknown, now = Date.now()): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  if (ms > now + 24 * 60 * 60 * 1000) return null; // implausible future timestamp
  return new Date(ms).toISOString();
}

function textOf(node: unknown): string {
  if (node && typeof node === 'object' && '#text' in (node as Record<string, unknown>)) {
    return toPlainText((node as Record<string, unknown>)['#text'], 120);
  }
  return toPlainText(node, 120);
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  isArray: (name) => name === 'item',
});

/** Parses RSS XML into validated NewsItems. Throws NewsUnavailableError if the payload is not an RSS feed. */
export function parseFeed(xml: string, category: NewsCategory, now = Date.now()): NewsItem[] {
  if (typeof xml !== 'string' || !xml.trim()) throw new NewsUnavailableError('Empty feed response');
  // Refuse DTDs/entity declarations outright (XML entity-expansion attacks).
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new NewsUnavailableError('Unexpected feed format');

  let doc: any;
  try {
    doc = parser.parse(xml);
  } catch {
    throw new NewsUnavailableError('Unreadable feed response');
  }
  const channel = doc?.rss?.channel;
  if (!channel || typeof channel !== 'object') throw new NewsUnavailableError('Unexpected feed format');

  const rawItems: unknown[] = Array.isArray(channel.item) ? channel.item : [];
  const seen = new Set<string>();
  const items: NewsItem[] = [];

  for (const raw of rawItems) {
    const item = raw as Record<string, unknown>;
    const url = safeHttpsUrl(typeof item.link === 'string' ? item.link : undefined);
    let title = toPlainText(item.title, 240);
    if (!url || !title) continue;

    let source = textOf(item.source);
    if (source) {
      const suffix = ` - ${source}`;
      if (title.endsWith(suffix) && title.length > suffix.length) title = title.slice(0, -suffix.length).trimEnd();
    } else {
      // Google News appends " - Publisher" to titles; use it only when the <source> tag is missing.
      const cut = title.lastIndexOf(' - ');
      if (cut > 0 && title.length - cut - 3 <= 60) {
        source = title.slice(cut + 3).trim();
        title = title.slice(0, cut).trimEnd();
      }
    }
    if (!title) continue;

    const dedupeKey = `${url}|${title.toLowerCase()}`;
    const titleKey = title.toLowerCase();
    if (seen.has(dedupeKey) || seen.has(titleKey)) continue;
    seen.add(dedupeKey);
    seen.add(titleKey);

    items.push({
      id: createHash('sha1').update(url).digest('hex').slice(0, 16),
      title,
      source: source || 'Unknown source',
      url,
      publishedAt: parsePublishedAt(item.pubDate, now),
      category,
    });
  }

  items.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  return items.slice(0, MAX_ITEMS_STORED);
}

export function buildFeedUrl(category: NewsCategory, language: NewsLanguage): string {
  const cfg = QUERIES[language];
  const params = new URLSearchParams({ q: cfg.q[category], hl: cfg.hl, gl: 'IN', ceid: cfg.ceid });
  return `${FEED_HOST}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Service with caching, request coalescing and stale-on-error
// ---------------------------------------------------------------------------

export interface NewsServiceOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
  ttlMs?: number;
  timeoutMs?: number;
}

interface CacheEntry {
  response: NewsResponse;
  storedAt: number;
  expiresAt: number;
}

export function createNewsService(options: NewsServiceOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const ttlMs = options.ttlMs ?? 10 * 60 * 1000;
  const timeoutMs = options.timeoutMs ?? 8000;
  const cache = new Map<string, CacheEntry>();
  const inflight = new Map<string, Promise<NewsResponse>>();

  async function fetchFeed(category: NewsCategory, language: NewsLanguage): Promise<NewsResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(buildFeedUrl(category, language), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
          'User-Agent': 'NivaranAI-NewsReader/1.0',
        },
      });
      if (!res.ok) throw new NewsUnavailableError(`Upstream responded with ${res.status}`);
      const declared = Number(res.headers.get('content-length') ?? 0);
      if (declared > MAX_FEED_BYTES) throw new NewsUnavailableError('Feed response too large');
      const xml = await res.text();
      if (xml.length > MAX_FEED_BYTES) throw new NewsUnavailableError('Feed response too large');
      const items = parseFeed(xml, category, now());
      return { category, language, provider: 'google-news-rss', fetchedAt: new Date(now()).toISOString(), stale: false, items };
    } catch (err) {
      if (err instanceof NewsUnavailableError) throw err;
      throw new NewsUnavailableError('Could not reach the news feed');
    } finally {
      clearTimeout(timer);
    }
  }

  async function getNews(category: NewsCategory, language: NewsLanguage, limit = 9): Promise<NewsResponse> {
    const key = `${language}:${category}`;
    const cap = Math.min(Math.max(Math.trunc(limit) || 9, 1), MAX_ITEMS_STORED);
    const slice = (r: NewsResponse): NewsResponse => ({ ...r, items: r.items.slice(0, cap) });

    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return slice(cached.response);

    let pending = inflight.get(key);
    if (!pending) {
      pending = fetchFeed(category, language)
        .then((fresh) => {
          const ttl = fresh.items.length ? ttlMs : Math.min(ttlMs, EMPTY_RESULT_TTL_MS);
          cache.set(key, { response: fresh, storedAt: now(), expiresAt: now() + ttl });
          return fresh;
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, pending);
    }

    try {
      return slice(await pending);
    } catch (err) {
      if (cached && now() - cached.storedAt <= MAX_STALE_MS) {
        return slice({ ...cached.response, stale: true });
      }
      throw err instanceof NewsUnavailableError ? err : new NewsUnavailableError();
    }
  }

  return { getNews, clearCache: () => cache.clear() };
}

const envTtl = Number(process.env.NEWS_CACHE_TTL_SECONDS);
export const newsService = createNewsService({
  ttlMs: Number.isFinite(envTtl) && envTtl >= 30 ? envTtl * 1000 : undefined,
});
