# Security, privacy, accessibility, and production audit

Audit scope: static review of the repository source, configuration, rules, build setup, and test setup, followed by TypeScript, build, and Firestore-rules checks. No production Firebase project was accessed, no live user records were read, and no deployed website or real credentials were tested. This is an engineering review, not a legal compliance certification.

## Architecture map

| Area | Implementation |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind 4; `src/App.tsx` mounts the views; `src/context/AppContext.tsx` owns language, navigation, toast, Firebase session, and derived citizen/admin role. |
| Backend | Express 4 in `server.ts`; JSON API for AI analysis, duplicate matching, and admin resolution drafting. Vite middleware serves development; `dist/client` is served in production. |
| Database | Cloud Firestore; browser operations use Firebase Web SDK from `src/services/api.ts`; authorization is defined in `firestore.rules`. Firebase Admin is used for privileged server lookups. |
| Authentication | Firebase Authentication: anonymous citizen sessions; email/password admin sign-in; verified email, `admins/{uid}` active record, and server `ADMIN_EMAILS` allowlist. No distinct officer identity/role flow is implemented. |
| AI/external services | Server-side Google Gemini calls; browser Web Speech API for voice transcription. No configured outbound notification provider. |
| State and routing | React context and component state; single-page conditional view switching in `src/App.tsx`. No separate router library. |
| Package/build | Bun lockfile and scripts; Vite client build; TypeScript server compilation; TypeScript `--noEmit` check; Bun tests and Firebase Rules Unit Testing emulator tests. |
| Files | One client-side raster image attachment is encoded into a grievance document. No private object-storage service or malware scanner is configured. |
| Deployment | No production host/domain/deploy workflow is configured. CI verifies changes only. |
| Data/config | `firebase-applet-config.json` selects Firebase project/database. Secrets are expected from environment variables documented in `.env.example`; `.env*` is ignored except `.env.example`. |

## Critical

### Public grievance isolation and status-write scope — fixed in source

- **Paths:** `firestore.rules`, `tests/firestore.rules.test.ts`.
- **Problem:** Rules now make reads citizen-owned or verified-admin-only, but the former rules did not fully constrain citizen creation, allowed admin-wide mutation, and allowed audit-record alteration.
- **Why it matters:** Grievances contain PII and location; writable audit history and unrestricted document fields weaken accountability and integrity.
- **Fix:** Require matching Firebase UID and tracking/document ID, bounded/allowlisted fields, safe attachment data URLs, bounded location coordinates and strings, a single initial `Submitted` event, and controlled citizen feedback. Admin updates are restricted to status/assignment/resolution fields; grievance deletion and audit update/delete are denied. Audit logs are append-only under the client rules.
- **Change:** Implemented and covered by emulator tests; run result is reported separately.

### Admin verification/revocation — fixed in source

- **Paths:** `firestore.rules`, `src/context/AppContext.tsx`, `server.ts`, `scripts/provision-admin.mjs`.
- **Problem:** Previous admin checks did not consistently require a verified email and an active admin registry record at every trust boundary.
- **Why it matters:** Unverified or revoked accounts could reach protected data or privileged APIs.
- **Fix:** Client and Firestore check verified email plus `admins/{uid}.active`; protected server APIs additionally check `ADMIN_EMAILS`; provisioning refuses unverified Firebase users and targets the configured named database.
- **Change:** Implemented. Production Firebase claims, service-account permissions, allowlist, and actual admin registry remain operator configuration to verify.

### Production database, legal operator, and retention — unresolved before launch

- **Paths:** `firebase-applet-config.json`, `src/components/LegalPage.tsx`, `README.md`.
- **Problem:** Repository selects a configured Firebase project/database, but ownership/production purpose, retention schedule, deletion/privacy-request process, operator identity, and contact channel are not established by source.
- **Why it matters:** A public grievance service needs a confirmed data controller/operator, production data safeguards and documented user-facing handling. DPDP Act, 2023 applicability and current rules/guidance require legal confirmation.
- **Fix:** Operator must select/confirm Firebase project and database, define access/backup/retention/deletion, support/request channels, and obtain counsel’s review of the real data flow, consent, vendor terms/location and notices. MeitY notified the DPDP Rules in 2025 with phased commencement; the operator must map obligations to the dates provisions take effect, including the one-year and eighteen-month phases, rather than assume every section is already operative. See the [Rules and commencement notifications](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025686cadad39.pdf).
- **Change:** Notices now disclose known Firebase, Gemini, and browser speech paths and explicitly state these gaps; no compliance claim is made. Legal/business decisions remain unconfirmed.

