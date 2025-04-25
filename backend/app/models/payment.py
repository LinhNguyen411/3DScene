from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Payment(Base):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    payment_plan = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    expired_at = Column(DateTime, nullable=False)

    payer_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    payer = relationship("User", back_populates="payments")