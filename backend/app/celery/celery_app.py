import os
from time import sleep
import subprocess
import shutil
from typing import Any, Dict

from celery import Celery, states  # type: ignore
from celery.utils.log import get_task_logger  # type: ignore
from celery.exceptions import Ignore
from celery.app.task import Task

from app.core.config import settings
import emails  # type: ignore
from emails.template import JinjaTemplate  # type: ignore
from sqlalchemy.orm import Session
from fastapi import Depends
from app.api import deps
from app import crud
from app import schemas
from app.db.session import SessionLocal

celery_app = Celery('tasks')
celery_app.conf.broker_url = os.environ.get(
    "CELERY_BROKER_URL", "redis://localhost:6379")
celery_app.conf.result_backend = os.environ.get(
    "CELERY_RESULT_BACKEND", settings.POSTGRESQL_DATABASE_CELERY_URI)


celery_app.conf.task_ignore_result = True
celery_app.conf.task_store_errors_even_if_ignored = True
celery_app.conf.update(imports=['app.celery.celery_app'])
celery_log = get_task_logger(__name__)


@celery_app.task(ignore_result=True)
def print_test_message(quantity: int) -> bool:
    """Print message with 2 second interval."""
    for i in range(quantity):
        sleep(2)
        celery_log.info(f"Task {i} completed!")
    return True


