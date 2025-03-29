from faker import Faker
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app import crud, schemas
from app.core.config import settings
from app.models.user import User
from app.tests.factories.user import UserFactory
from sqlalchemy.orm import Session  # type: ignore
from jose import jwt  # type: ignore
from app.core import security


def test_get_access_token(client: TestClient) -> None:
    password: str = "password"
    user: User = UserFactory(password=password)
    login_data: dict = {
        "username": user.email,
        "password": password,
    }
    r = client.post(f"{settings.API_V1_STR}/login/get-access-token", data=login_data)
    tokens: dict = r.json()
    assert r.status_code == 200
    assert "access_token" in tokens
    assert tokens["access_token"]


def test_use_access_token(client: TestClient, client_user: TestClient) -> None:
    r = client_user.post(
        f"{settings.API_V1_STR}/login/verify-token",
    )
    result = r.json()
    assert r.status_code == 200
    assert "email" in result


def test_forgot_email_not_existing_email(client: TestClient) -> None:
    email = Faker().email()
    r = client.post(f"{settings.API_V1_STR}/login/password-recovery/{email}")
    assert r.status_code == 201


def test_forgot_email_existing_email(client: TestClient, ordinary_user: User) -> None:
    email = ordinary_user.email
    r = client.post(f"{settings.API_V1_STR}/login/password-recovery/{email}")
    assert r.status_code == 200


@patch("app.api.api_v1.endpoints.login.id_token.verify_oauth2_token")
def test_google_auth(
    mock_verify_oauth2_token: MagicMock,
    client: TestClient,
    db: Session,
    ordinary_user: User,
):
    # Mock data to return from the patched `verify_oauth2_token` function
    mock_verify_oauth2_token.return_value = {
        "email": ordinary_user.email,
    }
    data: dict = {"credentials": "string"}
    r = client.post(f"{settings.API_V1_STR}/login/google-auth", json=data)
    assert r.status_code == 200
    access_token: str = r.json()["access_token"]
    payload = jwt.decode(
        access_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
    )
    token_data = schemas.TokenPayload(**payload)
    user = crud.user.get(db, id=token_data.sub)
    assert user.id == ordinary_user.id
