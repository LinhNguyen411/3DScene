from pydantic import BaseModel, Field
from typing import Annotated, Optional
from datetime import datetime
from app.schemas.user import User


# Shared properties
class SplatBase(BaseModel):
    title: str
    owner_id: int
    task_id: str
    image_url: str


# Properties to receive on Splat creation
class SplatCreate(BaseModel):
    title: Annotated[str, Field(min_length=1)]
    image_url: Optional[str] = None
    task_id: str


# Properties to receive on Splat deletion
class SplatDelete(BaseModel):
    id: int


# Properties to receive on Splat update
class SplatUpdate(BaseModel):
    title: Annotated[str, Field(min_length=1)]

# Properties shared by models stored in DB


class SplatInDBBase(SplatBase):
    id: int
    title: str
    owner_id: int
    task_id: str
    image_url: str

    class Config:
        orm_mode = True


# Properties to return to client
class Splat(SplatInDBBase):
    owner: Optional[User] = None
    date_created: datetime
    task_metadata: Optional[dict] = None


# Properties properties stored in DB
class SplatInDB(SplatInDBBase):
    pass
