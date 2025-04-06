 
from fastapi import APIRouter, File, UploadFile,  HTTPException, Query


from app.core.config import settings
from app.api import deps
from app.celery import celery_app
from celery.result import AsyncResult

import os
import shutil
import cv2
import uuid


router = APIRouter()



async def process_video(
    file: UploadFile = File(...),
    num_iterations: int = Query(
        1000, description="Number of iterations for the opensplat command")
):
    # Create a directory for this modeling_task
    modeling_task_id = str(uuid.uuid4())

    modeling_task_dir = os.path.join(settings.UPLOAD_VIDEO_DIR, modeling_task_id)
    os.makedirs(modeling_task_dir, exist_ok=True)

    # Save the uploaded video
    video_path = os.path.join(modeling_task_dir, file.filename)
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract first frame as thumbnail
    cap = cv2.VideoCapture(video_path)
    success, frame = cap.read()
    cap.release()

    thumbnail_url = None
    if success:
        os.makedirs(settings.SPLAT_THUMBNAILS_DIR, exist_ok=True)
        thumbnail_filename = f"{modeling_task_id}_thumbnail.jpg"
        thumbnail_path = os.path.join(settings.SPLAT_THUMBNAILS_DIR, thumbnail_filename)
        cv2.imwrite(thumbnail_path, frame)
        
        # Build the public URL or relative path to return
        thumbnail_url = f"/thumbnails/{thumbnail_filename}"  # or adjust based on your static route

    # Submit the modeling_task to Celery
    modeling_task = celery_app.process_video.delay(
        modeling_task_id, video_path, num_iterations)

    return {
        "modeling_task_id": modeling_task.id,
        "image_url": thumbnail_url
    }

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



def delete_modeling_task_data(modeling_task_id: str):
    """Delete all data associated with a modeling_task"""
    modeling_task_dir = os.path.join(
        settings.UPLOAD_VIDEO_DIR, modeling_task_id)
    result_dir = os.path.join(settings.RESULT_DIR, modeling_task_id)

    # Delete upload directory if it exists
    if os.path.exists(modeling_task_dir):
        shutil.rmtree(modeling_task_dir)
    # Delete result directory if it exists
    if os.path.exists(result_dir):
        shutil.rmtree(result_dir)

    # Also try to revoke the modeling_task if it's still running
    celery_app.celery_app.control.revoke(modeling_task_id, terminate=True)

    return {"message": f"Data for modeling_task {modeling_task_id} deleted successfully"}
