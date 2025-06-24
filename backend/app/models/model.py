from datetime import datetime
from sqlalchemy import (Column, ForeignKey, Integer,
                        String, DateTime, Boolean, Float, JSON)  # type: ignore
from sqlalchemy.orm import relationship  # type: ignore

from app.db.base_class import Base


class Model(Base):
    id = Column(String(36), primary_key=True, index=True)

    title = Column(String(250), nullable=False)
    is_public=Column(Boolean(), default=False)
    status = Column(String(50), default='PENDING')
    model_size = Column(Float, nullable=True)

    date_created = Column(DateTime, default=datetime.now())   
    time_finished = Column(DateTime, nullable=True)

    image_url = Column(String(500), nullable=False)
    model_url = Column(String(500), nullable=True)
    colmap_url = Column(String(500), nullable=True)

    camera_init = Column(JSON, nullable=True)
    model_transform = Column(JSON, nullable=True)
    
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    owner = relationship("User", back_populates="models")