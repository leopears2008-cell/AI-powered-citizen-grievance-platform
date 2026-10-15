import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import current_user, require_roles
from app.models.entities import AuditLog, Complaint, Notification, Role, User, utcnow
from app.schemas.api import AssignIn, ComplaintOut, DepartmentOut, StatusChange, UserOut
from app.services import complaints as svc
from app.services.workflow import Status, officer_can_transition

admin = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles(Role.ADMIN))])
officer = APIRouter(prefix="/officer", tags=["officer"])
system = APIRouter(tags=["system"])


@admin.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    by_status = dict(db.execute(select(Complaint.status, func.count()).group_by(Complaint.status)).all())
    overdue = db.scalar(select(func.count()).where(
        Complaint.sla_due_at < utcnow(), Complaint.status.not_in([Status.RESOLVED, Status.CLOSED, Status.REJECTED])))
    return {"by_status": {str(k): v for k, v in by_status.items()}, "overdue": overdue,
            "total": sum(by_status.values())}


@admin.get("/complaints")
def admin_complaints(db: Session = Depends(get_db), limit: int = 50):
    rows = db.scalars(select(Complaint).order_by(Complaint.created_at.desc()).limit(min(limit, 100))).all()
    return [ComplaintOut.model_validate(r, update={"history": []}) for r in rows]


@admin.patch("/complaints/{complaint_id}/assign", response_model=ComplaintOut)
def assign(complaint_id: uuid.UUID, body: AssignIn, admin_user: User = Depends(current_user),
           db: Session = Depends(get_db)):
    c = svc.get_by_id(db, complaint_id)
    off = db.get(User, body.officer_id)
    if not off or off.role != Role.OFFICER or not off.is_active:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The selected user is not an active officer.")
    if c.department_id and off.department_id != c.department_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Officer belongs to a different department.")
    c.assigned_officer_id = off.id
    svc.change_status(db, c, Status.ASSIGNED, admin_user, f"Assigned to {off.full_name}")
    db.add(Notification(user_id=off.id, complaint_id=c.id, message=f"Complaint {c.reference_number} was assigned to you."))
    db.commit()
    db.refresh(c, ["history"])
    return c


@admin.patch("/complaints/{complaint_id}/status", response_model=ComplaintOut)
def admin_status(complaint_id: uuid.UUID, body: StatusChange, admin_user: User = Depends(current_user),
                 db: Session = Depends(get_db)):
    c = svc.change_status(db, svc.get_by_id(db, complaint_id), body.status, admin_user, body.remarks)
    db.refresh(c, ["history"])
    return c


@admin.get("/users", response_model=list[UserOut])
def users(db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.created_at.desc()).limit(200)).all()


@admin.get("/audit-logs")
def audit_logs(db: Session = Depends(get_db), limit: int = 100):
    rows = db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(min(limit, 500))).all()
    return [{"id": r.id, "actor_id": str(r.actor_id) if r.actor_id else None, "action": r.action,
             "entity": r.entity, "entity_id": r.entity_id, "created_at": r.created_at} for r in rows]


@officer.get("/complaints", response_model=list[ComplaintOut])
def officer_list(user: User = Depends(require_roles(Role.OFFICER)), db: Session = Depends(get_db)):
    rows = db.scalars(select(Complaint).where(Complaint.assigned_officer_id == user.id)
                      .order_by(Complaint.created_at.desc()).limit(100)).all()
    return [ComplaintOut.model_validate(r, update={"history": []}) for r in rows]


def _own_assigned(db: Session, complaint_id: uuid.UUID, user: User) -> Complaint:
    c = svc.get_by_id(db, complaint_id)
    if c.assigned_officer_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found.")
    return c


@officer.get("/complaints/{complaint_id}", response_model=ComplaintOut)
def officer_get(complaint_id: uuid.UUID, user: User = Depends(require_roles(Role.OFFICER)), db: Session = Depends(get_db)):
    c = _own_assigned(db, complaint_id, user)
    db.refresh(c, ["history"])
    return c


@officer.patch("/complaints/{complaint_id}/status", response_model=ComplaintOut)
def officer_status(complaint_id: uuid.UUID, body: StatusChange, user: User = Depends(require_roles(Role.OFFICER)),
                   db: Session = Depends(get_db)):
    c = _own_assigned(db, complaint_id, user)
    if not officer_can_transition(c.status, body.status):
        raise HTTPException(status.HTTP_409_CONFLICT, "That status change is not permitted for officers.")
    svc.change_status(db, c, body.status, user, body.remarks)
    db.refresh(c, ["history"])
    return c


@system.get("/departments", response_model=list[DepartmentOut])
def departments(db: Session = Depends(get_db)):
    from app.models.entities import Department
    return db.scalars(select(Department).order_by(Department.name)).all()


@system.get("/notifications")
def notifications(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Notification).where(Notification.user_id == user.id)
                      .order_by(Notification.created_at.desc()).limit(50)).all()
    return [{"id": str(n.id), "message": n.message, "read": n.read, "created_at": n.created_at} for n in rows]
