# Test report (actually executed, local sandbox, Python 3.12.3)

| Command (in `backend/`) | Result |
|---|---|
| `python -m pytest -q` | 20 passed, 2 deprecation warnings |
| `ruff check .` | All checks passed |
| `alembic upgrade head` / `downgrade base` / `upgrade head` (SQLite) | succeeded |
| `scripts.seed_dev`, `scripts.provision_admin`, production seed refusal | behaved as expected |

Not run: frontend lint/typecheck/tests/build, Playwright, PostgreSQL, Docker, pip-audit, any deployment.
