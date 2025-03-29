from typing import Generator
import pytest
from app.models.todo import Todo
from app.tests.factories.todo import TodoFactory


@pytest.fixture(scope="function")
def todo() -> Generator[Todo, None, None]:
    """
    Fixture that create an Todo.
    """
    todo: Todo = TodoFactory()
    yield todo
