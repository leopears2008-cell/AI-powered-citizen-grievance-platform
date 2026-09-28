# NivaranAI Production-Readiness Audit

Audit date: 28 September 2026
Scope: uploaded `AI-powered-citizen-grievance-platform-main` repository.

## Architecture found

- React 19 + Vite + TypeScript frontend.
- Express + Vite server (`server.ts`) for AI endpoints and static hosting.
- Firebase Firestore for grievance data.
- Firebase Authentication is now used for anonymous citizen sessions and email/password admin authentication.
- Gemini API key is server-side only.
- Previous Supabase authentication was removed from the application path.
- Admin dashboard is now a protected application surface; there is no client-side role switcher.

## Critical issues found and fixed

1. **Firestore was completely open.**
   - Original rules allowed unrestricted reads and writes.
   - Replaced with authenticated, least-privilege rules.
   - Citizen sessions can access only their own grievances.
   - Admins are identified by a protected `admins/{uid}` registry.
   - Admin records cannot be created/edited from the client.

2. **Admin access was only UI state.**
   - Original role buttons allowed anyone to switch to ADMIN.
   - Removed role switching and Officer/Admin role buttons from the public UI.
   - Added dedicated admin login using Firebase email/password.
   - Admin login requires verified email plus an active admin registry record.
   - Server-side admin APIs additionally require a verified Firebase token and `ADMIN_EMAILS`.

3. **Sensitive operational endpoints were unauthenticated.**
   - Added Firebase token verification and admin authorization.
   - Added rate limiting and security headers.
   - Legacy volatile complaint/analytics/audit endpoints are disabled.

4. **Hard-coded/demo metrics were presented as real.**
   - Removed fabricated grievance totals, SLA percentages, satisfaction scores, AI accuracy and benchmark claims.
   - Analytics now calculates from accessible grievance records.

5. **Potentially misleading government/certification claims.**
   - Removed Government of Tamil Nadu, GIGW, ISO/IEC 27001 and production-certification language from the UI.
   - Removed the unverified political representative directory and citizen-to-MLA escalation workflow from the active UI.

6. **CSV formula injection risk.**
   - Export now neutralizes spreadsheet formulas beginning with `=`, `+`, `-`, or `@`.
   - CSV fields are quoted and escaped.

7. **File upload risk and Firestore document-size risk.**
   - Citizen evidence is restricted to one image below 400 KB.
   - Firestore rules enforce the attachment count and URL length.
   - Production should move large files to controlled object storage rather than embedding them in Firestore documents.

8. **AI prompt-injection and output-trust issues.**
   - Complaint text is explicitly treated as untrusted data.
   - AI confidence is no longer forced into an artificially high range.
   - AI output is normalized against allowed categories/priorities/departments and length-limited.
   - AI output remains assistive and requires human verification for consequential administrative action.

## High-priority issues fixed

- Server request body limit reduced from 10 MB to 1 MB.
- AI input length capped at 10,000 characters.
- Resolution-drafting input length capped.
- Raw exception messages are no longer returned to users for key AI/create paths.
- Production security headers added, including CSP, HSTS, frame protection, MIME sniffing protection, Referrer-Policy and Permissions-Policy.
- Vite `allowedHosts: all` removed.
- Admin password reset added with account-enumeration-resistant UI messaging.
- Citizen feedback can update only feedback fields; citizens can no longer directly change grievance status.
- Citizen tracking is constrained to the authenticated anonymous citizen session rather than allowing arbitrary grievance reads.
- Default personal-looking phone number removed.
- Fake sample tracking IDs removed from the tracking UI.
- Notifications are disabled until a persistent access-controlled notification store is configured, instead of showing seeded fake notifications.

## Privacy/legal work implemented

Added:
- Privacy Policy page.
- Terms & Conditions page.
- Cookie & Local Storage Policy.
- Refund/Cancellation Policy.
- Explicit privacy confirmation before grievance submission.
- Data-minimization guidance.
- Legal disclaimer that the policy text is an implementation template, not legal advice.

### DPDP status

India's Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025 must be assessed against the actual production data flows. The notified Rules use a phased commencement schedule, so the applicable obligations depend on the relevant provision and effective date.

The current implementation is **not declared legally compliant**. The following require organization-specific/legal work:
- verified Data Fiduciary/business identity;
- final itemized privacy notice;
- actual processing purposes and lawful basis/consent design;
- retention/deletion schedule;
- processor/vendor register and contracts;
- rights-request workflow;
- grievance/contact mechanism;
- security incident/breach procedures;
- cross-border/data-location assessment where applicable;
- child-data handling if the service is made available to children;
- final review of whether any sector-specific government/public-service requirements apply.

## Cookies and tracking

Static source review found no intentional advertising pixel, Google Analytics tag, Facebook pixel, `document.cookie`, `localStorage`, or `sessionStorage` usage in the application source.

Firebase Authentication can maintain browser-managed authentication state. No optional advertising/analytics SDK is intentionally loaded by the reviewed code. Therefore a consent banner is not used merely to fabricate compliance. If optional analytics/tracking is added later, it must be gated by an appropriate consent mechanism before loading.

## Accessibility fixes

