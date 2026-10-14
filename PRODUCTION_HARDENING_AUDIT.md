# NivaranAI Production Hardening Audit

Audit date: 2026-10-14
Branch: `codex/nivaranai-production-hardening`

## Scope and verification limits

This report is based on direct inspection of the repository's default branch files through GitHub. It is a source review, not a live penetration test. No dependency installation, local build, test suite, or production deployment was run as part of this audit.

## Confirmed findings

### Critical — grievance data access rules are too permissive

File: `firestore.rules`

The rules permit unauthenticated `get` for any syntactically valid grievance ID and permit `list` for everyone. The create/update rules also do not require a signed-in user or enforce ownership/role permissions. Grievance records can contain personal information, so these rules must be redesigned before production use.

**Safe remediation needed:** define and migrate an explicit ownership field (for example, Firebase UID) and trusted role claims; test citizen, officer, and administrator access in the Firebase Emulator Suite before deploying rules. Do not deploy a rule change that assumes fields are present before existing records are migrated.

### Critical — Express API has no visible authentication middleware

File: `server.ts`

The AI routes shown in the source are registered directly, without visible Firebase token verification or role middleware. Complaint and administrative routes also need a route-by-route authorization review.

**Safe remediation needed:** verify Firebase ID tokens server-side, centralize authentication and authorization middleware, and enforce least-privilege permissions per route. Do not trust client-supplied role, user ID, or officer assignment values.

### High — in-memory data is used as the server's primary store

File: `server.ts`

Complaints, departments, officers, notifications, and audit logs are initialized from seed arrays in process memory. This state is not durable and will diverge across restarts or multiple instances.

**Safe remediation needed:** agree on one production source of truth and migrate each workflow deliberately. The repository currently contains Firebase client usage and Supabase server configuration/migration artifacts, so the target architecture must be made consistent before removing either database.

### High — mock API data is merged into Firestore results

File: `src/services/api.ts`

The complaint listing reads Firestore and then appends records from `/api/complaints` when their IDs are absent. The detail lookup also falls back to the mock API. This can make demo data appear to be real user data.

**Safe remediation needed:** use explicit development-only fixtures; production lists and detail views should return only persisted records from the selected database.

### High — deployment routing needs a backend architecture decision

File: `vercel.json`

The Vercel rewrite sends every route to `/index.html`. The configuration builds only the Vite client, while the project also has an Express API server. Unless the API is separately hosted and the frontend uses its public base URL correctly, API requests may not reach the backend.

**Safe remediation needed:** document and configure one supported deployment arrangement. Verify client API base URL, backend URL, CORS, health check, and a real API request in the deployed environment.

### High — production configuration mixes Firebase and Supabase requirements

Files: `scripts/validate-production.mjs`, `.env.example`, `src/lib/supabase.ts`, `src/services/api.ts`

The production validator requires Supabase service credentials and Firebase Admin credentials, while the frontend grievance service directly uses Firestore. A Supabase client file also contains placeholder fallback values.

**Safe remediation needed:** choose the authoritative database for each domain, remove unused configuration only after import/reference checks, and fail clearly when required runtime configuration is absent. Do not require optional provider secrets without a real feature dependency.

### Medium — AI provider model identifier needs verification

File: `server.ts`

The code requests `gemini-3.6-flash`. Verify that this model ID is supported for the configured Google GenAI API and account. Do not replace it with another guessed model ID.

### Medium — Firebase initialization uses an unsafe TypeScript cast

File: `src/lib/firebase.ts`

The code reads `firestoreDatabaseId` through `as any`, even though the checked-in app configuration does not define that property. This audit branch changes initialization to use the default Firestore database explicitly.

## Change made on this branch

- `src/lib/firebase.ts`: removed the `as any` cast and initialized the default Firestore database explicitly.

This is a narrow type-safety correction. It does not resolve the broader authorization, database, or deployment issues.

## Tests and build status

Not run in this audit environment:
- `npm ci`
- `npm run lint`
- `npm test`
- `npm run validate:production`
- `npm run build`
- `npm run test:e2e`
- Firebase Emulator security-rule tests
- Live deployment/API checks

The repository includes a `package-lock.json`, `tests/production.hardening.test.mjs`, and `tests/e2e.workflow.test.mjs`; therefore, these test files are present on the inspected branch. Their passing status is unverified.

## Recommended order of work

1. Fix Firestore authorization design and add emulator tests, including cross-user isolation.
2. Inventory all Express routes and add Firebase token verification and role-based authorization.
3. Decide the canonical production database and migrate safely with backup/rollback.
4. Remove mock-data merging from production paths.
5. Correct deployment routing and configure frontend-to-backend connectivity.
6. Verify the Gemini model ID and validate AI output/error handling.
7. Run install, type-check, tests, production build, and end-to-end tests in CI.
8. Review secrets, evidence storage, logs, rate limits, backup/restore, and live deployment before declaring production-ready.

## Production readiness conclusion

**Not production-ready yet.** The source review found security and reliability blockers. The narrow Firebase initialization fix is committed on this branch, but it is not a complete hardening implementation and no test/build success is claimed.
