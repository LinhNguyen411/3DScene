from datetime import datetime
from sqlalchemy import (Column, ForeignKey, Integer,
                        String, DateTime, Boolean)  # type: ignore
from sqlalchemy.orm import relationship  # type: ignore

from app.db.base_class import Base


class Splat(Base):
    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    date_created = Column(DateTime, default=datetime.now())
    is_public=Column(Boolean(), default=False)
    status = Column(String(50), default='PENDING')

    image_url = Column(String(500), nullable=False)
    model_url = Column(String(500), nullable=True)

    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    owner = relationship("User", back_populates="splats")

