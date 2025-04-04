from pydantic import BaseModel
from typing import Optional


# Shared properties
class ModelingTaskBase(BaseModel):
    modeling_task_id: str
    status: str

# Properties to receive on ModelingTask deletion


class ModelingTaskDelete(BaseModel):
    modeling_task_id: str


class ModelingTaskInDBBase(ModelingTaskBase):
    modeling_task_id: str
    title: str
    owner_id: int

    class Config:
        orm_mode = True


# Properties to return to client
class ModelingTaskResponse(ModelingTaskBase):
    message: str

# Properties properties stored in DB


class ModelingTaskStatus(ModelingTaskBase):
    result: Optional[dict] = None
