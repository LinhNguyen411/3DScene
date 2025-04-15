from pydantic import BaseModel, Field
from typing import Annotated, Optional
from datetime import datetime
from app.schemas.user import User


# Shared properties
class SplatBase(BaseModel):
    title: str
    owner_id: int


# Properties to receive on Splat creation
class SplatCreate(BaseModel):
    id: str
    title: Annotated[str, Field(min_length=1)]
    image_url: str
    is_public: Optional[bool]
    model_url: Optional[str]
    status:Optional[str]
    


# Properties to receive on Splat deletion
class SplatDelete(BaseModel):
    id: int


# Properties to receive on Splat update
class SplatUpdate(BaseModel):
    title: Optional[str]
    is_public: Optional[bool]
    status: Optional[str]
    model_url:Optional[str]


# Properties shared by models stored in DB


class SplatInDBBase(SplatBase):
    id: str
    title: str
    owner_id: int
    image_url: str

    class Config:
        orm_mode = True


# Properties to return to client
class Splat(SplatInDBBase):
    owner: Optional[User] = None
    date_created: datetime
    model_url: Optional[str] = None
    is_public: bool
    status: str

# Properties properties stored in DB
class SplatInDB(SplatInDBBase):
    pass
