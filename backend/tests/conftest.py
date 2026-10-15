import os

os.environ["SECRET_KEY"] = "test-secret-key-test-secret-key-0123456789"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ENVIRONMENT"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core import ratelimit
from app.core.security import hash_password
from app.db.session import Base, get_db
from app.main import create_app
from app.models.entities import Department, User


@pytest.fixture()
def db_factory():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with factory() as s:
        s.add_all([Department(id="dept-water", name="Water Supply"), Department(id="dept-roads", name="Roads")])
        s.commit()
    return factory


@pytest.fixture()
def client(db_factory):
    ratelimit.reset()
    app = create_app()

    def override():
        with db_factory() as s:
            yield s

    app.dependency_overrides[get_db] = override
    return TestClient(app)


PASSWORD = "correct-horse-battery"


def make_staff(db_factory, email, role, dept="dept-water"):
    with db_factory() as s:
        u = User(email=email, password_hash=hash_password(PASSWORD), full_name=email.split("@")[0],
                 role=role, department_id=dept)
        s.add(u)
        s.commit()
        return str(u.id)


def login(client, email, password=PASSWORD):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def citizen(client):
    client.post("/api/v1/auth/register", json={"email": "c1@example.com", "password": PASSWORD, "full_name": "Citizen One"})
    return login(client, "c1@example.com")
