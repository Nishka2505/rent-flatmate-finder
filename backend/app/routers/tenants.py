from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

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