from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ExpertProfile(Base):
    __tablename__ = "expert_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    qualification = Column(String)
    specializations = Column(JSON)
    languages = Column(JSON)
    experience_years = Column(Integer)
    consultation_fee = Column(Float)
    rating = Column(Float, default=0.0)
    kyc_status = Column(String, default="pending")
    kyc_document_urls = Column(JSON)
    bio = Column(String)
    is_available = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="expert_profile")
    consultations_as_expert = relationship("Consultation", back_populates="expert", foreign_keys='Consultation.expert_id')

class Consultation(Base):
    __tablename__ = "consultations"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"))
    expert_id = Column(Integer, ForeignKey("expert_profiles.id"))
    slot_start = Column(DateTime(timezone=True))
    slot_end = Column(DateTime(timezone=True))
    status = Column(String) # scheduled, completed, cancelled
    consultation_type = Column(String) # video, audio
    topic = Column(String)
    meeting_url = Column(String)
    notes = Column(String)
    amount = Column(Float)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    rating = Column(Integer, nullable=True)
    review = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    farmer = relationship("User", foreign_keys=[farmer_id])
    expert = relationship("ExpertProfile", back_populates="consultations_as_expert", foreign_keys=[expert_id])
    payment = relationship("Payment", back_populates="consultation")
