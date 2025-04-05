from typing import Any, Optional
import uuid
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud
from app.core import modeling_tasks

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException,
                     File, UploadFile, Query)


router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=Page[schemas.Splat], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_splats(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    is_processed: Optional[bool] = None,
) -> Any:
    """
    Retrieve items.
    """

    if current_user.is_superuser:
        splats = crud.splat.get_multi(db=db)
    else:
        splats = crud.splat.query_get_multi_by_owner(
            db=db, owner_id=current_user.id, is_processed=is_processed)

    return paginate(splats, params)


@router.get("/{id}", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Delete an item.
    """
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user.is_superuser and (splat.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return splat


@router.post("/", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def create_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    file: UploadFile = File(...),
    num_iterations: int = Query(
        1000, description="Number of iterations for the opensplat command"),
    splat_in: schemas.SplatCreate
) -> Any:
    """
    Create new item.
    """
    modeling_task_id = str(uuid.uuid4())
    task_response = modeling_tasks.process_video(
        db=db, modeling_task_id=modeling_task_id,
        file=file, num_iterations=num_iterations)
    splat: models.Splat = crud.splat.create_with_owner(
        db, obj_in=splat_in, owner_id=current_user.id)
    response = splat.__dict__
    response["task_metadata"] = task_response
    return response


@router.put("/{id}", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
    splat_in: schemas.SplatUpdate,
) -> Any:
    """
    Update an item.
    """
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user.is_superuser and (splat.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    splat = crud.splat.update(db=db, db_obj=splat_in, obj_in=splat_in)
    return splat


@router.delete("/{id}", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def delete_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Delete an item.
    """
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user.is_superuser and (splat.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    splat = crud.splat.remove(db=db, id=id)
    return splat