- Added visible `:focus-visible` outlines.
- Added reduced-motion support.
- Increased interactive target sizing.
- Admin login uses explicit labels, autocomplete hints, status messaging and semantic form controls.
- Removed unnecessary role-switcher interaction.
- Existing meaningful images retain alt text; external avatar/evidence assets were replaced with local placeholders.
- Dialogs and complex existing components still require manual keyboard/screen-reader verification.

## Technical quality

- Corrected an existing `seedData.ts` category/type mismatch.
- Replaced the Deno CI workflow with Node/TypeScript/build verification.
- Removed unused Supabase application authentication path and module.
- Added Firebase admin provisioning script.
- Added production environment examples.
- Removed unnecessary external image dependencies from the active application.
- Added production metadata/title/description/robots/theme metadata.

## Files changed

- `.env.example`
- `.github/workflows/deno.yml`
- `firestore.rules`
- `index.html`
- `package.json`
- `vite.config.ts`
- `server.ts`
- `src/App.tsx`
- `src/context/AppContext.tsx`
- `src/services/api.ts`
- `src/lib/firebase.ts`
- `src/lib/supabase.ts` — removed
- `bun.lock` — removed because it referenced the removed Supabase dependency and did not contain the new Firebase Admin dependency; regenerate a lockfile with the chosen package manager.
- `src/components/AdminLogin.tsx` — added
- `src/components/LegalPage.tsx` — added
- `src/components/Header.tsx`
- `src/components/AdminDashboard.tsx`
- `src/components/AnalyticsView.tsx`
- `src/components/GrievanceForm.tsx`
- `src/components/CitizenTracker.tsx`
- `src/components/HeroSection.tsx`
- `src/components/InteractiveMap.tsx`
- `src/components/OfficerPortal.tsx` — removed as an unused officer surface.
- `src/components/MLADirectory.tsx` — removed as an unused/unverified political-directory surface.
- `src/data/mlaProfiles.ts` — removed with the directory.
- `src/data/seedData.ts`
- `src/locales/translations.ts`
- `src/index.css`
- `scripts/provision-admin.mjs` — added
- `public/avatar-placeholder.svg` — added
- `public/evidence-placeholder.svg` — added

## Verification

### Static TypeScript check

The source was checked with the available global TypeScript compiler.

Result:
- No remaining project-level TypeScript errors were reported after filtering out missing third-party dependency modules.
- Full typecheck cannot be completed in this environment because the uploaded repository did not contain `node_modules`.

### Dependency installation

`npm install` could not complete in the audit environment because external package retrieval timed out. An offline installation was also unavailable because the required packages were not cached.

Therefore:
- Production build: **Requires manual verification after dependency installation.**
- Runtime browser testing: **Requires manual verification after dependency installation.**
- ESLint/lint runtime: **Requires manual verification after dependency installation.**

The corrected CI workflow now runs dependency installation, TypeScript checking and the production build on GitHub.

## Required production setup before launch

1. Enable Firebase Authentication:
   - Anonymous authentication.
   - Email/password authentication.
   - Email verification.

2. Create an administrator Firebase user.

3. Provision that user:
   `npm run provision-admin -- admin@example.com`
   with `FIREBASE_SERVICE_ACCOUNT_JSON` configured securely.

4. Configure server-only:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`
   - `ADMIN_EMAILS`
   - `GEMINI_API_KEY`

5. Deploy the new Firestore rules.

6. Verify the production Firebase project/database IDs and do not reuse development seed data unintentionally.

7. Run `npm install`, `npm run lint`, and `npm run build` in CI/local environment.

8. Test with:
   - anonymous citizen;
   - non-admin authenticated user;
   - authorized admin;
   - revoked admin;
   - expired token;
   - direct Firestore access;
   - direct admin API calls;
   - oversized image upload;
   - malicious CSV values;
   - prompt-injection complaint text.

## Remaining manual-review items

### Critical/High
- Production Firebase rules deployment and authorization tests.
- Production service-account secret handling and rotation.
- Actual Firestore backup/restore and disaster-recovery plan.
- Data retention/deletion implementation.
- Privacy rights request workflow.
- Final DPDP/legal review.
- Vendor/processor and data-transfer review.
- Production security monitoring and alerting.
- Dependency vulnerability scanning and lockfile regeneration.

### Medium
- Move attachments to Firebase Storage/object storage with strict content-type/size rules.
- Add structured server audit logging with durable storage.
- Add automated end-to-end tests.
- Add automated accessibility testing (axe/Lighthouse) and manual screen-reader testing.
- Verify mobile layout on real devices.
- Verify all empty/loading/error states.

### Low
- Review any future role-specific modules before reintroducing them; the unused Officer/MLA surfaces were removed from this build.
- Regenerate the package lockfile using the chosen package manager after dependency changes.

## Final readiness assessment

**Not production-ready until the Firebase/DPDP/legal configuration and dependency/build verification are completed.**

The major architectural authorization flaw and the unrestricted Firestore rules have been addressed in source code. The remaining blockers are primarily deployment configuration, legal/data-governance decisions, persistent operational infrastructure, and runtime verification that cannot be truthfully completed without the real Firebase project, production credentials and installed dependencies.