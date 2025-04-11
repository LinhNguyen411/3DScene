# from sqlalchemy import Column, Integer, String, Boolean, DateTime
# from sqlalchemy.ext.declarative import declarative_base
# from datetime import datetime
# from sqlalchemy.orm import relationship
# from sqlalchemy import ForeignKey

# Base = declarative_base()

# class Notification(Base):
#     __tablename__ = 'notifications'

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     title = Column(String(255), nullable=False)
#     message = Column(String(1024), nullable=False)
#     is_read = Column(Boolean, default=False)
#     created_at = Column(DateTime, default=datetime.now)
#     user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
#     user = relationship("User", back_populates="notifications")

#     def __repr__(self):
#         return f"<Notification(id={self.id}, title={self.title}, is_read={self.is_read})>"