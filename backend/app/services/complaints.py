from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import generate_reference_number
from app.models.entities import AuditLog, Complaint, Notification, StatusHistory, User, utcnow
from app.services import intelligence
from app.services.workflow import Status, can_transition


def audit(db: Session, actor: User | None, action: str, entity: str, entity_id: str, detail: dict | None = None):
    db.add(AuditLog(actor_id=actor.id if actor else None, action=action, entity=entity,
                    entity_id=entity_id, detail=detail))


def create_complaint(db: Session, citizen: User, title: str, description: str, location: str | None,
                     district: str | None, language: str) -> Complaint:
    analysis = intelligence.analyze(f"{title} {description}")
    complaint = Complaint(
        reference_number=generate_reference_number(), citizen_id=citizen.id, title=title,
        description=description, location=location, district=district, language=language,
        department_id=analysis.department_id, severity=analysis.severity,
        sla_due_at=utcnow() + timedelta(days=analysis.sla_days),
        ai_suggestion={"source": "rules", "department_reason": analysis.department_reason,
                       "severity_reason": analysis.severity_reason, "requires_staff_verification": True},
    )
    db.add(complaint)
    db.flush()
    db.add(StatusHistory(complaint_id=complaint.id, from_status=None, to_status=Status.SUBMITTED, changed_by=citizen.id))
    audit(db, citizen, "complaint.create", "complaint", str(complaint.id))
    db.commit()
    return complaint


def change_status(db: Session, complaint: Complaint, target: Status, actor: User, remarks: str | None) -> Complaint:
    if not can_transition(complaint.status, target):
        raise HTTPException(status.HTTP_409_CONFLICT,
                            f"Cannot move a complaint from {complaint.status} to {target}.")
    previous = complaint.status
    complaint.status = target
    if target == Status.RESOLVED:
        complaint.resolved_at = utcnow()
    db.add(StatusHistory(complaint_id=complaint.id, from_status=previous, to_status=target,
                         changed_by=actor.id, remarks=remarks))
    db.add(Notification(user_id=complaint.citizen_id, complaint_id=complaint.id,
                        message=f"Complaint {complaint.reference_number} is now {target.value.replace('_', ' ').title()}."))
    audit(db, actor, "complaint.status", "complaint", str(complaint.id), {"from": previous, "to": target})
    db.commit()
    return complaint


def get_by_id(db: Session, complaint_id) -> Complaint:
    complaint = db.get(Complaint, complaint_id)
    if complaint is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found.")
    return complaint


def get_by_reference(db: Session, reference: str) -> Complaint | None:
    return db.scalar(select(Complaint).where(Complaint.reference_number == reference))
