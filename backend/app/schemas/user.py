from typing import Optional

from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = False
    is_superuser: bool = False
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None


class UserInDBBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

    class Config:
        orm_mode = True


# Additional properties to return via API
class User(UserInDBBase):
    email: EmailStr
    first_name: str
    last_name: str


# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str
