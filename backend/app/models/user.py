from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    price_monthly = Column(Float)
    price_yearly = Column(Float)
    feature_flags = Column(JSON)
    max_land_acres = Column(Float)
    priority_support = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    users = relationship("User", back_populates="subscription_plan")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True)
    name = Column(String)
    village = Column(String)
    email = Column(String, unique=True, index=True, nullable=True)
    role = Column(String, default="farmer") # farmer, expert, admin, dealer
    state = Column(String)
    district = Column(String)
    pincode = Column(String)
    land_area_acres = Column(Float)
    soil_type = Column(String)
    primary_crops = Column(JSON)
    preferred_language = Column(String, default="en")
    
    subscription_plan_id = Column(Integer, ForeignKey("subscription_plans.id"))
    subscription_expires_at = Column(DateTime(timezone=True))
    
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    subscription_plan = relationship("SubscriptionPlan", back_populates="users")
    crop_recommendations = relationship("CropRecommendation", back_populates="user")
    disease_detections = relationship("DiseaseDetection", back_populates="user")
    expert_profile = relationship("ExpertProfile", back_populates="user", uselist=False)
