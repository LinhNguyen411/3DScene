from typing import Union
import pytest
from fastapi.testclient import TestClient
from app.core.config import settings


@pytest.mark.parametrize(
    "data, expected_status_code",
    [
        ({"title": "Foo"}, 200),  # Test with valid data
        ({"invalid_key": ""}, 422),  # Test without key title
        ({"title": ""}, 422),  # Test with empty title
        ({"title": None}, 422),  # Test with None as title
        ("title", 422),  # Test without dict
    ],
)
def test_create_todo(
    client_user: TestClient, data: Union[dict, str], expected_status_code: int
) -> None:
    response = client_user.post(
        f"{settings.API_V1_STR}/todos/create-todo",
        json=data,
    )
    assert response.status_code == expected_status_code


def test_read_todos(client_user: TestClient) -> None:
    response = client_user.get(
        f"{settings.API_V1_STR}/todos/get-my-todos",
    )
    assert response.status_code == 200
    content = response.json()
    assert "total" in content
    assert "size" in content
    assert "page" in content
