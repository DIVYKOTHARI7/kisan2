from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    soil_n = Column(Float)
    soil_p = Column(Float)
    soil_k = Column(Float)
    soil_ph = Column(Float)
    soil_type = Column(String)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    season = Column(String)
    irrigation_type = Column(String)
    budget_per_acre = Column(Float)
    
    recommendations = Column(JSON)
    weather_data_snapshot = Column(JSON, nullable=True)
    mandi_data_snapshot = Column(JSON, nullable=True)
    model_version = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="crop_recommendations")
    calendar_tasks = relationship("CropCalendarTask", back_populates="recommendation")

class CropCalendarTask(Base):
    __tablename__ = "crop_calendar_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    recommendation_id = Column(Integer, ForeignKey("crop_recommendations.id"), nullable=True)
    task_type = Column(String)
    crop_name = Column(String)
    scheduled_date = Column(DateTime(timezone=True))
    reminder_date = Column(DateTime(timezone=True))
    description = Column(String)
    is_completed = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    recommendation = relationship("CropRecommendation", back_populates="calendar_tasks")
