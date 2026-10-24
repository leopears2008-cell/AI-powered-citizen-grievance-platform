# Master Prompt: Audit, Upgrade, Verify, and Safely Ship NivaranAI

**Target repository:** https://github.com/leopears2008-cell/AI-powered-citizen-grievance-platform  
**Target branch:** `main`  
**Project:** NivaranAI, an AI-powered citizen grievance platform for multilingual complaint lodging, department routing, status tracking, and resolution.

## Mission

Work inside the existing repository. Audit the complete application, improve its visual design, accessibility, functionality, privacy, security, legal disclosures, reliability, and deployment readiness, then commit and push the verified changes to `main` only if repository access and branch protections permit it.

Do not rebuild from scratch. Preserve all working features, the current architecture and tech stack, existing business logic, database records, API contracts, authentication, routes, localization, and deployment integrations unless a specific defect requires a documented, tested change. Do not replace functioning integrations with mock data.

## Non-negotiable safety rules

1. **Inspect before editing.** Read the repository tree, README, package manifests and lockfiles, app entry points, routes, components, styles, server/API code, database schema and migrations, authentication/authorization, environment examples, tests, and deployment configuration.
2. **Establish a baseline.** Identify the package manager from the lockfile; record current build, lint, type-check, and test results before changes where feasible. Do not delete or regenerate a lockfile casually.
3. **Make a prioritized audit first.** Categorize findings as critical, high, medium, or low; cite affected files and explain user impact. Fix security and data-integrity risks before cosmetic improvements.
4. **Keep changes incremental.** Prefer small, coherent edits and reuse installed dependencies and existing design components. Add a dependency only when its value and compatibility are demonstrated.
5. **Protect user data.** Never print secrets, tokens, private complaint details, personal data, or production records in logs, screenshots, test output, or the final report. Do not use real citizen data in tests.
6. **Never fabricate.** Do not invent Tamil Nadu MLA/minister names, contact details, official roles, service statistics, testimonials, ratings, resolution times, certifications, business identity, or legal compliance claims. Verify public-office data against reliable official sources and record source URLs and verification dates. Mark uncertain or stale data for review.
7. **No false completion.** A checklist item is PASS only when verified. If tools, credentials, browser testing, external services, or permissions are unavailable, report NOT VERIFIED and explain what is needed.
8. **No destructive shortcuts.** Do not delete user data, migrations, legacy datasets, working features, required attribution, license notices, or required disclosures. Never force-push, rewrite Git history, disable security checks, or bypass branch protections.
9. **Ask only for essential missing facts.** Use clearly marked owner-confirmation placeholders for business/legal details that cannot be inferred safely. Do not block unrelated engineering work while waiting.
10. **Respect repository conventions.** Follow the existing framework, language, formatting, routing, test tools, naming, and deployment platform unless a measured defect requires a change.

## Phase 1 — Repository and product audit

Inspect the entire repository and map:
- Frontend framework, build system, routing, shared components, CSS/design tokens, responsive breakpoints, assets, localization, and accessibility patterns.
- Backend/API endpoints, request validation, error handling, rate limiting, logging, authentication, authorization, and external integrations.
- Database tables, row-level security/policies, migrations, indexes, data ownership, and persistence behavior.
- Complaint lifecycle: create/submit, validation, acknowledgement, department assignment/routing, status tracking, updates, attachments if supported, notifications, and admin resolution.
- Citizen and admin roles, session handling, protected pages, and server-side authorization.
- MLA directory and minister directory, including data source, last-verified date, search/filter behavior, and empty/error states.
- Environment variables, secret management, CI workflows, hosting configuration, redirects, HTTPS expectations, and error pages.
- Existing tests, accessibility checks, dependency alerts, and known deployment failures.

Create or update a concise audit document with severity, evidence, file paths, proposed fix, and verification method. Do not assume a feature exists merely because it appears in the UI.

## Phase 2 — Design and user experience

Improve the existing product identity with a consistent, professional, civic-service design. The interface should feel trustworthy, clear, calm, and usable by citizens with different levels of digital literacy.

