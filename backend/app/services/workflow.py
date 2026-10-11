"""Complaint lifecycle rules (ported from server/workflow.ts, extended per the migration spec)."""
from enum import StrEnum


class Status(StrEnum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"
    REOPENED = "REOPENED"


S = Status
TRANSITIONS: dict[Status, frozenset[Status]] = {
    S.SUBMITTED: frozenset({S.UNDER_REVIEW, S.ASSIGNED, S.REJECTED}),
    S.UNDER_REVIEW: frozenset({S.ASSIGNED, S.IN_PROGRESS, S.REJECTED}),
    S.ASSIGNED: frozenset({S.UNDER_REVIEW, S.IN_PROGRESS, S.REJECTED}),
    S.IN_PROGRESS: frozenset({S.RESOLVED, S.UNDER_REVIEW}),
    S.RESOLVED: frozenset({S.CLOSED, S.REOPENED}),
    S.CLOSED: frozenset(),
    S.REJECTED: frozenset({S.REOPENED}),
    S.REOPENED: frozenset({S.UNDER_REVIEW, S.ASSIGNED, S.IN_PROGRESS}),
}
OFFICER_TARGETS = frozenset({S.UNDER_REVIEW, S.IN_PROGRESS, S.RESOLVED})


def can_transition(current: Status, target: Status) -> bool:
    return current == target or target in TRANSITIONS[current]


def officer_can_transition(current: Status, target: Status) -> bool:
    return target in OFFICER_TARGETS and can_transition(current, target)
