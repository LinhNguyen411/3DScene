from typing import Any

from fastapi import APIRouter, Body, Depends, FastAPI, File, UploadFile, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session  # type: ignore
from fastapi_pagination import Params, Page
from fastapi_pagination.ext.sqlalchemy import paginate

from app import crud
from app import models
from app import schemas
from app.api import deps
from app.core.config import settings

from app.core import celery_app
from celery.result import AsyncResult

import uuid
import os
import shutil

router = APIRouter()


@router.post("/process/", response_model=schemas.ModelingTaskResponse)
async def process_video(
    file: UploadFile = File(...),
    num_iterations: int = Query(
        1000, description="Number of iterations for the opensplat command")
):
    # Generate a unique modeling_task ID
    modeling_task_id = str(uuid.uuid4())

    # Create a directory for this modeling_task
    modeling_task_dir = os.path.join(
        settings.UPLOAD_VIDEO_DIR, modeling_task_id)
    os.makedirs(modeling_task_dir, exist_ok=True)

    # Save the uploaded video
    video_path = os.path.join(modeling_task_dir, file.filename)
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Submit the modeling_task to Celery
    modeling_task = celery_app.process_video.delay(
        modeling_task_id, video_path, num_iterations)

    return {
        "modeling_task_id": modeling_task.id,
        "status": "Processing",
        "message": "Video processing started. Use the /status/{modeling_task_id} endpoint to check progress."
    }


@router.get("/status/{modeling_task_id}", response_model=schemas.ModelingTaskStatus)
def get_modeling_task_status(modeling_task_id: str):
    modeling_task_result = AsyncResult(
        modeling_task_id, app=celery_app.celery_app)

    if modeling_task_result.state == 'PENDING':
        response = {
            "modeling_task_id": modeling_task_id,
            "status": "Pending",
        }
    elif modeling_task_result.state == 'FAILURE':
        response = {
            "modeling_task_id": modeling_task_id,
            "status": "Failed",
            "result": {"error": str(modeling_task_result.info)}
        }
    elif modeling_task_result.state == 'SUCCESS':
        response = {
            "modeling_task_id": modeling_task_id,
            "status": "Completed",
            "result": modeling_task_result.get()
        }
    else:
        # For states like 'STARTED', 'RETRY', 'PROGRESS', etc.
        response = {
            "modeling_task_id": modeling_task_id,
            "status": modeling_task_result.state,
            "result": modeling_task_result.info if hasattr(modeling_task_result, 'info') else None
        }

    return response


@router.get("/download/{modeling_task_id}")
def download_result(modeling_task_id: str):
    # Check if the modeling_task has completed
    modeling_task_result = AsyncResult(
        modeling_task_id, app=celery_app.celery_app)

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


@router.delete("/delete/{modeling_task_id}")
def delete_modeling_task_data(modeling_task_id: str):
    """Delete all data associated with a modeling_task"""
    modeling_task_dir = os.path.join(
        settings.UPLOAD_VIDEO_DIR, modeling_task_id)
    result_dir = os.path.join(settings.RESULT_DIR, modeling_task_id)

    deleted = False

    # Delete upload directory if it exists
    if os.path.exists(modeling_task_dir):
        shutil.rmtree(modeling_task_dir)
        deleted = True

    # Delete result directory if it exists
    if os.path.exists(result_dir):
        shutil.rmtree(result_dir)
        deleted = True

    if not deleted:
        raise HTTPException(
            status_code=404, detail="ModelingTask data not found")

    # Also try to revoke the modeling_task if it's still running
    celery_app.celery_app.control.revoke(modeling_task_id, terminate=True)

    return {"message": f"Data for modeling_task {modeling_task_id} deleted successfully"}
