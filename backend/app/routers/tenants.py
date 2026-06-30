from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.email_utils import send_interest_notification_email, send_status_update_email
from app.database import get_db
from app import models, schemas, auth
from typing import List
router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.post("/profile", response_model=schemas.TenantProfileOut)
def create_or_update_profile(
    profile_in: schemas.TenantProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("tenant")),
):
    existing = db.query(models.TenantProfile).filter(models.TenantProfile.user_id == current_user.id).first()
    if existing:
        for key, value in profile_in.dict().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    new_profile = models.TenantProfile(user_id=current_user.id, **profile_in.dict())
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


@router.get("/profile", response_model=schemas.TenantProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("tenant")),
):
    profile = db.query(models.TenantProfile).filter(models.TenantProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Create one first.")
    return profile




@router.post("/interest", response_model=schemas.InterestRequestOut)
def express_interest(
    interest_in: schemas.InterestRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("tenant")),
):
    tenant_profile = db.query(models.TenantProfile).filter(
        models.TenantProfile.user_id == current_user.id
    ).first()
    if not tenant_profile:
        raise HTTPException(status_code=400, detail="Create your tenant profile first")

    listing = db.query(models.RoomListing).filter(
        models.RoomListing.id == interest_in.listing_id
    ).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = db.query(models.InterestRequest).filter(
        models.InterestRequest.tenant_id == tenant_profile.id,
        models.InterestRequest.listing_id == listing.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Interest already expressed for this listing")

    new_request = models.InterestRequest(
        tenant_id=tenant_profile.id,
        listing_id=listing.id,
        status="pending",
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # Notify owner if compatibility score is high (>80)
    score = db.query(models.CompatibilityScore).filter(
        models.CompatibilityScore.tenant_id == tenant_profile.id,
        models.CompatibilityScore.listing_id == listing.id,
    ).first()

   
    owner = db.query(models.User).filter(models.User.id == listing.owner_id).first()
    if score and score.score >= 80 and owner:
        send_interest_notification_email(owner.email, listing, tenant_profile, score.score)
    return new_request   


@router.get("/interest/my-requests", response_model=List[schemas.InterestRequestOut])
def get_my_interest_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("tenant")),
):
    tenant_profile = db.query(models.TenantProfile).filter(
        models.TenantProfile.user_id == current_user.id
    ).first()
    if not tenant_profile:
        return []
    return db.query(models.InterestRequest).filter(
        models.InterestRequest.tenant_id == tenant_profile.id
    ).all()    