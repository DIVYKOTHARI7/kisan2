from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class MarketplaceProduct(Base):
    __tablename__ = "marketplace_products"
    
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String)
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    unit = Column(String)
    stock_quantity = Column(Float)
    images = Column(JSON)
    brand = Column(String, nullable=True)
    is_organic = Column(Boolean, default=False)
    expert_recommended = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    seller = relationship("User")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    payment_type = Column(String)
    amount = Column(Float)
    currency = Column(String, default="INR")
    status = Column(String)
    gateway = Column(String)
    gateway_order_id = Column(String)
    gateway_payment_id = Column(String)
    metadata_ = Column("metadata", JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    consultation = relationship("Consultation", back_populates="payment", uselist=False)
