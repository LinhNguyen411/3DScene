from typing import List
from sqlalchemy.orm import Session  # type: ignore

from app.crud.base import CRUDBase
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate
from datetime import datetime, timedelta



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
    def get_recent(
        self, db: Session
    ) -> List[Feedback]:
        twenty_four_hours_ago = datetime.now() - timedelta(hours=24)
        query = db.query(self.model).filter(self.model.created_at >= twenty_four_hours_ago).order_by(Feedback.created_at.desc())
        return query


feedback = CRUDFeedback(Feedback)
