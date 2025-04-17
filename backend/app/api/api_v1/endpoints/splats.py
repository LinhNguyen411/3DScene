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
import subprocess




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

@router.get("/public", response_model=Page[schemas.Splat])
def read_public_splats(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve public items accessible without authentication.
    """
    public_splats = crud.splat.get_multi_by_public(db=db)
    return paginate(public_splats, params)


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
    400: {"model": schemas.Detail, "description": "Invalid file type (must be .ply or .compressed.ply)"},
    413: {"model": schemas.Detail, "description": "File too large (max 5GB)"},
    500: {"model": schemas.Detail, "description": "Internal server error during upload or compression"}
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
    Validates model file type (.ply or .compressed.ply), compresses .ply files,
    and stores the final model size in MB.
    """
    # --- File Type Validation ---
    if not model.filename.endswith((".ply", ".compressed.ply")):
        raise HTTPException(
            status_code=400,
            detail="Invalid model file type. Only .ply and .compressed.ply files are accepted."
        )

    needs_compression = not model.filename.endswith(".compressed.ply")
    # --- End File Type Validation ---

    MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB
    splat_id = str(uuid.uuid4())
    modeling_task_dir = os.path.join(settings.MODEL_WORKSPACES_DIR, str(current_user.id), splat_id)
    os.makedirs(modeling_task_dir, exist_ok=True)
    upload_path = os.path.join(modeling_task_dir, "model")
    os.makedirs(upload_path)

    if needs_compression:
        temp_input_model_path = os.path.join(upload_path, "input.ply")
        final_model_filename = "model.compressed.ply"
        final_model_path = os.path.join(upload_path, final_model_filename)
        save_path = temp_input_model_path
    else:
        # Use a consistent final name or the original if preferred
        # Using original: final_model_filename = model.filename
        # Using consistent:
        final_model_filename = "model.compressed.ply"
        final_model_path = os.path.join(upload_path, final_model_filename)
        save_path = final_model_path
        temp_input_model_path = None

    file_size_bytes_uploaded = 0 # Store the uploaded size (might be different from final size if compressed)
    chunk_size = 1024 * 1024  # 1MB chunks

    try:
        # --- Save Uploaded File ---
        with open(save_path, "wb") as buffer:
            while True:
                chunk = await model.read(chunk_size)
                if not chunk:
                    break
                file_size_bytes_uploaded += len(chunk)
                if file_size_bytes_uploaded > MAX_FILE_SIZE:
                    buffer.close()
                    os.remove(save_path)
                    if os.path.exists(modeling_task_dir):
                         shutil.rmtree(modeling_task_dir)
                    raise HTTPException(
                        status_code=413,
                        detail=f"Model file too large ({file_size_bytes_uploaded / (1024*1024):.2f}MB). Maximum size is 5GB."
                    )
                buffer.write(chunk)
        # --- End Save Uploaded File ---

        # --- Compression Step (if needed) ---
        if needs_compression:
            if not temp_input_model_path: # Should not happen based on logic, but safety check
                 raise HTTPException(status_code=500, detail="Internal error: Temp path not set for compression.")

            compression_command = ['splat-transform', temp_input_model_path, final_model_path]
            try:
                print(f"Running compression: {' '.join(compression_command)}")
                process = subprocess.run(
                    compression_command, check=True, capture_output=True, text=True
                )
                print(f"Compression successful: {process.stdout}")
                os.remove(temp_input_model_path) # Clean up original .ply
            except FileNotFoundError:
                if os.path.exists(final_model_path): os.remove(final_model_path)
                if os.path.exists(temp_input_model_path): os.remove(temp_input_model_path)
                if os.path.exists(modeling_task_dir): shutil.rmtree(modeling_task_dir)
                raise HTTPException(status_code=500, detail="Compression command 'splat-transform' not found.")
            except subprocess.CalledProcessError as e:
                if os.path.exists(final_model_path): os.remove(final_model_path)
                if os.path.exists(temp_input_model_path): os.remove(temp_input_model_path)
                if os.path.exists(modeling_task_dir): shutil.rmtree(modeling_task_dir)
                error_message = f"Compression failed: {e.stderr}"
                print(error_message)
                raise HTTPException(status_code=500, detail=error_message)
            except Exception as e:
                if os.path.exists(final_model_path): os.remove(final_model_path)
                if os.path.exists(temp_input_model_path): os.remove(temp_input_model_path)
                if os.path.exists(modeling_task_dir): shutil.rmtree(modeling_task_dir)
                raise HTTPException(status_code=500, detail=f"Unexpected error during compression: {str(e)}")
        # --- End Compression Step ---

        # --- Calculate Final Size ---
        try:
            final_file_size_bytes = os.path.getsize(final_model_path)
            memory_in_mb = round(final_file_size_bytes / (1024 * 1024), 2) # Calculate MB and round
        except FileNotFoundError:
             # This case means the final file is missing after supposed success, indicates an issue
             if os.path.exists(modeling_task_dir): shutil.rmtree(modeling_task_dir) # Clean up before error
             raise HTTPException(status_code=500, detail="Internal error: Final model file not found after processing.")
        except Exception as e:
             # Catch any other errors during size calculation
             if os.path.exists(final_model_path): os.remove(final_model_path)
             if os.path.exists(modeling_task_dir): shutil.rmtree(modeling_task_dir)
             raise HTTPException(status_code=500, detail=f"Error calculating final file size: {str(e)}")
        # --- End Calculate Final Size ---

    except HTTPException as e:
        # Re-raise known HTTP exceptions
        raise e
    except Exception as e:
        # Catch other file processing errors and cleanup
        if os.path.exists(save_path): os.remove(save_path) # save_path could be temp or final
        if needs_compression and temp_input_model_path and os.path.exists(temp_input_model_path):
             os.remove(temp_input_model_path) # Ensure temp is removed if error occurred before its cleanup
        if os.path.exists(final_model_path): os.remove(final_model_path) # Ensure final is removed on error
        if os.path.exists(modeling_task_dir): shutil.rmtree(modeling_task_dir)
        raise HTTPException(status_code=500, detail=f"Error during file upload/processing: {str(e)}")


    # --- Thumbnail Handling ---
    thumbnail_ext = os.path.splitext(thumbnail.filename)[-1]
    thumbnail_filename = f"{splat_id}_thumbnail{thumbnail_ext}"
    thumbnail_path = os.path.join(settings.MODEL_THUMBNAILS_DIR, thumbnail_filename)
    os.makedirs(settings.MODEL_THUMBNAILS_DIR, exist_ok=True)

    try:
        with open(thumbnail_path, "wb") as f:
            thumbnail_size = 0
            while True:
                chunk = await thumbnail.read(1024 * 1024)
                if not chunk: break
                thumbnail_size += len(chunk)
                # Optional: Add size check for thumbnail here if needed
                # if thumbnail_size > MAX_THUMBNAIL_SIZE: ...
                f.write(chunk)
    except Exception as e:
        # Clean up model file and task directory if thumbnail fails
        if os.path.exists(final_model_path): os.remove(final_model_path)
        if os.path.exists(modeling_task_dir): shutil.rmtree(modeling_task_dir)
        if os.path.exists(thumbnail_path): os.remove(thumbnail_path) # Clean up partial thumbnail
        raise HTTPException(status_code=500, detail=f"Error saving thumbnail: {str(e)}")

    thumbnail_url = f"/thumbnails/{thumbnail_filename}"
    # --- End Thumbnail Handling ---


    # --- Create Database Entry ---
    # Include the calculated memory size
    splat_in = schemas.SplatCreate(
        id=splat_id,
        title=title,
        image_url=thumbnail_url,
        model_url=final_model_path, # Use the final path
        is_public=is_public,
        status='SUCCESS',
        model_size=memory_in_mb # <--- Add the calculated size here
    )

    try:
        splat: models.Splat = crud.splat.create_with_owner(
            db, obj_in=splat_in, owner_id=current_user.id)
    except Exception as e:
        # Clean up files if database operation fails
        if os.path.exists(final_model_path): os.remove(final_model_path)
        if os.path.exists(thumbnail_path): os.remove(thumbnail_path)
        if os.path.exists(modeling_task_dir): shutil.rmtree(modeling_task_dir)
        raise HTTPException(status_code=500, detail=f"Error creating database record: {str(e)}")
    # --- End Create Database Entry ---

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



@router.get("/{id}/download-compressed-ply", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def download_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_guess_user),
    id: str,
) -> Any:
    # Check if the modeling_task has completed
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user:
        if not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")
    else:
        if not current_user.is_superuser and current_user.id != splat.owner_id and not splat.is_public:
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

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.utils.convert_compressed_ply_to_splat import convert_ply_file_to_splat_buffer
import io
import os

@router.get("/{id}/download-splat", responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"}
})
def download_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_guess_user),
    id: str,
) -> Any:
    # Check if the modeling_task has completed
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user:
        if not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")
    else:
        if not current_user.is_superuser and current_user.id != splat.owner_id and not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")

    if splat.status != 'SUCCESS':
        raise HTTPException(
            status_code=404,
            detail=f"Result not ready or task failed. Current state: {splat.status}"
        )

    # Get the file path from splat.model_url
    output_path = splat.model_url
    if not output_path:
        raise HTTPException(status_code=400, detail="Output path is None")
    if not os.path.exists(output_path):
        raise HTTPException(
            status_code=400,
            detail=f"Output file not found at: {output_path}"
        )

    buffer_data = convert_ply_file_to_splat_buffer(output_path, 4)

    # Create a BytesIO object from the buffer
    buffer = io.BytesIO(buffer_data)

    # Return the buffer as a downloadable response
    return StreamingResponse(
        content=buffer,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={os.path.basename(output_path)}"}
    )