- Use a coherent accessible color system; check text and interactive-state contrast against WCAG 2.2 AA criteria where applicable.
- Improve the hero with a specific explanation of what citizens can do, a concise supporting description, and a prominent action such as **Lodge a grievance** only if that workflow exists.
- Make the main flows easy to find: lodge a grievance, track a grievance, browse departments, view verified MLA/minister information, and reach help/support when those features exist.
- Establish consistent typography, spacing, hierarchy, navigation, content width, cards, form controls, tables, alerts, and buttons.
- Use relevant, licensed visual assets or simple original illustrations. Do not add generic AI stock art just to fill space. Do not copy another site's design or assets.
- Use the project's existing icon library consistently; avoid emoji as interface icons.
- Add restrained transitions only where they improve comprehension. Respect `prefers-reduced-motion`; avoid cursor-following effects, distracting parallax, and excessive scroll-triggered animation.
- Support small mobile screens, tablets, laptops, and wide desktop layouts without horizontal overflow or lost functionality.
- Implement purposeful skeleton/loading, empty, success, validation, offline/network-error, and retry states. Do not leave dead buttons or fake interactions.
- Add meaningful page titles, meta descriptions, favicon, and social metadata that accurately describe the service.
- Keep copy specific and plain-language; remove repetitive AI-sounding copy, false urgency, unsupported claims, and unnecessary decorative elements.
- Do not remove legitimate branding or required disclosures to satisfy aesthetic preferences.

## Phase 3 — Functional correctness and civic-data integrity

Test complete user workflows rather than isolated screens.

### Citizen workflows
- Validate required fields and input limits on both client and server.
- Confirm successful submission persists to the real configured backend/database and returns a truthful acknowledgement.
- Ensure tracking uses the correct authenticated identity or a secure, intentionally designed tracking token; do not expose complaints by guessing IDs.
- Ensure status, department, timestamps, and notifications reflect persisted data, not hardcoded demo values.
- Handle duplicate submissions, failed network calls, expired sessions, and retries safely.

### Admin workflows
- Enforce admin authorization on the server for every privileged action. Hiding admin UI is not authorization.
- Verify that citizens cannot list, read, modify, assign, export, or delete other citizens' complaints unless an explicitly authorized rule permits it.
- Validate role changes, department assignment, status transitions, and administrative inputs server-side.
- Preserve an appropriate audit trail for sensitive administrative changes without storing unnecessary personal information.

### MLA and minister directories
- Preserve existing datasets and legacy comparison files unless the repository proves them redundant and removal is safe.
- Do not fabricate or silently “correct” public-office information. Verify against official Tamil Nadu Legislative Assembly, Tamil Nadu Government, or relevant official sources.
- Display source and last-verified date where practical. Distinguish unverified records from verified records and document gaps.
- Ensure directory search, filtering, detail views, links, and mobile layouts work. Do not present generated contact details as official facts.

### Integrations and localization
- Preserve existing API contracts and integrations. Do not substitute mock data for a failed real integration in production.
- Provide a clearly labeled development/test mode only where already appropriate; never let it silently activate in production.
- Verify supported languages, translated navigation/forms/errors, and language persistence. Avoid claiming multilingual support for languages that are not actually implemented.
- Treat external API results and uploaded content as untrusted input.

## Phase 4 — Privacy, legal, and consent review

First inspect actual data flows, cookies, analytics, third-party scripts, storage, uploads, notifications, logs, and retention. Draft disclosures from observed behavior, not assumptions.

- Create or update a Privacy Policy covering actual data collected, purposes, legal/consent basis as applicable, sharing, processors, retention, security measures, grievance/contact channel, and deletion/correction request process.
- Create or update Terms and Conditions appropriate to the actual service and complaint workflow.
- Add a Cookie Policy only if cookies or similar technologies are used. Add consent controls for non-essential tracking where legally required; do not claim consent is implemented if scripts load before consent.
- Add concise, contextual privacy notices and form consent where required. Do not bundle unrelated consent into a mandatory checkbox.
- Include a Refund/Cancellation Policy only if payments or paid services actually exist. Do not invent refunds, fees, guarantees, company address, registration details, or support contact information.
- Identify the real data fiduciary/business owner, contact details, retention periods, processors, hosting region, and escalation contact as **NEEDS OWNER INPUT** where not verifiable.
- Assess applicable Indian requirements, including the Digital Personal Data Protection Act, rules and commencement provisions in force at implementation time, IT/cybersecurity requirements, and other applicable laws. Verify current requirements from authoritative sources. Do not claim legal compliance based solely on adding policy pages.
- Clearly flag questions that need review by qualified Indian legal/privacy counsel.

## Phase 5 — Accessibility

Target WCAG 2.2 AA where applicable; do not claim conformance without adequate testing.

- Use semantic landmarks and logical heading order.
- Add accurate alt text for informative images and empty alt text for decorative images.
- Ensure all functionality works with keyboard only, with visible focus and no keyboard traps.
- Associate labels, hints, required states, and validation messages with form fields.
- Announce dynamic success/error/status messages appropriately to assistive technology.
- Ensure dialogs, menus, tables, navigation, and focus restoration work accessibly.
- Do not convey status through color alone; include text or icons with accessible names.
- Check zoom/reflow, touch target sizes, contrast, reduced motion, and mobile usability.
- Fix automated findings and manually test the highest-priority flows; document any remaining manual checks.

