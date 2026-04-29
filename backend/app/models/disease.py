from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class DiseaseDetection(Base):
    __tablename__ = "disease_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_urls = Column(JSON)
    disease_name = Column(String)
    confidence = Column(Float)
    severity = Column(String)
    treatment_plan = Column(JSON)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    crop_type = Column(String)
    feedback_correct = Column(Boolean, nullable=True)
    model_version = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="disease_detections")
