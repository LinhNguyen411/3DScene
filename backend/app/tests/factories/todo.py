import factory
from app.models.todo import Todo
from app.tests.factories.user import UserFactory


class TodoFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Todo
        sqlalchemy_session_persistence = "commit"

    title = factory.Faker("word")
    is_done = factory.Faker("boolean")
    owner = factory.SubFactory(UserFactory)
