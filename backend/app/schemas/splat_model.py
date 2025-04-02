from pydantic import BaseModel
from typing import Optional


# Shared properties
class SplatModelBase(BaseModel):
    splat_model_id: str
    status: str

# Properties to receive on SplatModel deletion


class SplatModelDelete(BaseModel):
    id: int


class SplatModelInDBBase(SplatModelBase):
    id: int
    title: str
    owner_id: int

    class Config:
        orm_mode = True


# Properties to return to client
class SplatModelResponse(SplatModelBase):
    message: str

# Properties properties stored in DB


class SplatModelStatus(SplatModelBase):
    result: Optional[dict] = None