## High

### Complaint images and PII — mitigated, storage architecture remains

- **Paths:** `src/components/GrievanceForm.tsx`, `firestore.rules`, `README.md`.
- **Problem:** Client accepted arbitrary images and stored raw DataURLs in Firestore.
- **Why it matters:** Spoofed file formats, oversized documents, public links, and document-size exhaustion can expose or disrupt grievance records.
- **Fix:** UI accepts JPEG/PNG/WebP, decodes/re-encodes via canvas, limits dimensions to 12 MP, limits one processed image to 400 KB and filename length; rules constrain URL MIME, encoded length, and keys. No public attachment-serving route exists; grievance read rules apply to the embedded data.
- **Change:** Client/rule limits implemented. Upload content is not virus-scanned, database document storage is not a durable binary storage design, and document-size limits should be load-tested. Move evidence to private object storage with authorization, quotas, malware scanning, and retention lifecycle before production.

### AI and third-party processing — mitigated, vendor decisions remain

- **Paths:** `server.ts`, `src/components/GrievanceForm.tsx`, `src/components/LegalPage.tsx`.
- **Problem:** Complaint classification, duplicate matching, resolution drafts, and voice recognition involve external processing.
- **Why it matters:** Complaint text may contain personal/sensitive details; model output can hallucinate routing or falsely assert a resolution.
- **Fix:** AI endpoints authenticate Firebase users; admin drafting requires admin authorization. Duplicate matching reads real active Firestore records and sends bounded summary/category/district rather than contact/location/track ID fields. AI output is bounded and duplicate identifiers are mapped only to supplied candidates. Pre-analysis notice/consent names Gemini, Firestore storage, and browser speech-provider processing. Resolution fallback now labels itself as a draft and does not assert completion without verified notes.
- **Change:** Implemented. Gemini data-retention/training terms, region, timeout/cost controls, service-owner approval, and model quality remain to confirm. Resolution prompts still contain grievance summary and incident location, so operator/vendor review is required.

### Fake records and official claims — mitigated, dataset needs periodic validation

- **Paths:** `src/data/seedData.ts` (removed), `server.ts`, `src/components/InteractiveMap.tsx`, `src/data/mlaProfiles.ts`, `src/data/tnAssembly2026.ts`, `src/components/MLADirectory.tsx`, `src/App.tsx`.
- **Problem:** Demo citizen/staff/complaint records, fabricated map counts/incidents, synthetic avatar requests, and government/“verified current MLA” language could be mistaken for live service data.
- **Why it matters:** Fake civic records, public-authority claims, and stale official listings harm trust and may expose names in third-party image requests.
- **Fix:** Removed unused seed record module and retired seed-backed endpoints; map now selects a district without incident counts or fake IDs; avatars are local placeholders; government command-center language was removed; constituency records are explicitly labeled as an election snapshot and link to ECI results.
- **Change:** Implemented. The bundled election roster originates from third-party/secondary sources and must not be presented as a current official roster. Review every displayed name, party, vacancy, note, Tamil rendering, and source against primary records before using the directory for public decisions. ECI results are a primary results source, not a live membership/vacancy register.

### Production runtime and build — fixed in source, final verification required

- **Path:** `server.ts`, `vite.config.ts`, `scripts/build-server.mjs`, `package.json`.
- **Problem:** Server previously had no complete production start/static-serving path, and the analytics route ended as an incomplete handler at end-of-file. The Vite/esbuild config bundling path also failed to access an ancestor directory in this restricted Windows checkout.
- **Why it matters:** Deployment could fail with EOF/build errors or start no server; client assets could be served from the wrong output directory.
- **Fix:** Server API/file tail is complete with health route, development Vite middleware, production static serving, listen and shutdown handling. Vite writes to `dist/client`; TypeScript emits the external-dependency CommonJS server to `dist/server.cjs` without Vite/esbuild scanning inaccessible parent directories.
- **Change:** Implemented. Build must pass in the final local check and CI before release. A large Vite bundle warning remains; split lazy routes/charts if measurement shows meaningful impact.

