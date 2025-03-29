from faker import Faker
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session  # type: ignore

from app import crud
from app.models.user import User
from app.schemas.user import UserCreate
from app.tests.constants.user import UserTestConstants
from app.tests.factories.user import UserFactory


def test_create_user(db: Session) -> None:
    faker: Faker = Faker()
    email = faker.email()
    password = faker.password(length=10)
    first_name = faker.first_name()
    last_name = faker.last_name()
    user_in = UserCreate(
        email=email, password=password, first_name=first_name, last_name=last_name
    )
    user = crud.user.create(db, obj_in=user_in)
    assert user.email == email
    assert hasattr(user, "hashed_password")


def test_authenticate_user(db: Session, ordinary_user: User) -> None:
    authenticated_user = crud.user.authenticate(
        db, email=ordinary_user.email, password=UserTestConstants.ORDINARY_USER_PASSWORD
    )
    assert authenticated_user
    assert ordinary_user.email == authenticated_user.email


def test_not_authenticate_user(db: Session) -> None:
    faker: Faker = Faker()
    email = faker.email()
    password = faker.password(length=10)
    user = crud.user.authenticate(db, email=email, password=password)
    assert user is None


def test_check_if_user_is_active(ordinary_user: User) -> None:
    is_active = crud.user.is_active(ordinary_user)
    assert is_active is True


def test_check_if_user_is_active_inactive() -> None:
    user: User = UserFactory(is_active=False)
    is_active = crud.user.is_active(user)
    assert is_active is False


def test_get_user(db: Session, ordinary_user: User) -> None:
    user_2 = crud.user.get(db, id=ordinary_user.id)
    assert user_2
    assert ordinary_user.email == user_2.email
    assert jsonable_encoder(ordinary_user) == jsonable_encoder(user_2)
