from typing import Any
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException)



router = APIRouter()


@router.get("/", response_model=Page[schemas.Feedback], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_feedbacks(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve items.
    """

    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    feedbacks = crud.feedback.get_multi(db=db)

    return paginate(feedbacks, params)


@router.get("/{id}", response_model=schemas.Feedback, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_feedback(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Delete an item.
    """
    feedback = crud.feedback.get(db=db, id=id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return feedback


@router.post("/", response_model=schemas.Feedback, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
async def create_feedback(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    feedback_in: schemas.FeedbackCreate
) -> Any:
    """
    Create new item.
    """
    
    feedback: models.Feedback = crud.feedback.create_with_owner(
        db, obj_in=feedback_in, owner_id=current_user.id)
    return feedback


@router.put("/{id}", response_model=schemas.Feedback, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_feedback(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
    feedback_in: schemas.FeedbackUpdate,
) -> Any:
    """
    Update an item.
    """
    feedback = crud.feedback.get(db=db, id=id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    feedback = crud.feedback.update(db=db, db_obj=feedback, obj_in=feedback_in)
    return feedback


@router.delete("/{id}", response_model=schemas.Detail, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def delete_feedback(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Delete an item.
    """
    feedback = crud.feedback.get(db=db, id=id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    feedback = crud.feedback.remove(db=db, id=id)
    return {"detail": f'Feedback deleted successfully {id}'}
