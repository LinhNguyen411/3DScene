from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import User


# Shared properties
class OrderBase(BaseModel):
    amount: float
    status: str


# Properties to receive on Order creation
class OrderCreate(BaseModel):
    id: int
    amount: float
    status: str


# Properties to receive on Order deletion
class OrderDelete(BaseModel):
    id: int


# Properties to receive on Order update
class OrderUpdate(BaseModel):
    status: str

# Properties shared by models stored in DB


class OrderInDBBase(OrderBase):
    id: int
    amount: float
    status: str
    created_at: datetime
    orderer_id: int

    class Config:
        orm_mode = True


# Properties to return to client
class Order(OrderInDBBase):
    orderer: Optional[User] = None


# Properties properties stored in DB
class OrderInDB(OrderInDBBase):
    pass
