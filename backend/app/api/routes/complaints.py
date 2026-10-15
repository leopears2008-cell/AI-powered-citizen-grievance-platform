import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.ratelimit import rate_limit
from app.db.session import get_db
from app.dependencies.auth import current_user, require_roles
from app.models.entities import Complaint, Feedback, Role, User
from app.schemas.api import ComplaintCreate, ComplaintOut, ComplaintUpdate, FeedbackIn, PublicTrackOut
from app.services import complaints as svc
from app.services.workflow import Status

router = APIRouter(prefix="/complaints", tags=["complaints"])


def _visible_or_404(db: Session, complaint_id: uuid.UUID, user: User) -> Complaint:
    c = svc.get_by_id(db, complaint_id)
    allowed = (
        user.role == Role.ADMIN
        or c.citizen_id == user.id
        or (user.role == Role.OFFICER and c.department_id == user.department_id)
    )
    if not allowed:  # 404, not 403: don't reveal that the record exists (IDOR)
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found.")
    return c


@router.post("", response_model=ComplaintOut, status_code=201, dependencies=[Depends(rate_limit("complaint-create", 20))])
def create(body: ComplaintCreate, user: User = Depends(require_roles(Role.CITIZEN)), db: Session = Depends(get_db)):
    return svc.create_complaint(db, user, body.title, body.description, body.location, body.district, body.language)


@router.get("")
def list_mine(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
              status_filter: Status | None = Query(None, alias="status"),
              user: User = Depends(current_user), db: Session = Depends(get_db)):
    q = select(Complaint)
    if user.role == Role.CITIZEN:
        q = q.where(Complaint.citizen_id == user.id)
    elif user.role == Role.OFFICER:
        q = q.where(Complaint.department_id == user.department_id)
    if status_filter:
        q = q.where(Complaint.status == status_filter)
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    rows = db.scalars(q.order_by(Complaint.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return {"total": total, "page": page, "page_size": page_size,
            "items": [ComplaintOut.model_validate(r, update={"history": []}) for r in rows]}


@router.get("/track/{reference_number}", response_model=PublicTrackOut,
            dependencies=[Depends(rate_limit("track", 30))])
def track(reference_number: str, db: Session = Depends(get_db)):
    c = svc.get_by_reference(db, reference_number.upper())
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No complaint found for this reference number.")
    return c


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_one(complaint_id: uuid.UUID, user: User = Depends(current_user), db: Session = Depends(get_db)):
    c = _visible_or_404(db, complaint_id, user)
    db.refresh(c, ["history"])
    return c


@router.patch("/{complaint_id}", response_model=ComplaintOut)
def update(complaint_id: uuid.UUID, body: ComplaintUpdate, user: User = Depends(require_roles(Role.CITIZEN)),
           db: Session = Depends(get_db)):
    c = _visible_or_404(db, complaint_id, user)
    if c.status != Status.SUBMITTED:
        raise HTTPException(status.HTTP_409_CONFLICT, "A complaint can only be edited before review starts.")
    for field, value in body.model_dump(exclude_unset=True).items():  # explicit schema: no mass assignment
        setattr(c, field, value)
    svc.audit(db, user, "complaint.update", "complaint", str(c.id))
    db.commit()
    db.refresh(c, ["history"])
    return c


@router.post("/{complaint_id}/feedback", status_code=201)
def feedback(complaint_id: uuid.UUID, body: FeedbackIn, user: User = Depends(require_roles(Role.CITIZEN)),
             db: Session = Depends(get_db)):
    c = _visible_or_404(db, complaint_id, user)
    if c.status not in (Status.RESOLVED, Status.CLOSED):
        raise HTTPException(status.HTTP_409_CONFLICT, "Feedback is accepted only after a complaint is resolved.")
    if db.scalar(select(Feedback).where(Feedback.complaint_id == c.id)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Feedback has already been submitted.")
    db.add(Feedback(complaint_id=c.id, citizen_id=user.id, rating=body.rating, comment=body.comment))
    svc.audit(db, user, "complaint.feedback", "complaint", str(c.id))
    db.commit()
    return {"ok": True}
