# Production News Provider

The current Tamil Nadu live-news feature uses a server-side Google News RSS adapter. The browser does not fetch the RSS feed directly, which avoids exposing a feed request to client-side CORS behavior and keeps query limits/caching on the server.

For production/commercial use, review the current Google News feed terms and the terms of every linked publisher. Google News RSS is an aggregation feed, not a license to republish article content. The UI should keep headlines, publisher attribution and links to the original publisher rather than copying full article text.

The backend is intentionally isolated behind `/api/news/tamil-nadu` so a licensed news provider can replace the adapter without changing the UI. Do not claim a news provider is licensed unless the operator has an actual contract/approved account.

## Implementation notes

- Endpoint: `GET /api/news/tamil-nadu?category=<breaking|government|education|public-services|transport>&lang=<en|ta>&limit=<1-20>` (implemented in `server/newsService.ts`, mounted in `server.ts`).
- "Breaking" means the most recent (last 24 hours) Tamil Nadu coverage; Google News RSS has no breaking-news flag.
- Responses contain only plain-text titles/sources, validated `https:` links and ISO timestamps (`null` when the feed gives none). Feed HTML is never forwarded.
- Results are cached in memory per language and category (`NEWS_CACHE_TTL_SECONDS`, default 600). If the feed fails, the last good copy (up to 6 hours old) is returned with `stale: true`; with nothing cached the API returns HTTP 502 `NEWS_UNAVAILABLE`. No placeholder articles are ever generated.
- The cache is per server instance. Multiple instances each fetch independently.
- `scripts/validate-production.mjs` still requires `NEWS_PROVIDER=newsapi` and `NEWS_API_KEY` in production. The `newsapi` adapter is not implemented, so the Google RSS service ignores both variables.
