from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session  # type: ignore

from app import crud
from app.core.config import settings
from app.models.user import User
from app.tests.constants.user import UserTestConstants


def test_signup_new_user(client: TestClient, db: Session) -> None:
    faker: Faker = Faker()
    email = faker.email()
    first_name = faker.first_name()
    last_name = faker.last_name()
    password = faker.password()
    data = {
        "email": email,
        "password": password,
        "first_name": first_name,
        "last_name": last_name,
    }
    r = client.post(
        f"{settings.API_V1_STR}/users/signup",
        json=data,
    )

    assert r.status_code == 200
    user = crud.user.get_by_email(db, email=email)
    assert user
    assert user.email == email
    assert user.first_name == first_name
    assert user.last_name == last_name


def test_signup_existing_user(client: TestClient, ordinary_user: User) -> None:
    data = {
        "email": ordinary_user.email,
        "password": UserTestConstants.ORDINARY_USER_PASSWORD,
        "first_name": ordinary_user.first_name,
        "last_name": ordinary_user.last_name,
    }
    r = client.post(
        f"{settings.API_V1_STR}/users/signup",
        json=data,
    )
    assert r.status_code == 400


def test_get_user_info(client_user: TestClient, db: Session) -> None:
    r = client_user.get(
        f"{settings.API_V1_STR}/users/get-my-info",
    )
    expected_user: User = crud.user.get_multi(db)[0]
    api_user = r.json()
    assert r.status_code == 200
    assert api_user["email"] == expected_user.email
    assert api_user["first_name"] == expected_user.first_name
    assert api_user["last_name"] == expected_user.last_name
