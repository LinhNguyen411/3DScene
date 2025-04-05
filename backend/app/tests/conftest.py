from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session  # type: ignore
from sqlalchemy.exc import ProgrammingError
from app.core.config import settings
from app.main import app  # type: ignore
from app.tests.factories.user import UserFactory
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.db.base import Base
from app.api.deps import get_db
# All fixtures should be imported in conftest.py
from app.tests.fixtures.user import ordinary_user
from app.tests.fixtures.authorization import client_superuser, client_user

# Set up a test database URL
TEST_SQLALCHEMY_DATABASE_URL = settings.POSTGRESQL_TEST_DATABASE_URI

admin_engine = create_engine(
    settings.POSTGRESQL_ADMIN_DATABASE_URI, isolation_level="AUTOCOMMIT"
)

# Create an engine and sessionmaker bound to the test database
engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)


def create_test_database():
    """Create the test database if it doesn't exist."""
    with admin_engine.connect() as connection:
        try:
            connection.execute(
                text(f"CREATE DATABASE {
                     TEST_SQLALCHEMY_DATABASE_URL.split('/')[-1]}")
            )
        except ProgrammingError:
            print("Database already exists, continuing...")


def drop_test_database():
    """Drop the test database after tests are done."""
    with admin_engine.connect() as connection:
        connection.execute(
            text("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '3dscene_db_test'
            AND pid <> pg_backend_pid();
        """)
        )
        connection.execute(
            text(
                f"DROP DATABASE IF EXISTS {
                    TEST_SQLALCHEMY_DATABASE_URL.split('/')[-1]}"
            )
        )


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Create the test database schema before any tests run,
    and drop it after all tests are done.
    """
    create_test_database()  # Ensure the test database is created
    Base.metadata.create_all(bind=engine)  # Create tables
    yield
    Base.metadata.drop_all(bind=engine)  # Drop tables after tests


@pytest.fixture(scope="function")
def db() -> Generator:
    """
    Create a new database session for each test and roll it back after the test.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Provide a TestClient that uses the test database session.
    Override the get_db dependency to use the test session.
    """

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def set_session_for_factories(db: Session):
    UserFactory._meta.sqlalchemy_session = db
