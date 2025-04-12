from pydantic import BaseModel, Field, EmailStr
from typing import Annotated, Optional
from datetime import datetime
from app.schemas.user import User


# Shared properties
class PaymentBase(BaseModel):
    amount: float
    payment_plan: str


# Properties to receive on Payment creation
class PaymentCreate(BaseModel):
    amount: float
    payment_plan: str


# Properties to receive on Payment deletion
class PaymentDelete(BaseModel):
    id: int


# Properties to receive on Payment update
class PaymentUpdate(BaseModel):
    expired_at: datetime

# Properties shared by models stored in DB


class PaymentInDBBase(PaymentBase):
    id: int
    amount: float
    payment_plan: str
    created_at: datetime
    expired_at: datetime
    payer_id: int

    class Config:
        orm_mode = True


# Properties to return to client
class Payment(PaymentInDBBase):
    payer: Optional[User] = None


# Properties properties stored in DB
class PaymentInDB(PaymentInDBBase):
    pass
