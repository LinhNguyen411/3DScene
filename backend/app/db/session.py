from sqlalchemy import create_engine  # type: ignore
from sqlalchemy.orm import sessionmaker  # type: ignore

from app.core.config import settings

engine = create_engine(
    settings.POSTGRESQL_DATABASE_URI,
    pool_pre_ping=True,
    # connect_args={'check_same_thread': False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
