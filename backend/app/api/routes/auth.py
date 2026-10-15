import uuid
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.ratelimit import rate_limit
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.db.session import get_db
from app.dependencies.auth import current_user
from app.models.entities import RevokedToken, Role, User
from app.schemas.api import LoginIn, RegisterIn, TokenOut, UserOut
from app.services.complaints import audit

router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE = "nvr_refresh"
_DUMMY_HASH = hash_password("timing-equalizer")


def _issue(response: Response, user: User) -> TokenOut:
    s = get_settings()
    refresh = create_token(str(user.id), "refresh", timedelta(days=s.refresh_token_days))
    response.set_cookie(REFRESH_COOKIE, refresh, httponly=True, secure=s.is_production, samesite="strict",
                        max_age=s.refresh_token_days * 86400, path="/api/v1/auth")
    return TokenOut(access_token=create_token(str(user.id), "access", timedelta(minutes=s.access_token_minutes)))


@router.post("/register", response_model=UserOut, status_code=201, dependencies=[Depends(rate_limit("register", 5))])
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    # Role is always CITIZEN here; staff accounts are provisioned by scripts/provision_admin.py.
    user = User(email=email, password_hash=hash_password(body.password), full_name=body.full_name, role=Role.CITIZEN)
    db.add(user)
    db.flush()
    audit(db, user, "auth.register", "user", str(user.id))
    db.commit()
    return user


@router.post("/login", response_model=TokenOut, dependencies=[Depends(rate_limit("login", 10))])
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    ok = verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
    if not (user and ok and user.is_active):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.")
    audit(db, user, "auth.login", "user", str(user.id))
    db.commit()
    return _issue(response, user)


@router.post("/refresh", response_model=TokenOut)
def refresh(response: Response, nvr_refresh: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    bad = HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired. Please sign in again.")
    if not nvr_refresh:
        raise bad
    try:
        payload = decode_token(nvr_refresh, "refresh")
    except jwt.PyJWTError:
        raise bad from None
    if db.get(RevokedToken, payload["jti"]):
        raise bad
    user = db.get(User, uuid.UUID(payload["sub"]))
    if not user or not user.is_active:
        raise bad
    # Rotate: revoke the used refresh token and issue a new pair.
    db.add(RevokedToken(jti=payload["jti"], expires_at=datetime.fromtimestamp(payload["exp"], UTC)))
    db.commit()
    return _issue(response, user)


@router.post("/logout", status_code=204)
def logout(response: Response, nvr_refresh: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if nvr_refresh:
        try:
            p = decode_token(nvr_refresh, "refresh")
            if not db.get(RevokedToken, p["jti"]):
                db.add(RevokedToken(jti=p["jti"], expires_at=datetime.fromtimestamp(p["exp"], UTC)))
                db.commit()
        except jwt.PyJWTError:
            pass
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user
