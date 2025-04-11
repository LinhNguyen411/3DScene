# from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
# from sqlalchemy.orm import relationship
# from app.database import Base
# from datetime import datetime

# class Payment(Base):
#     __tablename__ = 'payments'

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
#     amount = Column(Float, nullable=False)
#     payment_method = Column(String, nullable=False)
#     status = Column(String, default="pending")
#     created_at = Column(DateTime, default=datetime.utcnow)
#     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

#     user = relationship("User", back_populates="payments")