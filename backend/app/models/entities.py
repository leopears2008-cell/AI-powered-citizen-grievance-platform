import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.services.workflow import Status


def utcnow() -> datetime:
    return datetime.now(UTC)


class Role(enum.StrEnum):
    CITIZEN = "CITIZEN"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Department(Base, TimestampMixin):
    __tablename__ = "departments"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # stable slug, e.g. dept-water
    name: Mapped[str] = mapped_column(String(160), unique=True)
    name_ta: Mapped[str | None] = mapped_column(String(160))


class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[Role] = mapped_column(Enum(Role, native_enum=False, length=16), default=Role.CITIZEN)
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"))  # officers only
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"
    __table_args__ = (Index("ix_complaints_status_dept", "status", "department_id"),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reference_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(300))
    district: Mapped[str | None] = mapped_column(String(80))
    language: Mapped[str] = mapped_column(String(8), default="en")
    status: Mapped[Status] = mapped_column(Enum(Status, native_enum=False, length=16), default=Status.SUBMITTED)
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"), index=True)
    assigned_officer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    severity: Mapped[str] = mapped_column(String(10), default="MEDIUM")
    sla_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ai_suggestion: Mapped[dict | None] = mapped_column(JSON)  # suggestion only; never authoritative
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    history: Mapped[list["StatusHistory"]] = relationship(back_populates="complaint", order_by="StatusHistory.created_at")


class StatusHistory(Base):
    __tablename__ = "complaint_status_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complaint_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("complaints.id"), index=True)
    from_status: Mapped[Status | None] = mapped_column(Enum(Status, native_enum=False, length=16))
    to_status: Mapped[Status] = mapped_column(Enum(Status, native_enum=False, length=16))
    changed_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    remarks: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    complaint: Mapped[Complaint] = relationship(back_populates="history")


class Feedback(Base):
    __tablename__ = "complaint_feedback"
    __table_args__ = (UniqueConstraint("complaint_id", name="uq_feedback_complaint"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complaint_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("complaints.id"))
    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Attachment(Base):
    __tablename__ = "attachments"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("complaints.id"), index=True)
    storage_key: Mapped[str] = mapped_column(String(300), unique=True)
    content_type: Mapped[str] = mapped_column(String(80))
    size_bytes: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    complaint_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("complaints.id"))
    message: Mapped[str] = mapped_column(String(500))
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity: Mapped[str | None] = mapped_column(String(80))
    entity_id: Mapped[str | None] = mapped_column(String(64))
    detail: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"
    jti: Mapped[str] = mapped_column(String(64), primary_key=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
