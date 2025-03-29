from typing import Generator
import pytest
from app.models.user import User
from app.tests.constants.user import UserTestConstants
from app.tests.factories.user import UserFactory


@pytest.fixture(scope="function")
def ordinary_user() -> Generator[User, None, None]:
    """
    Fixture that create an ordinary User.
    """
    user: User = UserFactory(
        is_superuser=False,
        email=UserTestConstants.ORDINARY_USER_EMAIL,
        password=UserTestConstants.ORDINARY_USER_PASSWORD,
    )
    yield user
