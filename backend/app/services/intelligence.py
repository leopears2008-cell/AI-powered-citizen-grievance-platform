"""Deterministic department routing, severity/SLA and duplicate scoring.

Ported from server/grievanceIntelligence.ts. Used as the fallback when the AI provider is
unavailable, and as a sanity check on AI output. Results are suggestions, never final decisions.
"""
import re
import unicodedata
from dataclasses import dataclass

STOP_WORDS = {"the", "and", "with", "this", "that", "from", "have", "been", "near", "there",
              "issue", "please", "need", "கள்", "ஒரு", "இந்த", "அது", "மற்றும்"}

DEPARTMENT_RULES: list[tuple[str, list[str], str]] = [
    ("dept-electric", ["wire", "spark", "transformer", "electric", "power", "current", "shock", "min kambi",
                       "மின்சாரம்", "மின்கம்பி", "மின்மாற்றி"], "Electrical safety/infrastructure terms detected."),
    ("dept-water", ["water", "pipe", "leak", "burst", "sewage", "drainage", "thanni", "kuzhai", "kuzhaai",
                    "குடிநீர்", "தண்ணீர்", "குழாய்", "கழிவுநீர்"], "Water/drainage infrastructure terms detected."),
    ("dept-streetlight", ["streetlight", "lamp", "dark", "light", "pole", "vilakku", "விளக்கு", "இருட்டு"],
     "Street-lighting terms detected."),
    ("dept-roads", ["road", "pothole", "pothol", "tar", "footpath", "pavement", "saalai", "சாலை", "பள்ளம்"],
     "Road/public-works terms detected."),
    ("dept-health", ["mosquito", "dengue", "malaria", "fogging", "stagnant", "fever", "kosu", "கொசு", "டெங்கு"],
     "Public-health/vector-control terms detected."),
    ("dept-sanitation", ["garbage", "waste", "bin", "toilet", "smell", "kuppai", "குப்பை", "நாற்றம்"],
     "Sanitation/waste terms detected."),
    ("dept-transport", ["bus", "traffic", "signal", "parking", "transport", "pokkuvarathu", "பேருந்து",
                        "போக்குவரத்து"], "Transport/traffic terms detected."),
]
CRITICAL = ["live wire", "exposed wire", "electric shock", "transformer spark", "electric wire", "power wire",
            "sparking electric", "major burst", "life hazard", "உயிர் ஆபத்து", "மின்கம்பி", "மின்மாற்றி"]
HIGH = ["sewage overflow", "dengue", "blocked road", "mosquito", "mosquito breeding", "flooding",
        "கழிவுநீர்", "டெங்கு", "கொசு"]
SLA_DAYS = {"CRITICAL": 1, "HIGH": 3, "MEDIUM": 7, "LOW": 14}
FALLBACK_DEPT = "dept-sanitation"


def normalize(text: str) -> str:
    return re.sub(r"[^\w\s]", " ", unicodedata.normalize("NFKC", text).lower())


def tokenize(text: str) -> set[str]:
    return {w for w in normalize(text).split() if len(w) >= 3 and w not in STOP_WORDS}


def similarity(a: str, b: str) -> float:
    left, right = tokenize(a), tokenize(b)
    if not left or not right:
        return 0.0
    return round(len(left & right) / len(left | right), 4)


@dataclass(frozen=True)
class Analysis:
    department_id: str
    department_reason: str
    severity: str
    severity_reason: str
    sla_days: int


def route_department(text: str, category: str | None = None) -> tuple[str, str]:
    hay = normalize(f"{text} {category or ''}")
    best_id, best_score = FALLBACK_DEPT, 0
    reason = "No stronger service-area signal was detected; staff verification is required."
    for dept_id, words, label in DEPARTMENT_RULES:
        score = sum(1 for w in words if normalize(w) in hay)
        if score > best_score:
            best_id, best_score, reason = dept_id, score, label
    return best_id, reason


def severity_and_sla(text: str, supplied: str | None = None) -> tuple[str, str, int]:
    hay = normalize(text)
    severity = (supplied or "MEDIUM").upper()
    if severity not in SLA_DAYS:
        severity = "MEDIUM"
    reason = "Routine operational impact; staff verification is required."
    if any(normalize(x) in hay for x in CRITICAL):
        severity, reason = "CRITICAL", "Potential immediate safety hazard detected."
    elif any(normalize(x) in hay for x in HIGH) and severity != "CRITICAL":
        severity, reason = "HIGH", "Potential public-health or significant service disruption detected."
    return severity, reason, SLA_DAYS[severity]


def analyze(text: str, category: str | None = None, priority: str | None = None) -> Analysis:
    dept, dept_reason = route_department(text, category)
    sev, sev_reason, sla = severity_and_sla(text, priority)
    return Analysis(dept, dept_reason, sev, sev_reason, sla)
