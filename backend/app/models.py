from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "tenant", "owner", "admin"
    created_at = Column(DateTime, server_default=func.now())

    room_listings = relationship("RoomListing", back_populates="owner")
    tenant_profile = relationship("TenantProfile", back_populates="user", uselist=False)


class RoomListing(Base):
    __tablename__ = "room_listings"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location = Column(String, nullable=False)
    rent = Column(Float, nullable=False)
    available_from = Column(Date, nullable=False)
    room_type = Column(String, nullable=False)
    furnishing_status = Column(String, nullable=False)
    photo_urls = Column(Text, nullable=True)  # store as comma-separated or JSON string
    is_filled = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="room_listings")
    interest_requests = relationship("InterestRequest", back_populates="listing")


class TenantProfile(Base):
    __tablename__ = "tenant_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    preferred_location = Column(String, nullable=False)
    budget_min = Column(Float, nullable=False)
    budget_max = Column(Float, nullable=False)
    move_in_date = Column(Date, nullable=False)

    user = relationship("User", back_populates="tenant_profile")
    interest_requests = relationship("InterestRequest", back_populates="tenant")


class CompatibilityScore(Base):
    __tablename__ = "compatibility_scores"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant_profiles.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("room_listings.id"), nullable=False)
    score = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    computed_at = Column(DateTime, server_default=func.now())


class InterestRequest(Base):
    __tablename__ = "interest_requests"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant_profiles.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("room_listings.id"), nullable=False)
    status = Column(String, default="pending")  # pending, accepted, declined
    created_at = Column(DateTime, server_default=func.now())

    tenant = relationship("TenantProfile", back_populates="interest_requests")
    listing = relationship("RoomListing", back_populates="interest_requests")
    messages = relationship("Message", back_populates="interest_request")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    interest_request_id = Column(Integer, ForeignKey("interest_requests.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime, server_default=func.now())

    interest_request = relationship("InterestRequest", back_populates="messages")