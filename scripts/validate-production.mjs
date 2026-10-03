const required = ['NODE_ENV', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'ADMIN_EMAILS', 'CORS_ORIGINS', 'GEMINI_API_KEY', 'PUBLIC_API_URL'];
const missing = required.filter((key) => !process.env[key]);
const production = process.env.NODE_ENV === 'production';
const hardening = ['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','REQUIRE_DISTRIBUTED_RATE_LIMIT','CLAMAV_SCAN_URL','REQUIRE_MALWARE_SCAN','GRIEVANCE_STORAGE_BUCKET','NEWS_PROVIDER','NEWS_API_KEY'].filter((key) => !process.env[key]);
if (production && missing.length) {
  console.error(JSON.stringify({ ok: false, missing }));
  process.exit(1);
}
if (production && process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === 'true' && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
  console.error('Distributed rate limiting is required but credentials are missing.'); process.exit(1);
}
if (production && process.env.REQUIRE_MALWARE_SCAN === 'true' && !process.env.CLAMAV_SCAN_URL) {
  console.error('Malware scanning is required but CLAMAV_SCAN_URL is missing.'); process.exit(1);
}
if (production && process.env.NEWS_PROVIDER === 'newsapi' && !process.env.NEWS_API_KEY) {
  console.error('NEWS_PROVIDER=newsapi requires NEWS_API_KEY.'); process.exit(1);
}
console.log(JSON.stringify({ ok: true, production, missingOptionalHardening: production ? hardening : [] }));
