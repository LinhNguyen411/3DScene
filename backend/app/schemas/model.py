from pydantic import BaseModel, Field
from typing import Annotated, Optional, Dict, Any
from datetime import datetime
from app.schemas.user import User


class ModelBase(BaseModel):
    title: str
    owner_id: int


# Properties to receive on Model creation
class ModelCreate(BaseModel):
    id: str
    title: Annotated[str, Field(min_length=1)]
    image_url: str
    is_public: Optional[bool]
    model_url: Optional[str]
    model_size: Optional[float]
    status:Optional[str]
    


# Properties to receive on Model deletion
class ModelDelete(BaseModel):
    id: int


# Properties to receive on Model update
class ModelUpdate(BaseModel):
    title: Optional[str]
    is_public: Optional[bool]
    status: Optional[str]
    model_url:Optional[str]
    model_size: Optional[float]
    colmap_url: Optional[str]
    time_finished: Optional[datetime]
    camera_init: Optional[Dict[str, Any]]
    model_transform: Optional[Dict[str, Any]]



# Properties shared by models stored in DB


class ModelInDBBase(ModelBase):
    id: str
    title: str
    owner_id: int
    image_url: str

    class Config:
        orm_mode = True


# Properties to return to client
class Model(ModelInDBBase):
    status: str
    is_public: bool
    owner: Optional[User] = None

    date_created: datetime
    time_finished: Optional[datetime] = None

    model_url: Optional[str] = None
    model_size: Optional[float] = None
    colmap_url: Optional[str] = None

    camera_init: Optional[Dict[str, Any]] = None
    model_transform: Optional[Dict[str, Any]] = None
    
# Properties properties stored in DB
class ModelInDB(ModelInDBBase):
    pass
