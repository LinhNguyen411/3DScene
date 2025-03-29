from sqlalchemy.orm import Session  # type: ignore

from app import crud, schemas
from app.core.config import settings
from app.db.base import Base 
from app.db.session import engine

# make sure all SQL Alchemy models are imported (app.db.base) before initializing DB
# otherwise, SQL Alchemy might fail to initialize relationships properly
# for more details: https://github.com/tiangolo/full-stack-fastapi-postgresql/issues/28



def init_db(db: Session) -> None:
    # Tables should be created with Alembic migrations
    # But in this app we create during start of application
    Base.metadata.create_all(bind=engine)   # type: ignore
    # Create user if not exist
    user = crud.user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
    if not user:
        user_in = schemas.UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            first_name=settings.FIRST_SUPERUSER_FIRST_NAME,
            last_name=settings.FIRST_SUPERUSER_LAST_NAME,
            is_active=True,
            is_superuser=True,
        )
        user = crud.user.create(db, obj_in=user_in)

    # Create ToDos to fill Data Base
    todos = crud.todo.get_multi(db, is_done=False)
    number_todo = 100
    if len(todos)<number_todo:
        print("Creating todos in Data Base")
        for i in range(number_todo):
            todo_in = schemas.TodoCreate(
                title=f"Visit the office #{str(i+1)}",
                is_done=False,
                
            )
            crud.todo.create_with_owner(db, obj_in=todo_in, owner_id=user.id)