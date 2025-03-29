from typing import List
from xmlrpc.client import Boolean

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session  # type: ignore

from app.crud.base import CRUDBase
from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoUpdate


class CRUDTodo(CRUDBase[Todo, TodoCreate, TodoUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: TodoCreate, owner_id: int
    ) -> Todo:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data, owner_id=owner_id)   # type: ignore
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def query_get_multi_by_owner(
        self, db: Session, *, owner_id: int, is_done: bool
    ) -> List[Todo]:
        query = (
            db.query(self.model)
            .filter(Todo.owner_id == owner_id)
            .order_by(Todo.id.desc())
        )
        if is_done is True:
            query = query.filter(Todo.is_done == True)
        elif is_done is False:
            query = query.filter(Todo.is_done == False)
        return query

    def get_multi(  # type: ignore
        self, db: Session, *, is_done: bool, limit: int = 100
    ) -> List[Todo]:
        query = db.query(self.model)
        if is_done == True:
            query = query.filter(Todo.is_done == True)
        elif is_done == False:
            query = query.filter(Todo.is_done == False)
        return query.limit(limit).all()

    def remove(self, db: Session, *, id: int) -> Todo:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj


todo = CRUDTodo(Todo)
