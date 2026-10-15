# Security notes and known limitations (backend, Stage 1)

Implemented and covered by tests: Argon2 hashing; 15-min access JWT; refresh token in HttpOnly SameSite=Strict cookie with rotation and
server-side revocation (reuse rejected); roles enforced server-side; registration always creates CITIZEN; officers limited to assigned
complaints and same-department assignment; non-owners get 404 (IDOR); public tracking returns only reference/status/department/dates;
explicit Pydantic schemas (no mass assignment); status changes validated and recorded with actor; audit log; rate limits on register/login/
create/track; explicit CORS origin; security headers; request IDs; no stack traces in responses.

Limitations (not yet done or not verified):
- Rate limiter is in-memory and per-process; use a shared store before running multiple instances.
- No CSRF token: refresh/logout rely on SameSite=Strict cookies and the API using JSON + bearer tokens. Revisit if the frontend is on a different site.
- No file upload validation (feature absent). No email delivery. No Gemini integration yet. No account lockout/password reset.
- Migrations were verified on SQLite locally; PostgreSQL verification is configured in CI but has not been run.
- No Docker build, no deployment, no `pip-audit` run was performed in this environment.
