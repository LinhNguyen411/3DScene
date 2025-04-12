from sqlalchemy import Column, String, DateTime, Integer
from datetime import datetime

from app.db.base_class import Base 


class Feedback(Base):
    __tablename__ = 'feedback'

    id = Column(Integer, primary_key=True, unique=True, nullable=False, index=True)
    comment = Column(String, nullable=False)
    email_contact = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)