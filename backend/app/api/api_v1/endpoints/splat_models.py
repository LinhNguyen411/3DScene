from typing import Any

from fastapi import APIRouter, Body, Depends, FastAPI, File, UploadFile, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session  # type: ignore
from fastapi_pagination import Params, Page
from fastapi_pagination.ext.sqlalchemy import paginate

from app import crud
from app import models
from app import schemas
from app.api import deps
from app.core.config import settings

from app.core.celery_app import celery_app
from celery.result import AsyncResult

import uuid
import os
import shutil

router = APIRouter()


@router.post("/process/", response_model=schemas.SplatModelResponse)
async def process_video(
    file: UploadFile = File(...),
    num_iterations: int = Query(
        1000, description="Number of iterations for the opensplat command")
):
    # Generate a unique splat_model ID
    splat_model_id = str(uuid.uuid4())

    # Create a directory for this splat_model
    splat_model_dir = os.path.join(settings.UPLOAD_VIDEO_DIR, splat_model_id)
    os.makedirs(splat_model_dir, exist_ok=True)

    # Save the uploaded video
    video_path = os.path.join(splat_model_dir, file.filename)
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Submit the splat_model to Celery
    splat_model = celery_app.process_video.delay(
        splat_model_id, video_path, num_iterations)

    return {
        "splat_model_id": splat_model.id,
        "status": "Processing",
        "message": "Video processing started. Use the /status/{splat_model_id} endpoint to check progress."
    }


@router.get("/status/{splat_model_id}", response_model=schemas.SplatModelStatus)
def get_splat_model_status(splat_model_id: str):
    splat_model_result = AsyncResult(splat_model_id, app=celery_app.celery)

    if splat_model_result.state == 'PENDING':
        response = {
            "splat_model_id": splat_model_id,
            "status": "Pending",
        }
    elif splat_model_result.state == 'FAILURE':
        response = {
            "splat_model_id": splat_model_id,
            "status": "Failed",
            "result": {"error": str(splat_model_result.info)}
        }
    elif splat_model_result.state == 'SUCCESS':
        response = {
            "splat_model_id": splat_model_id,
            "status": "Completed",
            "result": splat_model_result.get()
        }
    else:
        # For states like 'STARTED', 'RETRY', 'PROGRESS', etc.
        response = {
            "splat_model_id": splat_model_id,
            "status": splat_model_result.state,
            "result": splat_model_result.info if hasattr(splat_model_result, 'info') else None
        }

    return response


@router.get("/download/{splat_model_id}")
def download_result(splat_model_id: str):
    # Check if the splat_model has completed
    splat_model_result = AsyncResult(splat_model_id, app=celery_app.celery)

    if splat_model_result.state != 'SUCCESS':
        raise HTTPException(
            status_code=404, detail="Result not ready or splat_model failed")

    # Get result info
    result = splat_model_result.get()
    output_path = result.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=400, detail="Output file not found")

    # In a real app, you would return a file download here
    # For simplicity, we'll just return the file path
    return {"file_path": output_path}


@router.delete("/delete/{splat_model_id}")
def delete_splat_model_data(splat_model_id: str):
    """Delete all data associated with a splat_model"""
    splat_model_dir = os.path.join(settings.UPLOAD_VIDEO_DIR, splat_model_id)
    result_dir = os.path.join(settings.RESULT_DIR, splat_model_id)

    deleted = False

    # Delete upload directory if it exists
    if os.path.exists(splat_model_dir):
        shutil.rmtree(splat_model_dir)
        deleted = True

    # Delete result directory if it exists
    if os.path.exists(result_dir):
        shutil.rmtree(result_dir)
        deleted = True

    if not deleted:
        raise HTTPException(
            status_code=404, detail="SplatModel data not found")

    # Also try to revoke the splat_model if it's still running
    celery_app.celery.control.revoke(splat_model_id, terminate=True)

    return {"message": f"Data for splat_model {splat_model_id} deleted successfully"}
