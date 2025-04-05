from typing import List

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session  # type: ignore

from app.crud.base import CRUDBase
from app.models.splat import Splat
from app.schemas.splat import SplatCreate, SplatUpdate

from app.celery import celery_app
from app.core import modeling_tasks
from celery.result import AsyncResult


class CRUDSplat(CRUDBase[Splat, SplatCreate, SplatUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: SplatCreate, owner_id: int
    ) -> Splat:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data, owner_id=owner_id)   # type: ignore
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def query_get_multi_by_owner(
        self, db: Session, *, owner_id: int, is_processed: bool
    ) -> List[Splat]:
        query = (
            db.query(self.model)
            .filter(Splat.owner_id == owner_id)
            .filter(Splat.is_processed == is_processed)
            .order_by(Splat.date_created.desc())
        )
        if not is_processed:
            for splat in query.all():
                modeling_task_result = AsyncResult(
                    splat.task_id, app=celery_app.celery_app)
                modeling_task_state = modeling_task_result.state
                splat_dict = splat.__dict__
                splat_dict["task_metadata"] = {
                    "status": modeling_task_state,
                    "result": modeling_task_result.info
                    if hasattr(modeling_task_result, 'info')
                    else None
                }
        return query

    def get_multi(  # type: ignore
        self, db: Session, *, limit: int = 100
    ) -> List[Splat]:
        query = db.query(self.model)
        return query.limit(limit).all()

    def remove(self, db: Session, *, id: int) -> Splat:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        modeling_tasks.delete_modeling_task_data(obj.task_id)
        return obj


splat = CRUDSplat(Splat)
