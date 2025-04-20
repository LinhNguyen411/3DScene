from typing import Optional

from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = False
    is_superuser: Optional[bool] = False
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    first_name: str
    last_name: str
    is_active: Optional[bool] = False
    is_superuser: Optional[bool] = False
    password: Optional[str] = None


# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_superuser: bool


class UserInDBBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

    class Config:
        orm_mode = True


# Additional properties to return via API
class User(UserInDBBase):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    is_superuser: bool
    is_pro: Optional[bool] = False


# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str
