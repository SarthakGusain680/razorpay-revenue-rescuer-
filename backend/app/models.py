from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
from .database import Base

class AbandonedCart(Base):
    __tablename__ = "abandoned_carts"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    user_phone = Column(String)
    cart_value = Column(Float)
    items = Column(JSON)
    customer_type = Column(String, default="New")
    status = Column(String, default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, index=True)
    action_type = Column(String)
    message_content = Column(String)
    ai_reasoning = Column(String)
    status = Column(String, default="Sent")
    created_at = Column(DateTime(timezone=True), server_default=func.now())