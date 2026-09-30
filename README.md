# NivaranAI Grievance Platform

An AI-assisted, bilingual (Tamil and English) civic grievance workflow. This repository is a pre-production application; it is not affiliated with a government, does not establish an official complaint channel, and requires an identified operator and service configuration before public launch.

## Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
- **Backend:** Express 4 in `server.ts`; Vite middleware in development and static assets plus the API in production.
- **Authentication and data:** Firebase Authentication and Cloud Firestore. The browser uses Firestore under `firestore.rules`; the server uses Firebase Admin SDK for authorization and AI matching.
- **AI:** Google Gemini called from the Express server. The API key must remain server-side.
- **Package manager / build:** Bun (`bun.lock`); Vite builds the browser app into `dist/client` and esbuild bundles the server into `dist/server.cjs`.
- **Deployment:** No production hosting platform is configured in this repository. The CI workflow runs checks; it does not deploy.

## Main folders and files

```text
src/components/       Citizen, admin, officer, directory, and legal UI
src/context/          Authentication, language, navigation, and shared state
src/data/             2026 election-result snapshot (not a live office-holder directory)
src/lib/firebase.ts   Firebase client initialization
src/services/api.ts   AI API calls and Firestore operations
server.ts             Express API and runtime server
firestore.rules       Firestore authorization and validation rules
tests/                Firestore rules tests
scripts/              Out-of-band admin provisioning helper
```

## Setup

Requirements: Node.js 22 or later, Bun, a Firebase project with Firestore and Authentication enabled, and (for AI features) a Google Gemini API key.

1. Install dependencies: `bun install`
2. Configure the client Firebase app in `firebase-applet-config.json` for your own Firebase project. It is client configuration, not a server secret; apply API restrictions and allowed-domain controls in Firebase/Google Cloud.
3. Copy `.env.example` to `.env` and configure server-only values:
   - `GEMINI_API_KEY` for Gemini features.
   - `FIREBASE_SERVICE_ACCOUNT_JSON` for server-side Firebase Admin authorization.
   - `ADMIN_EMAILS` as a comma-separated server-side admin allowlist.
   - `FIRESTORE_DATABASE_ID` only when overriding the configured named database.
4. Apply `firestore.rules` to the same Firebase project/database. The current client config points to a named database; production must use a project and database owned and approved by the service operator.
5. Start local development: `bun run dev` (Express and Vite use `http://localhost:3000`).

Never commit `.env`, service-account JSON, private keys, access tokens, or user complaint data. The admin provisioning script requires a verified Firebase Auth email and provisions an active record in the selected Firestore database:

With `FIREBASE_SERVICE_ACCOUNT_JSON` securely supplied to the process, run:

```sh
bun run provision-admin admin@example.org
```

Supply the secret via a secret manager rather than shell history in production. Admin access requires a verified account, active `admins/{uid}` registry record, and server email allowlist membership.

## Commands

```sh
bun run dev        # Express + Vite development server
bun run lint       # TypeScript check
bun run test       # Firestore emulator security tests (requires Java)
bun run test:rules # Alias for the Firestore emulator security tests
bun run build      # Production client and server bundles
bun run start      # Run dist/server.cjs after building
```

The Firestore emulator is configured on `127.0.0.1:8080`. CI installs from the lockfile, type-checks, runs the rules tests, and builds; it does not deploy.

## Data and AI handling

- Grievance records may contain names, phone/email details, complaint text, user-entered location, optional GPS coordinates, images, and status history. Records are stored in Firestore and are private under the rules to the submitting citizen and verified active admins.
- Complaint text is sent from the server to Google Gemini for classification and duplicate checks. Admin-triggered resolution drafting also uses grievance summary and location with Gemini. AI output is a suggestion and requires human verification.
- Voice entry uses the browser Web Speech API. The browser or its provider may process audio; provider behavior depends on the browser. Text entry is available as an alternative.
- Image evidence currently uses a client-resized raster data URL stored in the grievance document. Upload size/count/type are constrained in the UI and Firestore rules. Production should move binary files to private object storage with malware scanning and controlled downloads.
- Notifications are disabled until a persistent, access-controlled notification store is configured.
- Demo citizen, complaint, officer, notification, and audit-log seeds were removed from the production source. The voice form’s clearly labeled text presets are examples only and do not create records.

## Privacy, legal, and operational launch requirements

The in-app privacy and terms pages are pre-production notices, not legal advice or a compliance claim. The responsible operator must confirm the actual data flows and vendors, provide its identity and support contact, set retention/deletion and privacy-request processes, and obtain legal review for India’s Digital Personal Data Protection Act, 2023 and the phased commencement of its rules. No payment feature is present, so the app does not publish a refund policy. Firebase authentication persistence is used; optional advertising/analytics tracking was not found in the reviewed source.

Before launch, the operator must also provision real departments and administrators, define officer authentication and role permissions, confirm the Firebase project/database and API restrictions, configure a hosting platform/domain/HTTPS, deploy reviewed Firestore rules, set backups/monitoring, and review the election snapshot against primary official records before presenting any person as a current officeholder.

## Limits

- There is no separate Officer role in the authentication model; the current dashboard is admin-only.
- Firestore document-backed image storage constrains record size and is not a long-term file-storage design.
- No notification delivery provider, data-retention job, citizen deletion workflow, abuse-report workflow, production hosting configuration, or deployment workflow is present.
- The 2026 constituency dataset is an election result snapshot; it is not a verified current officeholder list. Confirm current membership through official sources.

## Official results source

For election-result verification, consult the [Election Commission of India 2026 Tamil Nadu results](https://results.eci.gov.in/ResultAcGenMay2026/). The bundled snapshot is historical and may not reflect later vacancies or changes.
