from fastapi import APIRouter, Depends, Header, HTTPException
from typing import Optional
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, decode_token
from app.database import get_db
from app.models.user import User
from app.schemas.user import ProfileUpdate, ProfileOut

router = APIRouter()

@router.post("/send-otp")
def send_otp(payload: dict):
    # Mock sending OTP
    return {"success": True, "message": "OTP sent successfully to " + payload.get("phone", "")}

@router.post("/verify-otp")
def verify_otp(payload: dict, db: Session = Depends(get_db)):
    if payload.get("otp") == "123456": # Mock hardcoded OTP
        phone = payload.get("phone", "")
        user = db.query(User).filter(User.phone == phone).first()
        if not user:
            user = User(
                phone=phone,
                role="farmer",
                name="Farmer",
                preferred_language="en",
                is_verified=True,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        access_token = create_access_token(str(user.id), {"phone": phone, "role": user.role})
        refresh_token = create_refresh_token(str(user.id), {"phone": phone})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {"id": str(user.id), "role": user.role, "phone": phone}
        }
    raise HTTPException(status_code=400, detail="Invalid OTP")

@router.post("/refresh")
def refresh_token(payload: dict):
    token = payload.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing refresh token")
    try:
        decoded = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token type")
    subject = decoded.get("sub")
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid refresh token payload")
    return {"access_token": create_access_token(str(subject))}

@router.get("/profile")
def get_profile(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.replace("Bearer ", "", 1).strip()
    try:
        decoded = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user": {"id": str(user.id), "role": user.role or "farmer", "phone": user.phone or ""},
        "profile": ProfileOut(
            id=str(user.id),
            name=user.name,
            village=user.village,
            district=user.district,
            state=user.state,
            pincode=user.pincode,
            land_acres=user.land_area_acres,
            soil_type=user.soil_type,
            primary_crops=user.primary_crops or [],
            preferred_language=user.preferred_language or "en",
            onboarded=True,
            role=user.role or "farmer",
            subscription_plan="premium"
        ).dict()
    }

@router.put("/profile")
def update_profile(payload: ProfileUpdate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.replace("Bearer ", "", 1).strip()
    try:
        decoded = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Pydantic validation has already been done by the ProfileUpdate model
        data = payload.dict(exclude_unset=True)
        
        # Map incoming keys to user model fields
        if "land_acres" in data and data["land_acres"] is not None:
            user.land_area_acres = data["land_acres"]
        if "primary_crops" in data and data["primary_crops"] is not None:
            user.primary_crops = data["primary_crops"]
        
        # String fields
        for key in ("name", "village", "district", "state", "pincode", "soil_type", "preferred_language"):
            if key in data and data[key] is not None:
                setattr(user, key, data[key])

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "user": {"id": str(user.id), "role": user.role or "farmer", "phone": user.phone or ""},
            "profile": ProfileOut(
                id=str(user.id),
                name=user.name,
                village=user.village,
                district=user.district,
                state=user.state,
                pincode=user.pincode,
                land_acres=user.land_area_acres,
                soil_type=user.soil_type,
                primary_crops=user.primary_crops or [],
                preferred_language=user.preferred_language or "en",
                onboarded=True,
                role=user.role or "farmer",
                subscription_plan="premium"
            ).dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update profile: {str(e)}")