@celery_app.task(ignore_result=True)
def send_email_async(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    """Send email asynchronously"""
    assert settings.EMAILS_ENABLED, "no provided configuration for email variables"
    message = emails.Message(
        subject=JinjaTemplate(subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    message.send(to=email_to, render=environment, smtp=smtp_options)


@celery_app.task(bind=True, ignore_result=True)
def process_video(self: Task,
                  task_id: str,
                  workspace_path:str,
                  video_path: str,
                  num_iterations: int = 10,
                  ) -> Any:
    db = SessionLocal()
    """Process video to generate 3D Gaussian Splatting model"""
    try:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video path does not exist: {video_path}")
        celery_log.info(f"Starting task {task_id} for video {video_path}")

        # Update task state to started
        self.update_state(state=states.STARTED,
                          meta={"status": "Started processing"})
        
        splat_in = schemas.SplatUpdate(status = "STARTED")
        splat = crud.splat.get(db, id= task_id)
        crud.splat.update(db = db, db_obj=splat, obj_in=splat_in)

        # Create workspace directory
        dataset_path = os.path.join(
            workspace_path, "workspace")
        os.makedirs(dataset_path, exist_ok=True)

        # Create output directory
        output_dir = os.path.join(workspace_path, "result")
        os.makedirs(output_dir, exist_ok=True)

        # Update task state
        self.update_state(state="PROGRESS",
                          meta={"status": "Extracting frames from video"})
        
        splat_in = schemas.SplatUpdate(status = "PROGRESS")
        splat = crud.splat.get(db, id= task_id)
        crud.splat.update(db = db, db_obj=splat, obj_in=splat_in)

        # Run the shell script step by step
        # 1. Create images directory
        img_dir = os.path.join(dataset_path, "images")
        os.makedirs(img_dir, exist_ok=True)

        # 2. Extract frames using ffmpeg
        cmd = [
            "ffmpeg", "-i", video_path, "-vf", "fps=1",
            os.path.join(img_dir, "output_%04d.png")
        ]
        run_command(cmd)

        # 3. Run COLMAP feature extraction
        self.update_state(state="PROGRESS",
                          meta={"status": "Running COLMAP feature extraction"})

        cmd = [
            "colmap", "feature_extractor",
            "--database_path", os.path.join(dataset_path, "database.db"),
            "--image_path", img_dir,
            "--SiftExtraction.use_gpu", "0",
            "--ImageReader.single_camera", "1"
        ]
        run_command(cmd)

        # 4. Run COLMAP sequential matcher
        self.update_state(state="PROGRESS",
                          meta={"status": "Running COLMAP matcher"})

        cmd = [
            "colmap", "sequential_matcher",
            "--database_path", os.path.join(dataset_path, "database.db"),
            "--SiftMatching.use_gpu", "0"
        ]
        run_command(cmd)

        # 5. Create sparse directory
        sparse_dir = os.path.join(dataset_path, "sparse")
        os.makedirs(sparse_dir, exist_ok=True)

        # 6. Run COLMAP mapper
        self.update_state(state="PROGRESS",
                          meta={"status": "Running COLMAP mapper"})

        cmd = [
            "colmap", "mapper",
            "--database_path", os.path.join(dataset_path, "database.db"),
            "--image_path", img_dir,
            "--output_path", sparse_dir,
            "--Mapper.ba_use_gpu", "0",
            "--Mapper.ba_global_function_tolerance", "0.000001"
        ]
        run_command(cmd)

        # 7. Create dense directory
        dense_dir = os.path.join(dataset_path, "dense")
        os.makedirs(dense_dir, exist_ok=True)

        # 8. Run COLMAP image undistorter
        self.update_state(state="PROGRESS",
                          meta={"status": "Running COLMAP image undistorter"})

        cmd = [
            "colmap", "image_undistorter",
            "--image_path", img_dir,
            "--input_path", os.path.join(sparse_dir, "0"),
            "--output_path", dense_dir,
            "--output_type", "COLMAP"
        ]
        run_command(cmd)

        # 9. Create to_opensplat directory
        opensplat_dir = os.path.join(dataset_path, "to_opensplat")
        outputs_dir = os.path.join(dataset_path, "outputs")
        os.makedirs(opensplat_dir, exist_ok=True)
        os.makedirs(outputs_dir, exist_ok=True)

        # 10. Create symbolic links

        # Copy directory (images)
        shutil.copytree(os.path.join(dense_dir, "images"),
                        os.path.join(opensplat_dir, "images"),
                        dirs_exist_ok=True)  # Only in Python 3.8+

        # Copy individual .bin files
        shutil.copy(os.path.join(dense_dir, "sparse", "cameras.bin"),
                    os.path.join(opensplat_dir, "cameras.bin"))

        shutil.copy(os.path.join(dense_dir, "sparse", "images.bin"),
                    os.path.join(opensplat_dir, "images.bin"))

        shutil.copy(os.path.join(dense_dir, "sparse", "points3D.bin"),
                    os.path.join(opensplat_dir, "points3D.bin"))

        # 11. Run opensplat
        self.update_state(state="PROGRESS",
                          meta={"status": "Running OpenSplat"})

        output_model = f"{task_id}_model.ply"
        cmd = [
            "opensplat",
            os.path.join(dataset_path, "to_opensplat"),
            "-n", str(num_iterations),
            "-o", os.path.join(dataset_path, "outputs", output_model)
        ]

        # Change to dataset path for opensplat execution
        current_dir = os.getcwd()
        print(current_dir)
        run_command(cmd)
        os.chdir(current_dir)

        # 12. Copy the result to output directory
        src_path = os.path.join(dataset_path, "outputs", output_model)
        dst_path = os.path.join(output_dir, output_model)

        if os.path.exists(src_path):
            shutil.copy(src_path, dst_path)
            celery_log.info(f"Model saved to {dst_path}")
        else:
            raise Exception(f"Expected output file {src_path} not found")
        
        splat_in = schemas.SplatUpdate(status = "SUCCESS", model_url=dst_path)
        splat = crud.splat.get(db, id= task_id)
        crud.splat.update(db = db, db_obj=splat, obj_in=splat_in)

        # Return the result
        return {
            "status": "Completed",
            "message": "3D model generated successfully",
            "output_path": dst_path,
            "task_id": task_id
        }

    except Exception as e:
        celery_log.error(f"Task {task_id} failed: {str(e)}")
        self.update_state(
            state=states.FAILURE,
            meta={"status": "Failed", "error": str(e)}
        )
        splat_in = schemas.SplatUpdate(status = "FAILURE")
        splat = crud.splat.get(db, id= task_id)
        crud.splat.update(db = db, db_obj=splat, obj_in=splat_in)
        raise Ignore()
    finally:
        # Clean up the workspace after processing
        try:
            dataset_path = os.path.join(workspace_path, "workspace")
            if os.path.exists(dataset_path):
                shutil.rmtree(dataset_path)
                celery_log.info(f"Cleaned up workspace at {dataset_path}")
        except Exception as cleanup_error:
            celery_log.warning(f"Failed to remove workspace: {str(cleanup_error)}")

def run_command(cmd):
    """Run a shell command and handle errors"""
    try:
        celery_log.info(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        celery_log.info("Command completed successfully")
        return result
    except subprocess.CalledProcessError as e:
        celery_log.error(f"Command failed with error: {e.stderr}")
        raise Exception(f"Command failed: {e.stderr}")
