from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session  # type: ignore
from fastapi_pagination import Params, Page
from fastapi_pagination.ext.sqlalchemy import paginate

from app import crud
from app import models
from app import schemas
from app.api import deps

router = APIRouter()


@router.post("/create-todo", response_model=schemas.Todo, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def create_todo(
    *,
    db: Session = Depends(deps.get_db),
    todo_in: schemas.TodoCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new todo for current user.
    """
    todo: models.Todo = crud.todo.create_with_owner(
        db, obj_in=todo_in, owner_id=current_user.id)
    return todo


@router.put("/update-todo", response_model=schemas.Todo, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_todo(
    *,
    db: Session = Depends(deps.get_db),
    id: int = Body(...),
    todo_in: schemas.TodoUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update an todo for current user.
    """
    todo = crud.todo.get(db=db, id=id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    todo = crud.todo.update(db=db, db_obj=todo, obj_in=todo_in)
    return todo


@router.delete("/delete-todo", response_model=schemas.Todo, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"},
    404: {"model": schemas.Detail, "description": "Todo not found"},
})
def delete_todo(
    *,
    db: Session = Depends(deps.get_db),
    todo_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete todo for current user.
    """
    todo = crud.todo.get(db=db, id=todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    todo = crud.todo.remove(db=db, id=todo_id)
    return todo


@router.get("/get-my-todos", response_model=Page[schemas.Todo], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_todos(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    is_done: bool = False,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get todos of current user.
    """
    todos = crud.todo.query_get_multi_by_owner(
        db=db, owner_id=current_user.id, is_done=is_done,
    )
    return paginate(todos, params)
