from typing import List
from sqlalchemy.orm import Session  # type: ignore

from app.crud.base import CRUDBase
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate


class CRUDFeedback(CRUDBase[Feedback, FeedbackCreate, FeedbackUpdate]):
    def get_multi(
        self, db: Session
    ) -> List[Feedback]:
        query = db.query(self.model)
        return query.order_by(Feedback.created_at.desc())

    def remove(self, db: Session, *, id: int) -> Feedback:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj


feedback = CRUDFeedback(Feedback)
