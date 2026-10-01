# Firestore -> Supabase migration

**Status: partial.** The Supabase schema, security policies and data-import script are in the repo.
The application code (`src/services/api.ts`, `server.ts`) still reads and writes Firestore and has **not**
yet been switched, and nothing here has been built or run against a live Supabase project.

Authentication and the Gemini integration are unchanged. Firebase Auth stays.

## What exists Firestore -> Supabase

| Firestore | Supabase table | Notes |
| --- | --- | --- |
| `grievances/{trackId}` | `grievances` | ID kept as text PK (`GRV-YYYY-XXXXXXXX`); `location` map flattened to `location_*` columns; `feedback` map flattened to `feedback_*`; `entities` map -> `jsonb` |
| `grievances.statusHistory[]` | `grievance_status_history` | one row per entry, FK to `grievances` |
| `grievances.attachments[]` | `grievance_attachments` | one row per entry, FK to `grievances` |
| `departments/{id}` | `departments` | |
| `officers/{id}` | `officers` | FK to `departments` |
| `admins/{uid}` | `admins` | PK is the Firebase UID |
| `auditLogs/{id}` | `audit_logs` | optional FK to `grievances` |
| `notifications` | _not created_ | listed in `firebase-blueprint.json`, but the app never reads or writes it (`getNotifications()` returns `[]`) and `firestore.rules` denies all access |

Timestamps (ISO strings in Firestore) become `timestamptz`. `citizen_id` is the Firebase UID and is deliberately not a foreign key.

## Files

- `supabase/migrations/001_initial_schema.sql`: tables, indexes, `updated_at` triggers, RLS, and a grievance column guard that mirrors the `affectedKeys().hasOnly(...)` rules in `firestore.rules`. Safe to re-run.
- `scripts/migrate-firestore-to-supabase.mjs`: read-only on Firestore, idempotent on Supabase, supports `--dry-run`, and stops before writing if grievances reference departments or officers that do not exist.

## Decision needed before the code switch: how the browser authenticates to Supabase

RLS policies identify the user through `auth.jwt() ->> 'sub'` (the Firebase UID). That works if Supabase
accepts Firebase ID tokens:

- **A. Firebase as a Supabase third-party auth provider** (matches the `VITE_SUPABASE_*` plan): add Firebase under Supabase Authentication > Sign In / Providers > Third-Party Auth, give every Firebase user the custom claim `role: "authenticated"` (Admin SDK `setCustomUserClaims` for existing users, plus a blocking function for new ones), then create the browser client with `accessToken: async () => await auth.currentUser?.getIdToken()`.
- **B. All database access through `server.ts`** with the service-role key kept server-side and the browser calling authenticated API routes. No third-party auth setup, but it adds new endpoints and moves the Firestore calls in `api.ts` behind HTTP.

The schema and policies work with either option.

## Steps to run

1. Create a Supabase project and apply `supabase/migrations/001_initial_schema.sql` (SQL editor or `supabase db push`).
2. Dry run: `npm install --no-save @supabase/supabase-js && node scripts/migrate-firestore-to-supabase.mjs --dry-run`
3. Import: `node scripts/migrate-firestore-to-supabase.mjs`, then compare row counts with Firestore.
4. Re-provision admins into `admins` if you rely on `npm run provision-admin` (that script still writes to Firestore).

## Environment variables

Server / script only (never `VITE_`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Browser (Vercel, Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Keep all existing Firebase variables while Firebase Auth is in use.

## Still Firestore-dependent (to be changed in the code switch)

`src/lib/firebase.ts` (`db`), `src/services/api.ts`, `server.ts` (`requireAdmin`, duplicate check, resolution drafting), `scripts/provision-admin.mjs`, `tests/firestore.rules.test.ts`, `firestore.rules`.
