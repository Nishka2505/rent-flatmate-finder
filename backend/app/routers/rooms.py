from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/", response_model=schemas.RoomListingOut)
def create_listing(
    listing_in: schemas.RoomListingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("owner")),
):
    new_listing = models.RoomListing(owner_id=current_user.id, **listing_in.dict())
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return new_listing


@router.get("/", response_model=List[schemas.RoomListingOut])
def get_listings(
    location: Optional[str] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.RoomListing).filter(models.RoomListing.is_filled == False)
    if location:
        query = query.filter(models.RoomListing.location.ilike(f"%{location}%"))
    if min_rent is not None:
        query = query.filter(models.RoomListing.rent >= min_rent)
    if max_rent is not None:
        query = query.filter(models.RoomListing.rent <= max_rent)
    return query.all()


@router.get("/{listing_id}", response_model=schemas.RoomListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(models.RoomListing).filter(models.RoomListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.get("/owner/my-listings", response_model=List[schemas.RoomListingOut])
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("owner")),
):
    return db.query(models.RoomListing).filter(models.RoomListing.owner_id == current_user.id).all()


@router.patch("/{listing_id}/fill", response_model=schemas.RoomListingOut)
def mark_filled(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("owner")),
):
    listing = db.query(models.RoomListing).filter(models.RoomListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    listing.is_filled = True
    db.commit()
    db.refresh(listing)
    return listing