from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# ---------- AUTH ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # "tenant" or "owner"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- ROOM LISTING ----------
class RoomListingCreate(BaseModel):
    location: str
    rent: float
    available_from: date
    room_type: str
    furnishing_status: str
    photo_urls: Optional[str] = None

class RoomListingOut(BaseModel):
    id: int
    owner_id: int
    location: str
    rent: float
    available_from: date
    room_type: str
    furnishing_status: str
    photo_urls: Optional[str]
    is_filled: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RoomListingWithScore(RoomListingOut):
    compatibility_score: Optional[float] = None
    compatibility_explanation: Optional[str] = None


# ---------- TENANT PROFILE ----------
class TenantProfileCreate(BaseModel):
    preferred_location: str
    budget_min: float
    budget_max: float
    move_in_date: date

class TenantProfileOut(BaseModel):
    id: int
    user_id: int
    preferred_location: str
    budget_min: float
    budget_max: float
    move_in_date: date

    class Config:
        from_attributes = True


# ---------- INTEREST REQUEST ----------
class InterestRequestCreate(BaseModel):
    listing_id: int

class InterestRequestOut(BaseModel):
    id: int
    tenant_id: int
    listing_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class InterestRequestStatusUpdate(BaseModel):
    status: str  # "accepted" or "declined"


# ---------- MESSAGE ----------
class MessageCreate(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: int
    interest_request_id: int
    sender_id: int
    content: str
    sent_at: datetime

    class Config:
        from_attributes = True

class CompatibilityScoreOut(BaseModel):
    id: int
    tenant_id: int
    listing_id: int
    score: float
    explanation: str

    class Config:
        from_attributes = True