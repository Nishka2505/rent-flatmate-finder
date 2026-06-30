from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas, auth, compatibility
from app.email_utils import send_status_update_email
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


@router.get("/", response_model=List[schemas.RoomListingWithScore])
def get_listings(
    location: Optional[str] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
):
    query = db.query(models.RoomListing).filter(models.RoomListing.is_filled == False)
    if location:
        query = query.filter(models.RoomListing.location.ilike(f"%{location}%"))
    if min_rent is not None:
        query = query.filter(models.RoomListing.rent >= min_rent)
    if max_rent is not None:
        query = query.filter(models.RoomListing.rent <= max_rent)
    listings = query.all()

    # If a tenant is logged in, compute/fetch compatibility scores and sort by them
    if current_user and current_user.role == "tenant":
        tenant_profile = db.query(models.TenantProfile).filter(
            models.TenantProfile.user_id == current_user.id
        ).first()

        if tenant_profile:
            results = []
            for listing in listings:
                existing_score = db.query(models.CompatibilityScore).filter(
                    models.CompatibilityScore.tenant_id == tenant_profile.id,
                    models.CompatibilityScore.listing_id == listing.id,
                ).first()

                if not existing_score:
                    score_data = compatibility.llm_compatibility_score(tenant_profile, listing)
                    existing_score = models.CompatibilityScore(
                        tenant_id=tenant_profile.id,
                        listing_id=listing.id,
                        score=score_data["score"],
                        explanation=score_data["explanation"],
                    )
                    db.add(existing_score)
                    db.commit()
                    db.refresh(existing_score)

                listing_dict = schemas.RoomListingOut.from_orm(listing).dict()
                listing_dict["compatibility_score"] = existing_score.score
                listing_dict["compatibility_explanation"] = existing_score.explanation
                results.append(listing_dict)

            results.sort(key=lambda x: x["compatibility_score"], reverse=True)
            return results

    # Non-tenant or no profile yet — return without scores
    return [schemas.RoomListingWithScore.from_orm(l) for l in listings]


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



@router.get("/interest/received", response_model=List[schemas.InterestRequestOut])
def get_received_interests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("owner")),
):
    my_listing_ids = [
        l.id for l in db.query(models.RoomListing).filter(models.RoomListing.owner_id == current_user.id).all()
    ]
    return db.query(models.InterestRequest).filter(
        models.InterestRequest.listing_id.in_(my_listing_ids)
    ).all()


@router.patch("/interest/{interest_id}/respond", response_model=schemas.InterestRequestOut)
def respond_to_interest(
    interest_id: int,
    status_update: schemas.InterestRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("owner")),
):
    interest = db.query(models.InterestRequest).filter(models.InterestRequest.id == interest_id).first()
    if not interest:
        raise HTTPException(status_code=404, detail="Interest request not found")

    listing = db.query(models.RoomListing).filter(models.RoomListing.id == interest.listing_id).first()
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    if status_update.status not in ("accepted", "declined"):
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'declined'")

    interest.status = status_update.status
    db.commit()
    db.refresh(interest)

    # Notify tenant of the decision
    tenant_profile = db.query(models.TenantProfile).filter(
        models.TenantProfile.id == interest.tenant_id
    ).first()
    tenant_user = db.query(models.User).filter(models.User.id == tenant_profile.user_id).first()
    if tenant_user:
        send_status_update_email(tenant_user.email, listing, interest.status)

    return interest    