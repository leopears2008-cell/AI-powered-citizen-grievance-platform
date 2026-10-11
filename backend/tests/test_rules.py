import itertools

from app.services import intelligence as ai
from app.services.workflow import Status, can_transition, officer_can_transition


def test_workflow_happy_path():
    path = [Status.SUBMITTED, Status.UNDER_REVIEW, Status.ASSIGNED, Status.IN_PROGRESS, Status.RESOLVED, Status.CLOSED]
    assert all(can_transition(a, b) for a, b in zip(path, path[1:], strict=False))


def test_workflow_blocks_skips_and_terminal():
    assert not can_transition(Status.SUBMITTED, Status.RESOLVED)
    assert not can_transition(Status.CLOSED, Status.REOPENED)
    assert can_transition(Status.RESOLVED, Status.REOPENED)


def test_officer_cannot_assign_or_reject():
    assert not officer_can_transition(Status.SUBMITTED, Status.ASSIGNED)
    assert not officer_can_transition(Status.UNDER_REVIEW, Status.REJECTED)
    assert officer_can_transition(Status.IN_PROGRESS, Status.RESOLVED)


def test_routing_english_and_tamil():
    assert ai.route_department("water pipe burst near school")[0] == "dept-water"
    assert ai.route_department("சாலை பள்ளம் உள்ளது")[0] == "dept-roads"
    assert ai.route_department("something vague")[0] == ai.FALLBACK_DEPT


def test_severity_and_sla():
    sev, _, sla = ai.severity_and_sla("exposed wire sparking on pole")
    assert (sev, sla) == ("CRITICAL", 1)
    assert ai.severity_and_sla("dengue mosquito breeding")[0] == "HIGH"
    assert ai.severity_and_sla("minor issue", "bogus")[0] == "MEDIUM"


def test_duplicate_similarity():
    assert ai.similarity("big pothole on main road", "big pothole on main road") == 1.0
    assert ai.similarity("pothole on main road", "garbage near market") < 0.2
    assert ai.similarity("", "anything") == 0.0
