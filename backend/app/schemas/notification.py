# from pydantic import BaseModel, Field
# from typing import Annotated, Optional
# from datetime import datetime
# from app.schemas.user import User


# # Shared properties
# class NotificationBase(BaseModel):
#     title: str
#     message: str
#     is_read: bool = False


# # Properties to receive on Notification creation
# class NotificationCreate(BaseModel):
#     title: Annotated[str, Field(min_length=1)]
#     message: Annotated[str, Field(min_length=1)]
#     is_read: Optional[bool] = False


# # Properties to receive on Notification update
# class NotificationUpdate(BaseModel):
#     title: Optional[str] = None
#     message: Optional[str] = None
#     is_read: Optional[bool] = None


# # Properties shared by models stored in DB
# class NotificationInDBBase(NotificationBase):
#     id: int
#     created_at: datetime
#     updated_at: datetime

#     class Config:
#         orm_mode = True


# # Properties to return to client
# class Notification(NotificationInDBBase):
#     user: Optional[User] = None


# # Properties stored in DB
# class NotificationInDB(NotificationInDBBase):
#     pass