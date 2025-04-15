from typing import Any, Optional
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud
from app.celery import celery_app
from celery.result import AsyncResult

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException,
                     File, UploadFile, Form)
from fastapi.responses import FileResponse
import os
import uuid
from app.core.config import settings
import shutil
import cv2



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

    return paginate(splats, params)



@router.get("/{id}", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: str,
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
async def create_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    title: str = Form(...),
    file: UploadFile = File(...),
    num_iterations: int = Form(10, description="Number of iterations for the opensplat command")
) -> Any:
    """
    Create new item.
    """
    splat_id = str(uuid.uuid4())

    modeling_task_dir = os.path.join(settings.MODEL_WORKSPACES_DIR, str(current_user.id), splat_id)
    os.makedirs(modeling_task_dir, exist_ok=True)

    # Save the uploaded video
    upload_path = os.path.join(modeling_task_dir, "upload")
    os.makedirs(upload_path)
    video_path = os.path.join(upload_path, file.filename)
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract first frame as thumbnail
    cap = cv2.VideoCapture(video_path)
    success, frame = cap.read()
    cap.release()

    thumbnail_url = None
    if success:
        os.makedirs(settings.MODEL_THUMBNAILS_DIR, exist_ok=True)
        thumbnail_filename = f"{splat_id}_thumbnail.jpg"
        thumbnail_path = os.path.join(settings.MODEL_THUMBNAILS_DIR, thumbnail_filename)
        cv2.imwrite(thumbnail_path, frame)
        
        # Build the public URL or relative path to return
        thumbnail_url = f"/thumbnails/{thumbnail_filename}"  # or adjust based on your static route

    
    splat_in = schemas.SplatCreate(
        id=splat_id,
        title=title,
        image_url = thumbnail_url
    )

    splat: models.Splat = crud.splat.create_with_owner(
        db, obj_in=splat_in, owner_id=current_user.id)
    
    celery_app.process_video.delay(
        task_id = splat.id,workspace_path=modeling_task_dir, video_path = video_path, num_iterations = num_iterations)
    
    return splat


@router.post("/model-upload", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    413: {"model": schemas.Detail, "description": "File too large (max 5GB)"}
})
async def upload_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    title: str = Form(...),
    is_public: bool = Form(...),
    model: UploadFile = File(...),
    thumbnail: UploadFile = File(...),
) -> Any:
    """
    Create new item with support for models up to 5GB.
    """
    # Set maximum file size to 5GB (in bytes)
    MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB

    splat_id = str(uuid.uuid4())
    modeling_task_dir = os.path.join(settings.MODEL_WORKSPACES_DIR, str(current_user.id), splat_id)
    os.makedirs(modeling_task_dir, exist_ok=True)

    # Prepare directory for model upload
    upload_path = os.path.join(modeling_task_dir, "model")
    os.makedirs(upload_path)
    model_path = os.path.join(upload_path, model.filename)
    
    # Stream the model file to disk in chunks rather than loading it all into memory
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    
    try:
        with open(model_path, "wb") as buffer:
            while True:
                chunk = await model.read(chunk_size)
                if not chunk:
                    break
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    # Clean up partial file
                    buffer.close()
                    os.remove(model_path)
                    raise HTTPException(
                        status_code=413,
                        detail=f"Model file too large. Maximum size is 5GB."
                    )
                buffer.write(chunk)
    except Exception as e:
        # Clean up in case of other errors
        if os.path.exists(model_path):
            os.remove(model_path)
        if os.path.exists(modeling_task_dir):
            shutil.rmtree(modeling_task_dir)
        raise HTTPException(status_code=500, detail=f"Error during file upload: {str(e)}")

    # Extract thumbnail efficiently
    thumbnail_ext = os.path.splitext(thumbnail.filename)[-1]
    thumbnail_filename = f"{splat_id}_thumbnail{thumbnail_ext}"
    thumbnail_path = os.path.join(settings.MODEL_THUMBNAILS_DIR, thumbnail_filename)
    
    # Make sure the thumbnails directory exists
    os.makedirs(settings.MODEL_THUMBNAILS_DIR, exist_ok=True)
    
    # Stream thumbnail to disk
    with open(thumbnail_path, "wb") as f:
        while True:
            chunk = await thumbnail.read(1024 * 1024)  # 1MB chunks
            if not chunk:
                break
            f.write(chunk)

    thumbnail_url = f"/thumbnails/{thumbnail_filename}"

    # Create the database entry
    splat_in = schemas.SplatCreate(
        id=splat_id,
        title=title,
        image_url=thumbnail_url,
        model_url=model_path,
        is_public=is_public,
        status='SUCCESS'
    )

    splat: models.Splat = crud.splat.create_with_owner(
        db, obj_in=splat_in, owner_id=current_user.id)
      
    return splat


@router.put("/{id}", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: str,
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
    id: str,
) -> Any:
    """
    Delete an item.
    """
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user.is_superuser and (splat.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    dir_path = os.path.join(settings.MODEL_WORKSPACES_DIR, str(current_user.id), splat.id)
    try:
        shutil.rmtree(dir_path)
        print(f"Directory {dir_path} has been removed.")
    except Exception as e:
        print(f"Error removing directory {dir_path}: {str(e)}")

    thumbnail_filename = f"{splat.id}_thumbnail.jpg"
    thumbnail_path = os.path.join(settings.MODEL_THUMBNAILS_DIR, thumbnail_filename)
    print(thumbnail_path)
    if os.path.exists(thumbnail_path):
        try:
            os.remove(thumbnail_path)
            print(f"File {thumbnail_path} has been removed.")
        except Exception as e:
            print(f"Error removing file {thumbnail_path}: {str(e)}")
    else:
        print(f"File {thumbnail_path} does not exist.")
    splat = crud.splat.remove(db=db, id=id)
    return {"detail": f'Splat deleted successfully {id}'}



@router.get("/{id}/download", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def download_splat(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
) -> Any:
    # Check if the modeling_task has completed
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not splat.is_public:
        raise HTTPException(status_code=400, detail="Not enough permissions")


    if splat.status != 'SUCCESS':
        raise HTTPException(
            status_code=404,
            detail=f"Result not ready or task failed. Current state: {splat.status}")

    output_path = splat.model_url
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