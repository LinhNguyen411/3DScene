import os
from time import sleep
import subprocess
import shutil
from typing import Any, Dict

from celery import Celery, states  # type: ignore
from celery.utils.log import get_task_logger  # type: ignore
from celery.exceptions import Ignore
from celery.app.task import Task

from app.core.config import settings, Config
import emails  # type: ignore
from emails.template import JinjaTemplate  # type: ignore
from app import crud
from app import schemas
from app.db.session import SessionLocal

from app.utils.export_to_json import process_colmap_model

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

@celery_app.task(ignore_result=True, queue='emails')
def send_email_async(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    config = Config()
    """Send email asynchronously"""
    assert config.EMAILS_ENABLED, "no provided configuration for email variables"
    message = emails.Message(
        subject=JinjaTemplate(subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(config.EMAILS_FROM_NAME, config.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": config.SMTP_HOST, "port": config.SMTP_PORT}
    if config.SMTP_TLS:
        smtp_options["tls"] = True
    if config.SMTP_USER:
        smtp_options["user"] = config.SMTP_USER
    if config.SMTP_PASSWORD:
        smtp_options["password"] = config.SMTP_PASSWORD
    message.send(to=email_to, render=environment, smtp=smtp_options)

@celery_app.task(bind=True, ignore_result=True, queue='heavy_tasks')
def process_video(self: Task,
                  task_id: str,
                  workspace_path:str,
                  dataset_dir: str,
                  num_iterations: int = 1000,
                  ) -> Any:
    db = SessionLocal()
    """Process video to generate 3D Gaussian Splatting model"""
    try:
        if not os.path.exists(dataset_dir):
            raise FileNotFoundError(f"Dataset directory does not exist: {dataset_dir}")
        celery_log.info(f"Starting task {task_id} for dataset {dataset_dir}")

        # Update task state to started
        self.update_state(state=states.STARTED,
                          meta={"status": "Started processing"})
        
        splat_in = schemas.SplatUpdate(status = "STARTED")
        splat = crud.splat.get(db, id= task_id)
        crud.splat.update(db = db, db_obj=splat, obj_in=splat_in)

        # Create workspace directory
        dataset_path = os.path.join(workspace_path, "workspace")
        os.makedirs(dataset_path, exist_ok=True)

        # Create output directory
        is_video_dir = "videos" in dataset_dir
        img_dir = os.path.join(dataset_path, "images")
        os.makedirs(img_dir, exist_ok=True)
        
         # If processing videos, extract frames with ffmpeg
        if is_video_dir:
            self.update_state(state="PROGRESS",
                            meta={"status": "Extracting frames from videos"})
            
            video_files = [f for f in os.listdir(dataset_dir) if os.path.isfile(os.path.join(dataset_dir, f)) and 
                           f.lower().endswith((".mp4", ".avi", ".mov", ".mkv"))]
            
            for i, video_file in enumerate(video_files):
                video_path = os.path.join(dataset_dir, video_file)
                output_pattern = os.path.join(img_dir, f"video{i+1}_%04d.png")
                
                # Extract frames at 2fps
                cmd = [
                    "ffmpeg", "-i", video_path, 
                    "-vf", "fps=2", 
                    "-q:v", "1",  # High quality
                    output_pattern
                ]
                run_command(cmd)
        else:
            # If dataset_dir is already the images directory, use it directly
            img_dir = dataset_dir

        # 4. Run COLMAP automatic reconstructor
        self.update_state(state="PROGRESS",
                          meta={"status": "Running COLMAP automatic reconstructor"})
        
        splat_in = schemas.SplatUpdate(status = "PROGRESS")
        splat = crud.splat.get(db, id= task_id)
        crud.splat.update(db = db, db_obj=splat, obj_in=splat_in)

        cmd = [
            "colmap", "automatic_reconstructor",
            "--workspace_path", dataset_path,
            "--image_path", img_dir,
            "--use_gpu", "0",
            "--dense", "0" 
        ]
        run_command(cmd)
        sparse_dir = os.path.join(dataset_path, "sparse")


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

        #Save colmap metadata to JSON
        process_colmap_model(opensplat_dir, ".bin", workspace_path)
        
        colmap_folder = os.path.join(workspace_path, "colmap")
        os.makedirs(colmap_folder, exist_ok=True)

        # Copy COLMAP binary files to the colmap folder
        shutil.copy(os.path.join(opensplat_dir, "cameras.bin"),
                    os.path.join(colmap_folder, "cameras.bin"))
        shutil.copy(os.path.join(opensplat_dir, "images.bin"),
                    os.path.join(colmap_folder, "images.bin"))
        shutil.copy(os.path.join(opensplat_dir, "points3D.bin"),
                    os.path.join(colmap_folder, "points3D.bin"))

        # Copy images directory to the colmap folder
        shutil.copytree(os.path.join(opensplat_dir, "images"),
                        os.path.join(colmap_folder, "images"),
                        dirs_exist_ok=True)

        # Keep the existing copy to MODEL_IMAGES_DIR
        shutil.copytree(os.path.join(opensplat_dir, "images"),
                        os.path.join(settings.MODEL_IMAGES_DIR, task_id),
                        dirs_exist_ok=True)
        

        # 11. Run opensplat
        # self.update_state(state="PROGRESS",
        #                   meta={"status": "Running OpenSplat"})

        output_model = f"{task_id}_model.splat"
        # cmd = [
        #     "opensplat",
        #     os.path.join(dataset_path, "to_opensplat"),
        #     "-n", str(num_iterations),
        #     "-o", os.path.join(dataset_path, "outputs", output_model)
        # ]

        # Change to dataset path for opensplat execution
        current_dir = os.getcwd()
        # run_command(cmd)
        # os.chdir(current_dir)

        # 12. Copy the result to output directory

        src_path = os.path.join(dataset_path, "outputs", output_model)
        dst_path = os.path.join(workspace_path, output_model)

        # if os.path.exists(src_path):
        #     shutil.copy(src_path, dst_path)
        #     celery_log.info(f"Model saved to {dst_path}")
        # else:
        #     raise Exception(f"Expected output file {src_path} not found")
        
        # Check if compression was successful
        # if os.path.exists(dst_path):
        #     celery_log.info(f"Compressed model saved to {dst_path}")
            
        #     # Calculate the size of the compressed model in MB
        #     size = round(os.path.getsize(dst_path) / (1024 * 1024), 2)
            
        #     # Update the model_url to point to the compressed file and include model_size

        # else:
        #     raise Exception(f"Compression failed: {dst_path} not found")
        splat_in = schemas.SplatUpdate(status="SUCCESS", model_url=dst_path)
        splat = crud.splat.get(db, id=task_id)
        crud.splat.update(db=db, db_obj=splat, obj_in=splat_in)

        # Return the result
        return {
            "status": "Completed",
            "message": "3D model generated and compressed successfully",
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
        
        images_path = os.path.join(settings.MODEL_IMAGES_DIR, splat.id)    
        try:
            shutil.rmtree(images_path)
            print(f"Directory {images_path} has been removed.")
        except Exception as e:
            print(f"Error removing directory {images_path}: {str(e)}")
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
        os.environ["QT_QPA_PLATFORM"] = "offscreen"
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
