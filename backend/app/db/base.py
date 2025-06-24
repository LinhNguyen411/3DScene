# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base
from app.models.user import User
from app.models.model import Model
from app.models.feedback import Feedback
from app.models.payment import Payment
from app.models.order import Order