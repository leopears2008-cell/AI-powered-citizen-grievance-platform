"""DEVELOPMENT ONLY: seed the department list. Refuses to run when ENVIRONMENT=production."""
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.entities import Department

DEPARTMENTS = [
    ("dept-electric", "Electricity Board", "மின்சார வாரியம்"),
    ("dept-water", "Water Supply & Drainage", "குடிநீர் மற்றும் வடிகால்"),
    ("dept-streetlight", "Street Lighting", "தெருவிளக்கு"),
    ("dept-roads", "Roads & Public Works", "சாலைகள் மற்றும் பொதுப்பணி"),
    ("dept-health", "Public Health", "பொது சுகாதாரம்"),
    ("dept-sanitation", "Sanitation & Waste", "துப்புரவு மற்றும் கழிவு"),
    ("dept-transport", "Transport & Traffic", "போக்குவரத்து"),
]

if get_settings().is_production:
    raise SystemExit("Refusing to seed in production.")
with SessionLocal() as db:
    for id_, name, ta in DEPARTMENTS:
        if not db.get(Department, id_):
            db.add(Department(id=id_, name=name, name_ta=ta))
    db.commit()
print("Seeded departments.")
