from sqlalchemy import Column, ForeignKey, Integer, String, Boolean  # type: ignore
from sqlalchemy.orm import relationship  # type: ignore

from app.db.base_class import Base


class Todo(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    is_done = Column(Boolean, default=False)
    owner = relationship("User", back_populates="todos")
