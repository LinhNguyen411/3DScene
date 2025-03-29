from sqlalchemy import Boolean, Column, Integer, String  # type: ignore
from sqlalchemy.orm import relationship  # type: ignore

from app.db.base_class import Base  # type: ignore


class User(Base):
    """User model class."""
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(150), index=True)
    last_name = Column(String(150), index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=False)
    is_superuser = Column(Boolean(), default=False)
    todos = relationship("Todo", back_populates="owner")
