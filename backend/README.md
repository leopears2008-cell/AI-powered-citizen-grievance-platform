# NivaranAI - FastAPI migration (in progress)

This branch adds a Python/FastAPI + SQLAlchemy + Alembic backend under `backend/`. The original Express/React app is unchanged on `main`.
See `../docs/MIGRATION_AUDIT.md` for what is done and what is not, `../docs/SECURITY_AND_LIMITATIONS.md`, and `../docs/TEST_REPORT.md`.

## Run the backend locally
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export SECRET_KEY="$(python -c 'import secrets;print(secrets.token_urlsafe(48))')"
export DATABASE_URL=sqlite:///./dev.db      # or a PostgreSQL URL
alembic upgrade head
python -m scripts.seed_dev                   # dev departments only
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' python -m scripts.provision_admin
uvicorn app.main:app --reload                # docs at http://localhost:8000/docs
python -m pytest -q
```
Docker (from the repo root): copy `backend/.env.example` to `backend/.env`, set `POSTGRES_PASSWORD` and `SECRET_KEY`, then `docker compose up --build` (not yet tested).
