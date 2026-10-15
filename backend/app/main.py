import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.routes import auth, complaints, staff
from app.core.config import get_settings
from app.db.session import SessionLocal

log = logging.getLogger("nivaranai")


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    app = FastAPI(title="NivaranAI API", version="0.1.0",
                  docs_url=None if settings.is_production else "/docs",
                  redoc_url=None, openapi_url="/api/v1/openapi.json")
    app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_url], allow_credentials=True,
                       allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex
        try:
            response = await call_next(request)
        except Exception:
            log.exception("unhandled error request_id=%s path=%s", rid, request.url.path)  # no body logged
            return JSONResponse({"detail": "Internal server error.", "request_id": rid}, status_code=500)
        response.headers.update({"X-Request-ID": rid, "X-Content-Type-Options": "nosniff",
                                 "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin"})
        return response

    api = "/api/v1"
    app.include_router(auth.router, prefix=api)
    app.include_router(complaints.router, prefix=api)
    app.include_router(staff.admin, prefix=api)
    app.include_router(staff.officer, prefix=api)
    app.include_router(staff.system, prefix=api)

    @app.get("/health")
    @app.get(f"{api}/health")
    def health():
        return {"status": "ok"}

    @app.get("/ready")
    def ready():
        try:
            with SessionLocal() as s:
                s.execute(text("SELECT 1"))
        except Exception:
            return JSONResponse({"status": "unavailable"}, status_code=503)
        return {"status": "ready"}

    return app


app = create_app()
