# NivaranAI migration audit (Stage 1)

**Status:** only ZIP (10) has been audited. ZIP (12) was not provided, so no comparison or merge with it has happened.
Nothing from ZIP (12) is claimed anywhere in this branch.

## ZIP (10) inventory
99 files, ~10.8k lines of TS/TSX. Express backend (`server.ts` 1264 lines + `server/*.ts`), React 19 + Vite + Tailwind 4 frontend,
Firebase Auth, Supabase (PostgreSQL) for data, Gemini via `@google/genai`, Upstash Redis rate limiting, Render + Vercel config,
Bun-based CI, 12 Node test files, Supabase SQL migrations 001-007.

## Express endpoints found -> FastAPI target
| Express (ZIP 10) | FastAPI | Stage 1 |
|---|---|---|
| `POST /api/grievances`, `GET /api/grievances[/:id]` | `/api/v1/complaints` | done |
| `POST /api/grievances/:id/status` | `/admin/.../status`, `/officer/.../status` | done |
| `POST /api/grievances/:id/assign` | `/admin/complaints/{id}/assign` | done |
| `POST /api/grievances/:id/feedback` | `/complaints/{id}/feedback` | done |
| `GET /api/notifications` | `/api/v1/notifications` | done (read-marking not yet) |
| `GET /api/admin/audit-logs` | `/admin/audit-logs` | done |
| `GET /api/admin/analytics`, `/api/public/transparency` | `/admin/analytics`, public transparency | **not started** (dashboard counts only) |
| `POST /api/ai/*` (chat, analyze, duplicates, suggest-resolution, complaint-quality, intelligence) | `/api/v1/ai/*` | **not started**; rule-based fallback ported |
| `GET /api/news/tamil-nadu` | news provider | **not started** |
| `/api/site-settings`, officer escalate, verify-resolution, escalation-scan | - | **not started** |
| attachments upload/download, ClamAV scan | - | **table only; no upload code** |
| Upstash distributed rate limit | - | in-memory limiter only (see limitations) |

## Logic ported
- `workflow.ts` -> `app/services/workflow.py`. Statuses changed to the spec's lifecycle (SUBMITTED...CLOSED, plus REJECTED/REOPENED).
  The original's "AI Classified" status was dropped; this is a deliberate change, not a faithful port.
- `grievanceIntelligence.ts` -> `app/services/intelligence.py` (routing keywords, severity, SLA, Jaccard duplicate score), including Tamil terms.

## Decisions / known issues found in ZIP (10)
1. `firebase-applet-config.json` is committed to the repo (project id, web API key, OAuth client id). Firebase web keys are not secret,
   but the file should be removed from git and supplied via env. It is not copied into this branch.
2. Two files named `003_*.sql` exist in `supabase/migrations`; ordering is ambiguous.
3. Admin authorization is an `ADMIN_EMAILS` allowlist, repeated in several places. Replaced by a DB role enforced by `require_roles`.
4. CI uses Bun; spec calls for npm/pip. New backend CI is in `docs/ci/backend-ci.yml` (move it to `.github/workflows/` yourself: the connector used for this push cannot write workflow files).
5. `.gitignore` ignores `.env*` correctly.
6. Auth: the new backend uses its own email/password + JWT. The spec forbids running Firebase and a second system together
   without a migration plan. **Open decision:** keep Firebase tokens (verify in Python) or migrate users. Existing Firebase/Supabase data is NOT migrated.

## Not done in this stage
Frontend restructure, TanStack Query / RHF / Zod adoption, React Router, Vitest/Playwright, Gemini integration, file uploads,
data migration from Supabase/Firestore, deployment verification. The Express code remains untouched on `main`.
