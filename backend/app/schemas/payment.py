# from pydantic import BaseModel
# from typing import Optional
# from datetime import datetime

# class PaymentBase(BaseModel):
#     amount: float
#     method: str
#     status: str

# class PaymentCreate(PaymentBase):
#     pass

# class PaymentUpdate(BaseModel):
#     amount: Optional[float] = None
#     method: Optional[str] = None
#     status: Optional[str] = None

# class Payment(PaymentBase):
#     id: int
#     created_at: datetime
#     updated_at: datetime

#     class Config:
#         orm_mode = True