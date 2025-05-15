from typing import List

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session  # type: ignore

from app.crud.base import CRUDBase
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderUpdate

from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
import re


class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
    def create_with_payer(
        self, db: Session, *, obj_in: OrderCreate, orderer_id: int
    ) -> Order:
        obj_in_data = jsonable_encoder(obj_in)

        created_at = datetime.now()

        db_obj = self.model(
            **obj_in_data,
            created_at=created_at,
            orderer_id=orderer_id
        ) 
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def query_get_multi_by_payer(
        self, db: Session, *, orderer_id: int
    ) -> List[Order]:

        return (
            db.query(self.model)
            .filter(Order.orderer_id == orderer_id)
            .options(joinedload(self.model.payer))
            .order_by(Order.id.desc())
        )
    def get_multi(
        self, db: Session
    ) -> List[Order]:
        query = db.query(self.model)
        return query.options(joinedload(self.model.orderer)).order_by(Order.id.desc())

    def remove(self, db: Session, *, id: int) -> Order:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj

order = CRUDOrder(Order)
