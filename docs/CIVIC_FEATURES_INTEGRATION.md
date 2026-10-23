# Civic feature integration notes

This commit adds the database foundation and pure domain helpers for the five requested civic features.

## Included
- `supabase/migrations/008_civic_proof_feedback.sql`: evidence coordinates, incident clusters, one-vote-per-citizen records, resolution challenge/OTP hash storage, SLA level fields, and private-table RLS defaults.
- `server/civicFeatures.ts`: coordinate validation and 50 m distance check, SLA level helpers, text similarity candidate scoring, citizen-feedback decision logic, and a constrained Tamil/Tanglish petition prompt.

## Required before production
These are foundational modules, not a claim that the complete user experience is already wired into the app. The existing root `server.ts` must call these helpers from authenticated routes and persist changes through the server-side Supabase client. Add a scheduler/worker for SLA deadlines; implement OTP generation, delivery, rate limiting, hashed storage, and one-time verification; wire camera/location capture and after-photo uploads; and add frontend voting/voice review UI. Browser geolocation and EXIF metadata are user-supplied evidence and must never be treated as cryptographic proof. Never put Supabase service-role keys in frontend code.

Suggested validation commands:
```bash
npm ci
npm run lint
npm test
npm run build
```
