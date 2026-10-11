import secrets
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError

from app.core.config import get_settings

_hasher = PasswordHasher()
_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous characters


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, password)
    except VerificationError:
        return False


def create_token(subject: str, token_type: str, expires: timedelta) -> str:
    now = datetime.now(UTC)
    payload = {"sub": subject, "type": token_type, "iat": now, "exp": now + expires, "jti": uuid.uuid4().hex}
    return jwt.encode(payload, get_settings().secret_key, algorithm="HS256")


def decode_token(token: str, expected_type: str) -> dict:
    payload = jwt.decode(token, get_settings().secret_key, algorithms=["HS256"])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("wrong token type")
    return payload


def generate_reference_number() -> str:
    """Non-guessable public reference, e.g. NVR-7K3Q-M9XA-4TPD (~60 bits of entropy)."""
    chunks = ["".join(secrets.choice(_ALPHABET) for _ in range(4)) for _ in range(3)]
    return "NVR-" + "-".join(chunks)
