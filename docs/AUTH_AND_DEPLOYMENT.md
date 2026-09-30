# Authentication, verification and deployment notes

## How citizen verification works

1. A visitor browses anonymously (Firebase anonymous session). Anonymous sessions cannot file grievances.
2. The citizen verifies by **phone OTP** (Firebase Phone Authentication + reCAPTCHA) or by **email** (Firebase Email/Password + verification link). The app never generates or stores OTPs or passwords.
3. `GrievanceForm` is only rendered when Firebase reports a phone number or a verified email, `api.createComplaint` re-checks this, and `firestore.rules` independently requires the matching `phone_number` or `email_verified` claim in the ID token.
4. After verification the client calls `POST /api/auth/session-sync`. The server verifies the ID token with the Admin SDK and writes:
   - `users/{uid}`: `uid`, `displayName`, `phoneVerified`, `emailVerified`, `verificationMethod`, `preferredLanguage`, `createdAt`, `updatedAt`.
   - audit records `USER_REGISTERED`, `PHONE_VERIFIED`, `EMAIL_VERIFIED` (one per uid, deterministic IDs, so repeated calls never duplicate them).
5. After a grievance is created the client calls `POST /api/audit/grievance-created`; the server records `GRIEVANCE_CREATED` only if the grievance exists and belongs to the caller.

`users` and server-written audit records are not readable or writable by clients (`firestore.rules` denies everything not explicitly allowed). Phone numbers and email addresses are intentionally **not** copied into `users` or the audit log; they stay in Firebase Authentication and on the grievance itself.

### Not recorded, and why

`LOGIN_SUCCESS` / `LOGIN_FAILED` are not logged. A failed login has no verified identity, so a public endpoint to record it could be spammed to flood the audit log. Firebase Authentication's own sign-in logs (Identity Platform) are the right source for these.

### Duplicate submissions

`createComplaint` joins a double click to the in-flight request, reuses the same tracking ID when an identical submission is retried after a failure, and if Firestore denies the retry because the first write already landed it returns that existing grievance instead of an error.

## Firebase Console checklist

- Authentication > Sign-in method: enable **Anonymous**, **Phone**, **Email/Password**.
- Authentication > Settings > Authorized domains: add `localhost` and your production host.
- Phone: review SMS region policy and quotas; add test numbers for development if needed.
- Email: customise the verification email template and action URL.
- Deploy rules: `firebase deploy --only firestore:rules`.

## Environment variables

Server-only (never expose to the browser): `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `ADMIN_EMAILS`, optional `FIRESTORE_DATABASE_ID`. Without `FIREBASE_SERVICE_ACCOUNT_JSON`, every authenticated API route (AI analysis, duplicate check, session sync) answers 503.

Client-safe overrides: `VITE_FIREBASE_*` (see `.env.example`).

## Deployment

The app is an Express server (`server.ts`, compiled to `dist/server.cjs`) that serves the built client from `dist/client` and hosts the AI/audit API. It therefore needs a **Node or container host**:

```bash
npm run build   # builds dist/client and dist/server.cjs
npm start       # NODE_ENV=production, honours PORT (default 3000)
```

A `Dockerfile` is provided for container hosts (Cloud Run, Render, Railway, Fly.io). Set the server-only variables in the host's secret store, then add the deployed host to Firebase Authorized domains.

**Vercel:** deploying only the static client to Vercel will load the UI, but `/api/*` (AI classification, session sync) will not exist, so complaint filing would fail. Running this app on Vercel requires first converting `server.ts` into serverless functions; that has not been done. Note that `vercel.json` in the repository is currently an empty file, which Vercel rejects as invalid JSON; replace it with a valid config or remove it before connecting the repo to Vercel.
