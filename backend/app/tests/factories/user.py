import factory
from app.models.user import User
from app.core.security import get_password_hash
from app.tests.constants.user import UserTestConstants


class UserFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session_persistence = "commit"

    email = factory.Faker("email")
    hashed_password = factory.LazyFunction(
        lambda: get_password_hash(UserTestConstants.USER_DEFAULT_PASSWORD)
    )
    is_active = True
    is_superuser = False
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # Handle the password argument before creating the user
        if "password" in kwargs:
            kwargs["hashed_password"] = get_password_hash(kwargs.pop("password"))
        return super()._create(model_class, *args, **kwargs)
