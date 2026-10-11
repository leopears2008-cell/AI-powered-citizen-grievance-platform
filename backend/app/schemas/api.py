import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.services.workflow import Status


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    full_name: str
    role: str


class ComplaintCreate(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    location: str | None = Field(default=None, max_length=300)
    district: str | None = Field(default=None, max_length=80)
    language: str = Field(default="en", pattern="^(en|ta)$")


class ComplaintUpdate(BaseModel):
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    location: str | None = Field(default=None, max_length=300)


class HistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    from_status: Status | None
    to_status: Status
    remarks: str | None
    created_at: datetime


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    reference_number: str
    title: str
    description: str
    location: str | None
    district: str | None
    status: Status
    department_id: str | None
    severity: str
    sla_due_at: datetime | None
    created_at: datetime
    history: list[HistoryOut] = []


class PublicTrackOut(BaseModel):
    """Deliberately excludes citizen identity, description, and location."""
    model_config = ConfigDict(from_attributes=True)
    reference_number: str
    status: Status
    department_id: str | None
    created_at: datetime
    updated_at: datetime


class StatusChange(BaseModel):
    status: Status
    remarks: str | None = Field(default=None, max_length=1000)


class AssignIn(BaseModel):
    officer_id: uuid.UUID


class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    name_ta: str | None
