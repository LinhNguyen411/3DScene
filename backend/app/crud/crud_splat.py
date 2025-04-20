from typing import List

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session  # type: ignore

from app.crud.base import CRUDBase
from app.models.splat import Splat
from app.schemas.splat import SplatCreate, SplatUpdate
from app.models.user import User

from sqlalchemy.orm import joinedload
from sqlalchemy.sql import func  # type: ignore
from typing import Dict
from datetime import datetime, timedelta

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
        self, db: Session, *, owner_id: int
    ) -> List[Splat]:

        return (
            db.query(self.model)
            .filter(Splat.owner_id == owner_id)
            .options(joinedload(self.model.owner))
            .order_by(Splat.id.desc())
        )

    def get_multi_by_public(
        self, db: Session
    ) -> List[Splat]:
        """
        Get multiple splats filtered by public status.
        """
        return (
            db.query(self.model)
            .filter(Splat.is_public == True)
            .options(joinedload(self.model.owner))
            .order_by(Splat.id.desc())
        )
    
    def get_multi_by_gallery(
        self, db: Session
    ) -> List[Splat]:
        """
        Get multiple splats filtered by public status.
        """
        return (
            db.query(self.model)
            .filter(self.model.is_public == True)
            .join(User, User.id == self.model.owner_id)  # Explicit join using foreign key
            .filter(User.is_superuser == True)  # Filter on User.is_superuser
            .options(joinedload(self.model.owner))  # Eager load owner data
            .order_by(self.model.id.asc())
        )

    def get_multi(
        self, db: Session
    ) -> List[Splat]:
        query = db.query(self.model)
        return query.options(joinedload(self.model.owner)).order_by(Splat.id.desc())

    def remove(self, db: Session, *, id: int) -> Splat:
        obj = db.query(self.model).options(joinedload(self.model.owner)).get(id)
        db.delete(obj)
        db.commit()
        return obj
    def get_splats_last_24_hours(self, db: Session) -> List[Splat]:
        time_threshold = datetime.now() - timedelta(hours=24)
        return (
            db.query(self.model)
            .filter(Splat.date_created >= time_threshold)
            .options(joinedload(self.model.owner))
            .order_by(Splat.date_created.desc())
            .all()
        )


splat = CRUDSplat(Splat)
