"""Create an ADMIN or OFFICER account. Credentials come from the environment, never source code.

  ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="..." python -m scripts.provision_admin [--role OFFICER --department dept-water]
"""
import argparse
import os
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.entities import Role, User


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--role", choices=["ADMIN", "OFFICER"], default="ADMIN")
    p.add_argument("--department")
    args = p.parse_args()
    email, password = os.environ.get("ADMIN_EMAIL", "").lower(), os.environ.get("ADMIN_PASSWORD", "")
    if not email or len(password) < 12:
        print("Set ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars) in the environment.", file=sys.stderr)
        return 1
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)):
            print("User already exists; nothing changed.", file=sys.stderr)
            return 1
        db.add(User(email=email, password_hash=hash_password(password), full_name=os.environ.get("ADMIN_NAME", email),
                    role=Role(args.role), department_id=args.department))
        db.commit()
    print(f"Created {args.role} {email}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
