from typing import List

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session  # type: ignore

from app.crud.base import CRUDBase
from app.models.model import Model
from app.schemas.model import ModelCreate, ModelUpdate
from app.models.user import User

from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta

class CRUDModel(CRUDBase[Model, ModelCreate, ModelUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: ModelCreate, owner_id: int
    ) -> Model:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data, owner_id=owner_id)   # type: ignore
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def query_get_multi_by_owner(
        self, db: Session, *, owner_id: int
    ) -> List[Model]:

        return (
            db.query(self.model)
            .filter(Model.owner_id == owner_id)
            .options(joinedload(self.model.owner))
            .order_by(Model.id.desc())
        )

    def get_multi_by_public(
        self, db: Session
    ) -> List[Model]:
        """
        Get multiple Models filtered by public status.
        """
        return (
            db.query(self.model)
            .filter(Model.is_public == True)
            .options(joinedload(self.model.owner))
            .order_by(Model.id.desc())
        )
    
    def get_multi_by_gallery(
        self, db: Session
    ) -> List[Model]:
        """
        Get multiple Models filtered by public status.
        """
        return (
            db.query(self.model)
            .filter(self.model.is_public == True)
            .join(User, User.id == self.model.owner_id)
            .filter(User.is_superuser == True)
            .options(joinedload(self.model.owner))
            .order_by(self.model.id.asc())
        )

    def get_multi(
        self, db: Session
    ) -> List[Model]:
        query = db.query(self.model)
        return query.options(joinedload(self.model.owner)).order_by(Model.date_created.desc())

    def remove(self, db: Session, *, id: int) -> Model:
        obj = db.query(self.model).options(joinedload(self.model.owner)).get(id)
        db.delete(obj)
        db.commit()
        return obj
    def get_models_last_24_hours(self, db: Session) -> List[Model]:
        time_threshold = datetime.now() - timedelta(hours=24)
        return (
            db.query(self.model)
            .filter(Model.date_created >= time_threshold)
            .options(joinedload(self.model.owner))
            .order_by(Model.date_created.desc())
            .all()
        )


model = CRUDModel(Model)
