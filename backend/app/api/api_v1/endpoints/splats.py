from typing import Any, Optional
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud
from app.core import modeling_tasks
from app.celery import celery_app
from celery.result import AsyncResult

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException,
                     File, UploadFile, Form)
from fastapi.responses import FileResponse
import os


router = APIRouter()


@router.get("/", response_model=Page[schemas.Splat], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_splats(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve items.
    """

    if current_user.is_superuser:
        splats = crud.splat.get_multi(db=db)
    else:
        splats = crud.splat.query_get_multi_by_owner(
            db=db, owner_id=current_user.id)
    
    paginated_result = paginate(splats, params)

    # Add task_metadata to each item in the paginated results
    for splat in paginated_result.items:
        modeling_task_result = AsyncResult(
            splat.task_id, app=celery_app.celery_app
        )
        splat.task_metadata = {
            "status": modeling_task_result.state,
            "result": modeling_task_result.info if hasattr(modeling_task_result, 'info') else None
        }

    return paginated_result


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
    response = splat.__dict__
    modeling_task_result = AsyncResult(response["task_id"], app=celery_app.celery_app)
    response["task_metadata"] = {
        "status": modeling_task_result.state,
        "result": modeling_task_result.info
        if hasattr(modeling_task_result, 'info')
        else None
    }
    return splat


@router.post("/", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
async def create_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    title: str = Form(...),
    file: UploadFile = File(...),
    num_iterations: int = Form(15000, description="Number of iterations for the opensplat command")
) -> Any:
    """
    Create new item.
    """
    
    task_response = await modeling_tasks.process_video(
        file=file, num_iterations=num_iterations)
    splat_in = schemas.SplatCreate(
        title=title,
        task_id = task_response["modeling_task_id"],
        image_url = task_response["image_url"]
    )
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
    splat = crud.splat.update(db=db, db_obj=splat, obj_in=splat_in)
    return splat


@router.delete("/{id}", response_model=schemas.Detail, responses={
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
    return {"detail": f'Splat deleted successfully {id}'}



@router.get("/{id}/download", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def download_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    # Check if the modeling_task has completed
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user.is_superuser and (splat.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    modeling_task_result = AsyncResult(
        splat.task_id, app=celery_app.celery_app)
    if not modeling_task_result:
        raise HTTPException(status_code=404, detail="Task not found")
    # Check task state
    if modeling_task_result.state != 'SUCCESS':
        raise HTTPException(
            status_code=404,
            detail=f"Result not ready or task failed. Current state: {modeling_task_result.state}")

    # Get the result from the backend
    try:
        # Add timeout to avoid hanging
        result = modeling_task_result.get(timeout=5)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve result: {str(e)}")

    # Ensure result is a dictionary and has 'output_path'
    if not isinstance(result, dict) or "output_path" not in result:
        raise HTTPException(
            status_code=500,
            detail="Task result is malformed, 'output_path' not found"
        )

    output_path = result["output_path"]
    if not output_path:
        raise HTTPException(status_code=400, detail="Output path is None")
    if not os.path.exists(output_path):
        raise HTTPException(
            status_code=400,
            detail=f"Output file not found at: {output_path}"
        )

    # Return the file as a download response
    return FileResponse(
        path=output_path,
        filename=os.path.basename(output_path),
        media_type="application/octet-stream"
    )