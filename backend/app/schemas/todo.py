from pydantic import BaseModel, Field
from typing_extensions import Annotated


# Shared properties
class TodoBase(BaseModel):
    title: str
    is_done: bool
    owner_id: int


# Properties to receive on Todo creation
class TodoCreate(BaseModel):
    title: Annotated[str, Field(min_length=1)]


# Properties to receive on Todo deletion
class TodoDelete(BaseModel):
    id: int


# Properties to receive on Todo update
class TodoUpdate(BaseModel):
    is_done: bool


# Properties shared by models stored in DB
class TodoInDBBase(TodoBase):
    id: int
    title: str
    owner_id: int

    class Config:
        orm_mode = True


# Properties to return to client
class Todo(TodoInDBBase):
    pass


# Properties properties stored in DB
class TodoInDB(TodoInDBBase):
    pass