### Roles and officer access — unresolved product/security boundary

- **Paths:** `src/context/AppContext.tsx`, `src/components/OfficerPortal.tsx`, `src/services/api.ts`, `firestore.rules`.
- **Problem:** Types/UI refer to CITIZEN/OFFICER/ADMIN, but authentication and rules implement anonymous citizen plus admin, not a separately authenticated/authorized officer role. Admin currently performs assignment and status work.
- **Why it matters:** Real officer assignment, least privilege and officer-only complaint scope cannot be enforced without a trustworthy server-side role and ownership model.
- **Fix:** Before enabling an officer workflow, define verified officer identities, department scope, permitted status transitions, and authorization checks in rules/server; test that officer A cannot access department B.
- **Change:** Not invented. Officer-role business/identity model remains a deployment decision.

## Medium

### Notifications and audit evidence

- **Paths:** `server.ts`, `src/services/api.ts`, `firestore.rules`.
- **Problem:** Notification persistence/delivery is disabled; audit records are append-only under client rules but do not constitute tamper-proof external audit storage.
- **Why it matters:** Users may assume SMS/email notifications or immutable compliance logs exist when they do not.
- **Fix:** Legacy notification routes return unavailable; UI state is empty until an access-controlled store and verified delivery provider exist. Audit updates/deletes are blocked by client rules.
- **Change:** Implemented to fail closed. Production requires notification provider/privacy disclosure and restricted server-only audit writes/export/retention/monitoring.

### Feedback schema mismatch and unauthorized user status writes

- **Paths:** `src/services/api.ts`, `firestore.rules`.
- **Problem:** Feedback now consistently uses `feedback`; citizen rules only permit bounded feedback and `updatedAt`, not arbitrary status edits.
- **Why it matters:** Inconsistent analytics and status tampering could misrepresent resolution or hide an unresolved complaint.
- **Fix:** Shared field name and rule allowlists; admin can set only selected operational fields.
- **Change:** Implemented and tested in rules suite.

### Privacy notice, cookies and payments

- **Paths:** `src/components/LegalPage.tsx`, `src/App.tsx`, `src/context/AppContext.tsx`.
- **Problem:** Previous generic notice omitted concrete data paths and showed a refund page despite no payment flow.
- **Why it matters:** Users should understand AI, image, voice and storage processing; irrelevant payment terms can misstate the service.
- **Fix:** Updated English/Tamil pre-production notices; no refund/cancellation UI is shown because this app has no payment feature. Cookie/storage notice describes Firebase authentication persistence and absence of intentional ad/optional analytics code in source reviewed.
- **Change:** Implemented; service operator/contact and final legal wording remain required.

### Geolocation, upload events, and accessible voice dialog

- **Paths:** `src/components/GrievanceForm.tsx`, `src/components/VoiceInputModal.tsx`, `server.ts`.
- **Problem:** GPS previously populated a fabricated place and fixed coordinates; upload callbacks retained an event target asynchronously; the voice dialog lacked dialog semantics and showed a random waveform unrelated to microphone input. The server also blocked geolocation by policy.
- **Why it matters:** Fake location and misleading recording state undermine user trust; controls need keyboard/screen-reader support.
- **Fix:** GPS stores coordinates only after explicit user action; address/district are user-entered and editing clears captured coordinates. File input is captured before asynchronous callbacks. Voice UI has a labeled modal, Escape/focus cycling, live status text, and audio processing disclosure. Permissions-Policy now allows same-origin geolocation and microphone only.
- **Change:** Implemented. Browser/device accessibility testing is still required.

### Error reporting and account enumeration

- **Paths:** `src/components/AdminDashboard.tsx`, `src/components/AdminLogin.tsx`, `server.ts`.
- **Problem:** Dashboard data failures were silent; login returned detailed account errors; malformed/oversized API bodies could use Express's default error response.
- **Why it matters:** Silent failure impairs operations; detailed auth errors aid account discovery; default parser errors may expose technical details.
- **Fix:** Dashboard displays a generic retryable error; login uses a generic failure message; API returns bounded generic JSON errors. Logs avoid request bodies, credentials, tokens, and complaint content.
- **Change:** Implemented. No external error-monitoring service is configured.

## Low

