from typing import Generator
import pytest
from app.models.user import User
from app.tests.constants.user import UserTestConstants
from app.tests.factories.user import UserFactory
from fastapi.testclient import TestClient
from app.core import security


@pytest.fixture(scope="function")
def client_superuser(client: TestClient) -> Generator[TestClient, None, None]:
    """
    Fixture that returns a TestClient with superuser authentication headers.
    It also creates a user in DB.
    """
    user: User = UserFactory(
        is_superuser=True,
        email=UserTestConstants.CLIENT_SUPERUSER_EMAIL,
        password=UserTestConstants.CLIENT_SUPERUSER_PASSWORD,
    )
    access_token: str = security.create_access_token(user.id)
    headers = {"Authorization": f"Bearer {access_token}"}
    # Modify the client to automatically include the superuser headers in each request
    client.headers.update(headers)
    yield client
    # Clean up: Remove the superuser headers after the test
    client.headers.clear()


@pytest.fixture(scope="function")
def client_user(client: TestClient) -> Generator[TestClient, None, None]:
    """
    Fixture that returns a TestClient with authentication headers. It also creates a user in DB.
    """
    user: User = UserFactory()
    access_token: str = security.create_access_token(user.id)
    headers = {"Authorization": f"Bearer {access_token}"}
    client.headers.update(headers)
    yield client
    client.headers.clear()
