"""
seed_rooms.py
Seeds dummy owner accounts + pan-India room listings.

USAGE (run from inside backend/, with venv activated):
    python seed_rooms.py

For LOCAL (SQLite test.db): just run as-is, DATABASE_URL comes from your .env
For PRODUCTION (Render Postgres): temporarily set DATABASE_URL to your
Render Postgres external connection string before running, e.g. (PowerShell):

    $env:DATABASE_URL="postgresql://user:pass@host:5432/dbname"
    python seed_rooms.py

Then unset it / close that terminal so you don't accidentally run other
scripts against prod by mistake.

Safe to re-run: it checks for existing dummy owners by email before
re-creating them, and only adds rooms if none exist yet for that owner.
"""

import os
import random
from datetime import date, timedelta

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL not set. Check your .env or $env:DATABASE_URL")

print(f"Seeding into: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

# SQLite needs a connect_arg tweak; Postgres doesn't
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from app.database import Base  # noqa: E402
from app import models  # noqa: E402
from app.auth import hash_password  # noqa: E402

# Make sure tables exist (no-op if they already do)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ---- City / locality data -------------------------------------------------

CITY_DATA = {
    "Bangalore": {
        "localities": ["Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Marathahalli", "BTM Layout"],
        "rent_range": (10000, 25000),
    },
    "Mumbai": {
        "localities": ["Andheri West", "Powai", "Bandra", "Malad", "Thane", "Kandivali"],
        "rent_range": (15000, 40000),
    },
    "Delhi": {
        "localities": ["Saket", "Dwarka", "Rohini", "Lajpat Nagar", "Vasant Kunj", "Karol Bagh"],
        "rent_range": (12000, 30000),
    },
    "Pune": {
        "localities": ["Kothrud", "Hinjewadi", "Viman Nagar", "Baner", "Wakad", "Kharadi"],
        "rent_range": (9000, 22000),
    },
    "Hyderabad": {
        "localities": ["Gachibowli", "Madhapur", "Kondapur", "Banjara Hills", "Kukatpally"],
        "rent_range": (8000, 20000),
    },
    "Chennai": {
        "localities": ["Velachery", "OMR", "T Nagar", "Anna Nagar", "Adyar"],
        "rent_range": (8000, 20000),
    },
    "Kolkata": {
        "localities": ["Salt Lake", "New Town", "Park Street", "Ballygunge"],
        "rent_range": (7000, 18000),
    },
    "Gurgaon": {
        "localities": ["Sector 29", "DLF Phase 3", "Sohna Road", "Cyber City"],
        "rent_range": (13000, 32000),
    },
}

ROOM_TYPES = ["1RK", "1BHK", "2BHK shared", "PG single", "PG sharing"]
FURNISHING = ["fully-furnished", "semi-furnished", "unfurnished"]

# ---- Step 1: create one dummy owner per city -------------------------------

owners_by_city = {}
for city in CITY_DATA:
    email = f"owner.{city.lower()}@seed.flatmate.dev"
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        owners_by_city[city] = existing
        print(f"Owner already exists for {city}: {email}")
        continue
    owner = models.User(
        email=email,
        hashed_password=hash_password("SeedOwner@123"),
        role="owner",
    )
    db.add(owner)
    db.flush()  # get owner.id without full commit
    owners_by_city[city] = owner
    print(f"Created owner for {city}: {email} (password: SeedOwner@123)")

db.commit()

# ---- Step 2: create rooms per city -----------------------------------------

ROOMS_PER_CITY = 7  # ~56 rooms total across 8 cities
today = date.today()

created_count = 0
for city, info in CITY_DATA.items():
    owner = owners_by_city[city]

    existing_count = (
        db.query(models.RoomListing)
        .filter(models.RoomListing.owner_id == owner.id)
        .count()
    )
    if existing_count >= ROOMS_PER_CITY:
        print(f"{city}: already has {existing_count} listings, skipping")
        continue

    for _ in range(ROOMS_PER_CITY - existing_count):
        locality = random.choice(info["localities"])
        rent = round(random.randint(*info["rent_range"]) / 500) * 500  # round to nearest 500
        room = models.RoomListing(
            owner_id=owner.id,
            location=f"{locality}, {city}",
            rent=float(rent),
            available_from=today + timedelta(days=random.randint(0, 45)),
            room_type=random.choice(ROOM_TYPES),
            furnishing_status=random.choice(FURNISHING),
            photo_urls=None,
            is_filled=False,
        )
        db.add(room)
        created_count += 1

db.commit()
print(f"\nDone. Created {created_count} new room listings across {len(CITY_DATA)} cities.")
db.close()
