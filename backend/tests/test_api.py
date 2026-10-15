from sqlalchemy import select

from app.models.entities import AuditLog, Role
from tests.conftest import PASSWORD, login, make_staff

BODY = {"title": "Water pipe burst", "description": "A water pipe has burst near the school gate.",
        "location": "Anna Nagar", "district": "Chennai", "language": "en"}


def test_register_login_me(client, citizen):
    r = client.get("/api/v1/auth/me", headers=citizen)
    assert r.status_code == 200 and r.json()["role"] == "CITIZEN"


def test_register_ignores_role_injection(client):
    r = client.post("/api/v1/auth/register", json={"email": "x@example.com", "password": PASSWORD,
                                                   "full_name": "Mallory", "role": "ADMIN"})
    assert r.status_code == 201 and r.json()["role"] == "CITIZEN"


def test_duplicate_email_and_weak_password(client, citizen):
    dup = client.post("/api/v1/auth/register", json={"email": "c1@example.com", "password": PASSWORD, "full_name": "Again"})
    assert dup.status_code == 409
    weak = client.post("/api/v1/auth/register", json={"email": "n@example.com", "password": "short", "full_name": "Nope"})
    assert weak.status_code == 422


def test_bad_login_and_missing_token(client, citizen):
    assert client.post("/api/v1/auth/login", json={"email": "c1@example.com", "password": "wrong-password"}).status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_refresh_rotation_and_logout(client):
    client.post("/api/v1/auth/register", json={"email": "r@example.com", "password": PASSWORD, "full_name": "Refresh Me"})
    client.post("/api/v1/auth/login", json={"email": "r@example.com", "password": PASSWORD})
    old = client.cookies.get("nvr_refresh")
    assert client.post("/api/v1/auth/refresh").status_code == 200
    client.cookies.set("nvr_refresh", old, path="/api/v1/auth")
    assert client.post("/api/v1/auth/refresh").status_code == 401  # reused token rejected
    client.post("/api/v1/auth/login", json={"email": "r@example.com", "password": PASSWORD})
    assert client.post("/api/v1/auth/logout").status_code == 204
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_create_and_track_privacy(client, citizen):
    r = client.post("/api/v1/complaints", json=BODY, headers=citizen)
    assert r.status_code == 201
    ref = r.json()["reference_number"]
    assert ref.startswith("NVR-") and r.json()["department_id"] == "dept-water"
    pub = client.get(f"/api/v1/complaints/track/{ref}")
    assert pub.status_code == 200
    assert set(pub.json()) == {"reference_number", "status", "department_id", "created_at", "updated_at"}
    assert client.get("/api/v1/complaints/track/NVR-AAAA-BBBB-CCCC").status_code == 404


def test_invalid_complaint_rejected(client, citizen):
    assert client.post("/api/v1/complaints", json={**BODY, "title": "x"}, headers=citizen).status_code == 422
    assert client.post("/api/v1/complaints", json={**BODY, "language": "fr"}, headers=citizen).status_code == 422
    assert client.post("/api/v1/complaints", json=BODY).status_code == 401


def test_idor_other_citizen_cannot_read(client, citizen):
    cid = client.post("/api/v1/complaints", json=BODY, headers=citizen).json()["id"]
    client.post("/api/v1/auth/register", json={"email": "c2@example.com", "password": PASSWORD, "full_name": "Citizen Two"})
    other = login(client, "c2@example.com")
    assert client.get(f"/api/v1/complaints/{cid}", headers=other).status_code == 404
    assert client.get("/api/v1/complaints", headers=other).json()["total"] == 0


def test_citizen_forbidden_from_staff_routes(client, citizen):
    assert client.get("/api/v1/admin/dashboard", headers=citizen).status_code == 403
    assert client.get("/api/v1/officer/complaints", headers=citizen).status_code == 403


def test_full_lifecycle_with_audit_and_feedback(client, db_factory, citizen):
    make_staff(db_factory, "admin@example.com", Role.ADMIN, dept=None)
    off_id = make_staff(db_factory, "off@example.com", Role.OFFICER)
    admin, officer = login(client, "admin@example.com"), login(client, "off@example.com")
    cid = client.post("/api/v1/complaints", json=BODY, headers=citizen).json()["id"]

    assert client.patch(f"/api/v1/admin/complaints/{cid}/status", json={"status": "RESOLVED"}, headers=admin).status_code == 409
    assert client.patch(f"/api/v1/admin/complaints/{cid}/assign", json={"officer_id": off_id}, headers=admin).status_code == 200
    assert client.get(f"/api/v1/officer/complaints/{cid}", headers=officer).status_code == 200
    assert client.patch(f"/api/v1/officer/complaints/{cid}/status", json={"status": "REJECTED"}, headers=officer).status_code == 409
    assert client.post(f"/api/v1/complaints/{cid}/feedback", json={"rating": 5}, headers=citizen).status_code == 409  # too early
    for s in ("IN_PROGRESS", "RESOLVED"):
        assert client.patch(f"/api/v1/officer/complaints/{cid}/status", json={"status": s}, headers=officer).status_code == 200

    assert client.post(f"/api/v1/complaints/{cid}/feedback", json={"rating": 9}, headers=citizen).status_code == 422
    assert client.post(f"/api/v1/complaints/{cid}/feedback", json={"rating": 5}, headers=citizen).status_code == 201
    assert client.post(f"/api/v1/complaints/{cid}/feedback", json={"rating": 4}, headers=citizen).status_code == 409

    detail = client.get(f"/api/v1/complaints/{cid}", headers=citizen).json()
    assert [h["to_status"] for h in detail["history"]] == ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"]
    notes = client.get("/api/v1/notifications", headers=citizen).json()
    assert any("Resolved" in n["message"] for n in notes)
    with db_factory() as s:
        actions = {a.action for a in s.scalars(select(AuditLog))}
    assert {"complaint.create", "complaint.status", "complaint.feedback", "auth.login"} <= actions


def test_officer_cannot_touch_unassigned_complaint(client, db_factory, citizen):
    make_staff(db_factory, "off2@example.com", Role.OFFICER)
    officer = login(client, "off2@example.com")
    cid = client.post("/api/v1/complaints", json=BODY, headers=citizen).json()["id"]
    assert client.get(f"/api/v1/officer/complaints/{cid}", headers=officer).status_code == 404
    assert client.patch(f"/api/v1/officer/complaints/{cid}/status", json={"status": "IN_PROGRESS"}, headers=officer).status_code == 404


def test_assign_rejects_wrong_department_officer(client, db_factory, citizen):
    make_staff(db_factory, "admin@example.com", Role.ADMIN, dept=None)
    roads_officer = make_staff(db_factory, "roads@example.com", Role.OFFICER, dept="dept-roads")
    admin = login(client, "admin@example.com")
    cid = client.post("/api/v1/complaints", json=BODY, headers=citizen).json()["id"]
    assert client.patch(f"/api/v1/admin/complaints/{cid}/assign", json={"officer_id": roads_officer}, headers=admin).status_code == 422


def test_rate_limit_on_login(client):
    codes = [client.post("/api/v1/auth/login", json={"email": "a@example.com", "password": "x"}).status_code for _ in range(12)]
    assert 429 in codes


def test_health_and_ready(client):
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/api/v1/health").status_code == 200
