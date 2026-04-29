from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class UserBase(BaseModel):
    phone: str
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    land_area_acres: Optional[float] = None
    soil_type: Optional[str] = None
    primary_crops: Optional[List[str]] = []
    preferred_language: str = "en"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    role: str
    is_verified: bool
    is_active: bool

    class Config:
        from_attributes = True


class ProfileOut(BaseModel):
    """Response model for profile GET/PUT endpoints"""
    id: str
    name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    land_acres: Optional[float] = None
    soil_type: Optional[str] = None
    primary_crops: Optional[List[str]] = None
    preferred_language: Optional[str] = None
    onboarded: bool = True
    role: Optional[str] = None
    subscription_plan: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    village: Optional[str] = Field(None, min_length=1, max_length=100)
    district: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    pincode: Optional[str] = Field(None, min_length=1, max_length=10)
    land_acres: Optional[float] = Field(None, gt=0, le=10000)
    soil_type: Optional[str] = Field(None, min_length=1, max_length=50)
    primary_crops: Optional[List[str]] = Field(None, max_length=10)
    preferred_language: Optional[str] = Field(None, min_length=2, max_length=5)

    @field_validator("primary_crops")
    @classmethod
    def validate_crops(cls, v):
        if v:
            for crop in v:
                if not isinstance(crop, str) or len(crop) < 1 or len(crop) > 40:
                    raise ValueError("Each crop must be a string between 1-40 characters")
        return v

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v):
        if v and not v.isdigit():
            raise ValueError("Pincode must contain only digits")
        return v

    class Config:
        extra = "forbid"