- **Path:** `src/components/MLADirectory.tsx`; **issue:** some directory labels and notes remain English in Tamil UI; **why:** uneven accessibility for Tamil-language users; **fix:** complete professional Tamil translation review before launch; **change:** partly translated, remaining content flagged.
- **Path:** `src/components/AdminDashboard.tsx`; **issue:** admin workflows and much of the interface remain English; **why:** staff who need Tamil may have difficulty; **fix:** translate labels, validation, errors, tables, and dialogs; **change:** not fully implemented.
- **Path:** `src/services/api.ts`; **issue:** complaint lists and analytics load whole collections for admin; **why:** cost/latency and memory increase with volume; **fix:** Firestore indexes, query pagination, server aggregation; **change:** not implemented.
- **Path:** `server.ts`; **issue:** in-memory rate limits are per process; **why:** resets on restart and does not coordinate across replicas; **fix:** shared limiter/store at deployment; **change:** process-local limits remain.
- **Path:** client bundle; **issue:** production JS chunk exceeds Vite's 500 KB advisory threshold; **why:** slower download on constrained networks; **fix:** measure and split routes/charts if beneficial; **change:** build warns; no arbitrary threshold suppression added.

## Not applicable in the reviewed source

- **Refund/cancellation policy:** no payment, subscription, checkout or payment SDK is implemented; no refund policy is displayed.
- **Cookie-consent banner:** no intentional optional analytics or advertising pixel was found. Firebase Authentication can use browser-managed persistence. Reassess if non-essential tracking is introduced or deployment embeds add trackers.
- **SQL/NoSQL injection:** no SQL or general-purpose user-built Firestore query is present; Firestore operations use SDK document/query methods. Still validate all untrusted data as rules/API do.
- **Payment processing:** no payment flow exists.
- **Government affiliation/certification:** not established; production notices explicitly state that this software does not establish affiliation or certification.

## Verification performed (30 September 2026)

- `bun run lint` — passed (`tsc --noEmit`, exit code 0).
- `bun run build` — passed (exit code 0); Vite emitted a 961 KB main JavaScript chunk and its non-fatal >500 KB advisory. Route-level code splitting reduced initially-loaded page code; further splitting should be based on production performance measurements.
- `node scripts/start-server.mjs` followed by `GET /healthz` — passed (`{"status":"ok"}`). No Firebase Admin secret was present, so protected server endpoints correctly remain unavailable in this environment.
- `bun run test:rules` — not executed successfully locally because Java is not installed/on PATH; Firebase Emulator requires Java. GitHub CI installs Java 21 and runs this suite. No claim of a passing rules test is made until that workflow completes.
- Browser console, visual mobile/tablet/desktop, screen-reader, end-to-end login/IDOR, live Firebase rules/data, dependency vulnerability scan, backup restore, and production deployment checks were not performed in this repository-only review.

## Launch checklist — operator decisions and verification

- [ ] Confirm service owner, lawful purpose, public authority (if any), support contact and emergency/support numbers.
- [ ] Obtain counsel review for DPDP Act, 2023 and current rules/guidance, notices, consent/legal basis, transfers, user requests, and retention/deletion.
- [ ] Confirm Firebase project, named database, region, access, backups, recovery, API key restrictions, Auth domains, Firestore rules deployment and live rules tests.
- [ ] Set verified admin allowlist; provision only verified accounts; test revocation. Define distinct officer identity/department permissions before enabling officers.
- [ ] Remove any existing demo data from production only after the operator identifies it and approves a safe, backed-up cleanup plan. This audit did not read or change cloud data.
- [ ] Provision and verify actual department/officer records. Confirm live list sources; do not deploy an unverified current MLA directory.
- [ ] Configure private object storage, file scanning/quota/access/retention or disable file attachments until it is ready.
- [ ] Configure provider-approved Gemini data handling, timeouts, budget/rate limit, monitoring and fallback behavior.
- [ ] Configure hosting/domain/HTTPS, proxy-aware shared rate limiting, server secrets, health checks, error monitoring, backups, restore drill and deployment workflow.
- [ ] Run automated checks and manual keyboard/screen-reader, Tamil-language, responsive, network-failure, IDOR and production-like role tests.
- [ ] Confirm support and deletion/privacy-request paths are operational before accepting real complaints.
