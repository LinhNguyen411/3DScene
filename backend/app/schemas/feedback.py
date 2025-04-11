from pydantic import BaseModel, Field, EmailStr
from typing import Annotated, Optional
from datetime import datetime
from app.schemas.user import User


# Shared properties
class FeedbackBase(BaseModel):
    comment: str
    email_contact: EmailStr


# Properties to receive on Feedback creation
class FeedbackCreate(BaseModel):
    comment: str
    email_contact: EmailStr

# Properties to receive on Feedback deletion
class FeedbackDelete(BaseModel):
    id: int


# Properties to receive on Feedback update
class FeedbackUpdate(BaseModel):
    comment: str

# Properties shared by models stored in DB


class FeedbackInDBBase(FeedbackBase):
    id: int
    comment: str
    email_contact: EmailStr

    class Config:
        orm_mode = True


# Properties to return to client
class Feedback(FeedbackInDBBase):
    created_at: datetime


# Properties properties stored in DB
class FeedbackInDB(FeedbackInDBBase):
    pass
