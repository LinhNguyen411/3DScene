from typing import List

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session  # type: ignore

from app.crud.base import CRUDBase
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentUpdate
from app.schemas.user import User

from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
import re
from sqlalchemy import func



class CRUDPayment(CRUDBase[Payment, PaymentCreate, PaymentUpdate]):
    def create_with_payer(
        self, db: Session, *, obj_in: PaymentCreate, payer_id: int
    ) -> Payment:
        obj_in_data = jsonable_encoder(obj_in)

        created_at = datetime.now()
        plan = obj_in_data.get("payment_plan", "").lower()
        expired_at = created_at

        if "month" in plan:
            expired_at = created_at + timedelta(days=30)
        elif "year" in plan:
            expired_at = created_at + timedelta(days=365)

        db_obj = self.model(
            **obj_in_data,
            created_at=created_at,
            expired_at=expired_at,
            payer_id=payer_id
        )   # type: ignore
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def query_get_multi_by_payer(
        self, db: Session, *, payer_id: int
    ) -> List[Payment]:

        return (
            db.query(self.model)
            .filter(Payment.payer_id == payer_id)
            .options(joinedload(self.model.payer))
            .order_by(Payment.id.desc())
        )
    def get_multi(
        self, db: Session
    ) -> List[Payment]:
        query = db.query(self.model)
        return query.options(joinedload(self.model.payer)).order_by(Payment.id.desc())

    def remove(self, db: Session, *, id: int) -> Payment:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj
    def check_is_last_payment_not_expired(self, db: Session, *, payer_id:int) -> bool:
        last_payment = (
        db.query(Payment)
        .filter(Payment.payer_id == payer_id)
        .order_by(Payment.created_at.desc())
        .first()
        )
        if last_payment and last_payment.expired_at > datetime.now():
            return True
        return False
    def count_pro_users(self, db: Session) -> int:
        payment_subquery = (
        db.query(Payment.payer_id)
        .distinct()
        .subquery()
    )
    
        # Count users whose last payment is not expired
        count = 0
        for payer_id in db.query(payment_subquery):
            is_pro = payment.check_is_last_payment_not_expired(db, payer_id=payer_id[0])
            if is_pro:
                count += 1
                
        return count
    
    def get_total_amount(self, db: Session) -> float:
        total = db.query(func.sum(Payment.amount)).scalar() or 0.0
        return total


payment = CRUDPayment(Payment)