## Phase 6 — Security and production readiness

- Validate and normalize input on the server using existing compatible validation tools.
- Enforce authentication and authorization on the server for every protected resource and action.
- Review session and cookie flags, password handling, CORS, CSRF where relevant, rate limiting, brute-force protections, and account recovery.
- Prevent injection, XSS, unsafe redirects, path traversal, insecure file uploads, IDOR/BOLA, mass assignment, and excessive data exposure as relevant to the stack.
- Check database permissions and row-level security; use least-privilege service credentials. Never expose service-role keys or private API keys in client bundles.
- Keep secrets in the deployment platform's environment settings. Commit only safe placeholder examples in `.env.example`; never echo secret values.
- Review dependency advisories and remove unused packages only after confirming they are unused. Avoid disruptive upgrades without compatibility checks.
- Ensure production errors do not leak stack traces, secrets, or personal data. Add safe logging and useful correlation IDs where appropriate.
- Verify HTTPS expectations, secure headers, canonical URLs, redirects, not-found pages, and SPA/API routing configuration.
- Ensure persistent data is stored in the intended database, not process memory or temporary files.
- Review backup/recovery and migration safety where relevant. Never run destructive production migrations without explicit approval and a recovery plan.
- Do not claim penetration testing, security certification, or full compliance unless actually performed by an appropriate process.

## Phase 7 — Tests and verification

Use the existing package manager and scripts. Discover the real commands from manifests and CI; do not guess scripts or silently change them just to make checks appear green.

1. Install from the committed lockfile using the repository's supported frozen/clean install mode when available.
2. Run linting, formatting checks, type checks, unit tests, integration tests, and production build where configured.
3. Test critical API routes, validation, authorization boundaries, and error handling.
4. Test complaint submission and tracking, admin updates, directory navigation/search, localization, and notification flows where implemented.
5. Check broken internal links, placeholder routes, dead buttons, missing assets, console errors, and failed network requests.
6. Run dependency/security checks available in the project and report warnings accurately.
7. Test responsive behavior and accessibility using available automated tools plus manual keyboard checks where possible.
8. Review policy statements against actual data collection and storage.
9. Rerun the relevant checks after fixing regressions.
10. Record exact commands, exit status, and limitations. Never report a test as passing if it was not run.

If browser access, service credentials, external integrations, or secrets are unavailable, test safely with mocks in test scope only and mark live integration verification as NOT VERIFIED.

## Phase 8 — Git and delivery to main

- Check `git status`, current branch, remotes, default branch, latest `main` commit, and repository protection rules before changes.
- Work on a dedicated branch if practical, especially for large changes; review the diff and tests before merging. The user has requested delivery to `main`, but do not bypass required reviews or branch protection.
- Never overwrite unrelated user changes, commit secrets, force-push, or use destructive reset/clean commands.
- Use focused commit messages. Push only the intended, reviewed changes.
- If direct push to `main` is permitted and verified, push the validated commit. Otherwise create a feature branch and PR targeting `main`, and report the PR link. Do not claim a push or deployment succeeded without confirmation from GitHub.
- After pushing/merging, verify the remote commit and branch head. If CI/deployment is available, report its actual status; a successful Git push does not prove a successful deployment.

## Required final report

Create/update a concise audit and handoff report containing:

1. **Summary:** key changes and any important regressions or risks.
2. **Checklist:** classify each applicable item as `PASS`, `FIXED`, `NEEDS OWNER INPUT`, or `NOT VERIFIED`; include evidence.
3. **Files changed:** created, modified, and deleted paths with reasons.
4. **Design/accessibility:** concrete changes and tests performed.
5. **Security/privacy:** findings, fixes, and unresolved risks without exposing secrets or personal data.
6. **Legal/data integrity:** owner confirmations, legal-review questions, public-data sources, and verification dates.
7. **Verification:** exact commands and actual results; distinguish automated from manual checks.
8. **Remaining limitations:** blockers and recommended next actions.
9. **Local setup:** exact install, environment setup, development, test, and build commands based on the actual repository.
10. **Deployment:** platform-specific steps and required environment-variable *names* only, never secret values.
11. **Git delivery:** branch, commit SHA, push/PR URL, and confirmed CI/deployment status if available.

## Completion standard

The goal is a maintainable, secure, accessible, truthful civic-service platform—not a visual demo. Preserve working features, protect citizen data, verify official information, and be explicit about everything that remains untested or needs owner/legal confirmation.