# from sqlalchemy import Column, Integer, String, Float, DateTime
# from sqlalchemy.ext.declarative import declarative_base

# Base = declarative_base()

# class Traffic(Base):
#     __tablename__ = 'traffic'

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     location = Column(String, nullable=False)
#     vehicle_count = Column(Integer, nullable=False)
#     average_speed = Column(Float, nullable=True)
#     timestamp = Column(DateTime, nullable=False)

#     def __repr__(self):
#         return f"<Traffic(id={self.id}, location='{self.location}', vehicle_count={self.vehicle_count}, average_speed={self.average_speed}, timestamp={self.timestamp})>"