from typing import Any, List, Optional
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud
from app.celery import celery_app

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException,
                     File, UploadFile, Form, BackgroundTasks)
from fastapi.responses import FileResponse, JSONResponse
import os
import uuid
from app.core.config import settings
import shutil
import subprocess
import mimetypes

from fastapi.responses import StreamingResponse
import asyncio

import zipfile
from io import BytesIO

MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB in bytes

def delete_file(path: str):
    try:
        os.remove(path)
    except Exception:
        pass  # You might want to log this

router = APIRouter()


@router.get("", response_model=Page[schemas.Splat], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_splats(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Lấy danh sách splat (mô hình 3D) từ hệ thống.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **params**: Các tham số phân trang (page size, page number).
    - **current_user**: Người dùng hiện tại (dựa trên JWT token, xác thực qua `deps.get_current_active_user`).

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách các splat dưới dạng phân trang (page).
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.

    **Giải thích:**
    - Endpoint này cho phép người dùng lấy danh sách các mô hình splat (3D objects). Người dùng có thể lấy tất cả các splats nếu là superuser, hoặc chỉ lấy các splat thuộc sở hữu của họ nếu là người dùng bình thường.
    - Danh sách các splats sẽ được phân trang, giúp dễ dàng quản lý dữ liệu lớn.

    **Chi tiết về các hành động:**
    - Kiểm tra quyền hạn của người dùng, nếu là superuser, sẽ lấy tất cả các splat. Nếu là người dùng bình thường, sẽ chỉ lấy các splat của họ.
    - Dữ liệu sẽ được phân trang và trả về cho người dùng dưới dạng `Page[schemas.Splat]`.
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
    Lấy danh sách các splat công khai có thể truy cập mà không cần xác thực.

    **Yêu cầu Header:**
    - Không yêu cầu header đặc biệt, có thể truy cập mà không cần xác thực người dùng.

    **Đầu vào (Request Parameters):**
    - **params**: Các tham số phân trang (page size, page number).

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách các splat công khai dưới dạng phân trang (page).

    **Giải thích:**
    - Endpoint này cho phép người dùng truy cập vào các mô hình splat (3D objects) công khai mà không cần phải đăng nhập hoặc cung cấp thông tin xác thực.
    - Danh sách các splat công khai sẽ được phân trang để dễ dàng quản lý và truy xuất dữ liệu lớn.

    **Chi tiết về các hành động:**
    - Lấy tất cả các splat có thuộc tính `is_public=True`.
    - Dữ liệu sẽ được phân trang và trả về cho người dùng dưới dạng `Page[schemas.Splat]`.
    """
    public_splats = crud.splat.get_multi_by_public(db=db)
    return paginate(public_splats, params)

@router.get("/gallery", response_model=Page[schemas.Splat])
def read_gallery_splats(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Lấy danh sách các splat trong gallery có thể truy cập mà không cần xác thực.

    **Yêu cầu Header:**
    - Không yêu cầu header đặc biệt, có thể truy cập mà không cần xác thực người dùng.

    **Đầu vào (Request Parameters):**
    - **params**: Các tham số phân trang (page size, page number).

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách các splat trong gallery dưới dạng phân trang (page).

    **Giải thích:**
    - Endpoint này cho phép người dùng truy cập vào các mô hình splat (3D objects) được lưu trong gallery mà không cần phải đăng nhập hoặc cung cấp thông tin xác thực.
    - Danh sách các splat trong gallery sẽ được phân trang để dễ dàng quản lý và truy xuất dữ liệu lớn.

    **Chi tiết về các hành động:**
    - Lấy tất cả các splat có thuộc tính `is_gallery=True`.
    - Dữ liệu sẽ được phân trang và trả về cho người dùng dưới dạng `Page[schemas.Splat]`.
    """
    gallery_splats = crud.splat.get_multi_by_gallery(db=db)
    return paginate(gallery_splats, params)

@router.post("", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"}
})
async def create_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    title: str = Form(...),
    files: List[UploadFile] = File(...),
    num_iterations: int = Form(10, description="Number of iterations for the opensplat command")
) -> Any:
    """
    Tạo một splat mới từ các tệp tải lên (có thể là video hoặc hình ảnh, không thể tải lên cả hai).
    Nếu video được tải lên, hệ thống sẽ trích xuất các khung hình với tốc độ 2fps.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **title**: Tiêu đề cho splat mới (dưới dạng form data).
    - **files**: Danh sách các tệp video hoặc hình ảnh tải lên (dưới dạng form data).
    - **num_iterations**: Số vòng lặp cho lệnh opensplat (dưới dạng form data, mặc định là 10).

    **Đầu ra (Response):**
    - 200 OK: Trả về đối tượng splat mới sau khi tạo thành công.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 400 Bad Request: Nếu các tệp tải lên có kiểu không hợp lệ hoặc cả video và hình ảnh đều được tải lên cùng lúc.

    **Giải thích:**
    - Endpoint này cho phép người dùng tạo một splat mới bằng cách tải lên các tệp video hoặc hình ảnh.
    - Nếu video được tải lên, hệ thống sẽ trích xuất các khung hình với tốc độ 2fps và lưu chúng vào thư mục làm việc.
    - Nếu hình ảnh được tải lên, hệ thống sẽ di chuyển các tệp hình ảnh vào thư mục làm việc.
    - Sau khi các tệp được xử lý, một thumbnail sẽ được tạo từ hình ảnh đầu tiên (nếu có) và được lưu vào thư mục thumbnail.
    - Một tác vụ xử lý video (hoặc hình ảnh) sẽ được đưa vào hàng đợi Celery để xử lý tiếp.

    **Chi tiết về các hành động:**
    - Kiểm tra loại tệp tải lên (video hoặc hình ảnh) và đảm bảo chỉ tải lên một loại tệp.
    - Nếu video được tải lên, trích xuất khung hình với tốc độ 2fps và lưu vào thư mục làm việc.
    - Nếu hình ảnh được tải lên, di chuyển chúng vào thư mục làm việc.
    - Tạo thumbnail từ hình ảnh đầu tiên (nếu có) và lưu vào thư mục thumbnail.
    - Tạo một đối tượng splat mới và lưu vào cơ sở dữ liệu.
    - Gửi tác vụ xử lý video hoặc hình ảnh vào hàng đợi Celery.
    """
    print(files)
    splat_id = str(uuid.uuid4())
    task_dir = os.path.join(settings.MODEL_WORKSPACES_DIR, str(current_user.id), splat_id)
    os.makedirs(task_dir, exist_ok=True)

    video_dir = os.path.join(task_dir, "workspace", "videos")
    image_dir = os.path.join(task_dir, "workspace", "images")
    os.makedirs(video_dir, exist_ok=True)
    os.makedirs(image_dir, exist_ok=True)

    has_video = False
    has_image = False

    for file in files:
        mime_type, _ = mimetypes.guess_type(file.filename)
        is_video = mime_type and mime_type.startswith("video")
        is_image = mime_type and mime_type.startswith("image")

        if is_video:
            has_video = True
        elif is_image:
            has_image = True
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.filename}")

    if has_video and has_image:
        raise HTTPException(status_code=400, detail="Cannot upload both images and videos together.")

    dataset_dir = None

    for file in files:
        mime_type, _ = mimetypes.guess_type(file.filename)
        target_dir = video_dir if mime_type.startswith("video") else image_dir
        target_path = os.path.join(target_dir, file.filename)

        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Determine dataset_dir and generate thumbnail
    thumbnail_url = None
    thumbnail_filename = f"{splat_id}_thumbnail.jpg"
    os.makedirs(settings.MODEL_THUMBNAILS_DIR, exist_ok=True)
    thumbnail_path = os.path.join(settings.MODEL_THUMBNAILS_DIR, thumbnail_filename)

    if has_video:
        dataset_dir = video_dir
        # Use the first video
        video_files = sorted([f for f in os.listdir(video_dir) if f.lower().endswith((".mp4", ".avi", ".mov"))])
        if video_files:
            first_video_path = os.path.join(video_dir, video_files[0])
            
            # Use subprocess to call ffmpeg to extract the first frame
            try:
                ffmpeg_cmd = [
                    'ffmpeg',
                    '-i', first_video_path,    # Input file
                    '-vframes', '1',           # Extract only 1 frame
                    '-an',                     # Disable audio
                    '-ss', '0',                # Start from the beginning
                    '-y',                      # Overwrite output file if it exists
                    thumbnail_path             # Output file
                ]
                
                # Run the FFmpeg command
                result = subprocess.run(
                    ffmpeg_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True
                )
                
                # If successful, set the thumbnail URL
                if os.path.exists(thumbnail_path):
                    thumbnail_url = f"/thumbnails/{thumbnail_filename}"
            except subprocess.CalledProcessError as e:
                print(f"Error generating thumbnail with FFmpeg: {e}")
                print(f"FFmpeg stderr: {e.stderr.decode() if e.stderr else 'None'}")
            except Exception as e:
                print(f"Unexpected error generating thumbnail: {e}")
    elif has_image:
        dataset_dir = image_dir
        # Use the first image
        image_files = sorted([f for f in os.listdir(image_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))])
        if image_files:
            first_image_path = os.path.join(image_dir, image_files[0])
            shutil.copy(first_image_path, thumbnail_path)
            thumbnail_url = f"/thumbnails/{thumbnail_filename}"

    if not dataset_dir:
        raise HTTPException(status_code=400, detail="No valid files uploaded.")

    # Save to DB
    splat_in = schemas.SplatCreate(
        id=splat_id,
        title=title,
        image_url=thumbnail_url
    )

    splat: models.Splat = crud.splat.create_with_owner(
        db, obj_in=splat_in, owner_id=current_user.id)

    # Start Celery Task
    celery_app.process_video.delay(
        task_id=splat.id,
        workspace_path=task_dir,
        dataset_dir=dataset_dir,
        num_iterations=num_iterations
    )

    return splat



@router.post("/model-upload", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    400: {"model": schemas.Detail, "description": "Invalid file type (must be .ply or .splat)"},
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
    Tải lên một mô hình và thumbnail của mô hình, và tạo một mục Splat trong cơ sở dữ liệu.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header Authorization.

    **Đầu vào (Request Parameters):**
    - **title**: Tiêu đề của mô hình (dưới dạng Form data).
    - **is_public**: Xác định xem mô hình có công khai hay không (dưới dạng Form data).
    - **model**: File mô hình (định dạng .ply hoặc .splat).
    - **thumbnail**: File thumbnail cho mô hình.

    **Đầu ra (Response):**
    - 200 OK: Trả về đối tượng Splat vừa được tạo trong cơ sở dữ liệu.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 400 Bad Request: Nếu file không phải định dạng .ply hoặc .splat.
    - 413 Payload Too Large: Nếu kích thước file vượt quá giới hạn 5GB.
    - 500 Internal Server Error: Nếu có lỗi trong quá trình tải lên hoặc chuyển đổi file.

    **Giải thích:**
    - Endpoint này cho phép người dùng tải lên một mô hình 3D và thumbnail của mô hình.
    - Mô hình có thể là file .ply hoặc .splat. Nếu là .ply, file sẽ được chuyển đổi thành .splat sử dụng công cụ Go (gsbox).
    - Thumbnail sẽ được lưu trữ trong thư mục riêng biệt.
    - Sau khi tải lên và chuyển đổi (nếu cần), thông tin mô hình sẽ được lưu trữ trong cơ sở dữ liệu, bao gồm đường dẫn tới mô hình và thumbnail.
    - Kích thước của mô hình sẽ được tính toán và lưu trữ trong cơ sở dữ liệu.
    """
    # Instead of checking model.size, we need to check the file size after it's saved
    if not (model.filename.endswith(".ply") or model.filename.endswith(".splat")):
        raise HTTPException(status_code=400, detail="Invalid file type (must be .ply or .splat)")

    splat_id = str(uuid.uuid4())  # Unique ID for this model
    modeling_task_dir = os.path.join(settings.MODEL_WORKSPACES_DIR, str(current_user.id), splat_id)
    os.makedirs(modeling_task_dir, exist_ok=True)

    # Path where the model and thumbnail will be stored
    model_path = os.path.join(modeling_task_dir, model.filename)
    thumbnail_filename = f"{splat_id}_thumbnail.jpg"
    thumbnail_path = os.path.join(settings.MODEL_THUMBNAILS_DIR, thumbnail_filename)

    # Save the thumbnail file
    with open(thumbnail_path, "wb") as f:
        shutil.copyfileobj(thumbnail.file, f)

    # --- For .ply File: Save and Convert to .splat ---
    if model.filename.endswith(".ply"):
        # Save the .ply file temporarily
        with open(model_path, "wb") as f:
            shutil.copyfileobj(model.file, f)
        
        # Check file size after saving
        file_size = os.path.getsize(model_path)
        if file_size > MAX_FILE_SIZE:
            os.remove(model_path)  # Clean up the file
            raise HTTPException(status_code=413, detail="File too large (max 5GB)")

        # Convert the .ply to .splat using Go tool
        splat_path = os.path.join(modeling_task_dir, f"{splat_id}.splat")
        try:
            subprocess.run(
                ['gsbox', 'p2s', '-i', model_path, '-o', splat_path],
                check=True
            )
        except subprocess.CalledProcessError:
            os.remove(model_path)  # Cleanup in case of failure
            raise HTTPException(status_code=500, detail="Conversion to .splat failed")

        # Cleanup the temporary .ply file
        os.remove(model_path)

    # --- For .splat File: Directly Save ---
    elif model.filename.endswith(".splat"):
        # Save the .splat file directly
        with open(model_path, "wb") as f:
            shutil.copyfileobj(model.file, f)
        
        # Check file size after saving
        file_size = os.path.getsize(model_path)
        if file_size > MAX_FILE_SIZE:
            os.remove(model_path)  # Clean up the file
            raise HTTPException(status_code=413, detail="File too large (max 5GB)")
            
        splat_path = model_path

    # --- Create Database Entry ---
    # Calculate model file size (in MB)
    model_size = round(os.path.getsize(splat_path) / (1024 * 1024), 2)
    thumbnail_url = f"/thumbnails/{thumbnail_filename}"
    # Create the Splat entry in the database
    splat_in = schemas.SplatCreate(
        id=splat_id,
        title=title,
        image_url=thumbnail_url,
        model_url=splat_path,
        is_public=is_public,
        status='SUCCESS',
        model_size=model_size  # Include the calculated size here
    )

    splat: models.Splat = crud.splat.create_with_owner(
        db, obj_in=splat_in, owner_id=current_user.id
    )

    # Return the Splat object (now stored in DB)
    return splat


@router.put("/{id}", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: str,
    title: str = Form(...),
    is_public: bool = Form(...),
    thumbnail: Optional[UploadFile] = File(None),
) -> Any:
    """
    Cập nhật thông tin của một splat.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **id**: ID của splat cần cập nhật (dưới dạng URL parameter).
    - **splat_in**: Dữ liệu cập nhật cho splat (dưới dạng JSON body).

    **Đầu ra (Response):**
    - 200 OK: Trả về đối tượng splat đã được cập nhật.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 400 Bad Request: Nếu người dùng không có quyền chỉnh sửa splat hoặc splat không tồn tại.

    **Giải thích:**
    - Endpoint này cho phép người dùng cập nhật thông tin của một splat.
    - Nếu người dùng là superuser hoặc là chủ sở hữu của splat, việc cập nhật sẽ được thực hiện.
    - Cập nhật sẽ chỉ thay đổi các trường trong `splat_in`.
    """
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user.is_superuser and (splat.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    if thumbnail is not None:
        print("update thumbnail")
        thumbnail_filename = f"{splat.id}_thumbnail.jpg"
        thumbnail_path = os.path.join(settings.MODEL_THUMBNAILS_DIR, thumbnail_filename)
        with open(thumbnail_path, "wb") as f:
            shutil.copyfileobj(thumbnail.file, f)
            print(f"File {thumbnail_path} has been updated.")


    splat_in = schemas.SplatUpdate(
        title=title,
        is_public=is_public,
    )
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
    Cập nhật thông tin của một splat.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **id**: ID của splat cần cập nhật (dưới dạng URL parameter).
    - **splat_in**: Dữ liệu cập nhật cho splat (dưới dạng JSON body).

    **Đầu ra (Response):**
    - 200 OK: Trả về đối tượng splat đã được cập nhật.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 400 Bad Request: Nếu người dùng không có quyền chỉnh sửa splat hoặc splat không tồn tại.

    **Giải thích:**
    - Endpoint này cho phép người dùng cập nhật thông tin của một splat.
    - Nếu người dùng là superuser hoặc là chủ sở hữu của splat, việc cập nhật sẽ được thực hiện.
    - Cập nhật sẽ chỉ thay đổi các trường trong `splat_in`.
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

    images_path = os.path.join(settings.MODEL_IMAGES_DIR, splat.id)
    try:
        shutil.rmtree(images_path)
        print(f"Directory {images_path} has been removed.")
    except Exception as e:
        print(f"Error removing directory {images_path}: {str(e)}")

    thumbnail_filename = f"{splat.id}_thumbnail.jpg"
    thumbnail_path = os.path.join(settings.MODEL_THUMBNAILS_DIR, thumbnail_filename)
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

@router.get("/{id}", response_model=schemas.Splat, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_guess_user),
    id: str,
) -> Any:
    """
    Lấy thông tin chi tiết của một splat theo ID.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **id**: ID của splat cần lấy thông tin.
    - **current_user**: Người dùng hiện tại (dựa trên JWT token, xác thực qua `deps.get_current_active_user`).

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin chi tiết của splat nếu người dùng có quyền truy cập.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 404 Not Found: Nếu không tìm thấy splat với ID đã cho.
    - 400 Bad Request: Nếu người dùng không có quyền truy cập splat.

    **Giải thích:**
    - Endpoint này cho phép người dùng lấy thông tin chi tiết của một splat cụ thể.
    - Người dùng cần có quyền truy cập đối với splat này: nếu là superuser, họ có thể truy cập bất kỳ splat nào; nếu là người dùng bình thường, họ chỉ có thể truy cập splat của chính mình.
    - Nếu splat không tồn tại hoặc người dùng không có quyền truy cập, sẽ trả về lỗi tương ứng.

    **Chi tiết về các hành động:**
    - Kiểm tra xem splat có tồn tại hay không.
    - Kiểm tra quyền của người dùng (superuser hoặc sở hữu splat).
    - Trả về thông tin chi tiết của splat nếu người dùng có quyền truy cập.
    """
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")
    if not current_user:
        if not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")
    else:
        if not current_user.is_superuser and current_user.id != splat.owner_id and not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")

    return splat

@router.get("/{id}/download-splat", responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"}
})
def download_splat(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_guess_user),
    id: str,
) -> Any:
    """
    Tải xuống splat đã hoàn thành.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **id**: ID của splat cần tải xuống (dưới dạng URL parameter).

    **Đầu ra (Response):**
    - 200 OK: Trả về file splat dưới dạng tải xuống.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 400 Bad Request: Nếu splat không tồn tại, trạng thái không thành công, hoặc không có quyền truy cập.
    - 404 Not Found: Nếu file không tìm thấy tại đường dẫn đầu ra.

    **Giải thích:**
    - Endpoint này cho phép người dùng tải xuống một splat nếu có quyền truy cập.
    - Nếu người dùng không xác thực và splat không công khai, truy cập sẽ bị từ chối.
    - Nếu splat chưa hoàn tất hoặc thất bại, yêu cầu tải xuống sẽ không được xử lý.
    - Trạng thái của splat cần là `SUCCESS` và file phải có sẵn tại đường dẫn output.
    """
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


@router.get("/{id}/download-ply", responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"}
})
async def download_ply(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_guess_user),
    id: str,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Tải xuống file PLY chuyển đổi từ file .splat.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **id**: ID của splat cần tải xuống (dưới dạng URL parameter).
    - **background_tasks**: Được sử dụng để lên lịch dọn dẹp file sau khi tải xuống.

    **Đầu ra (Response):**
    - 200 OK: Trả về file PLY dưới dạng tải xuống.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 400 Bad Request: Nếu không có quyền truy cập, file không tồn tại, hoặc trạng thái splat không thành công.
    - 404 Not Found: Nếu splat không tồn tại.
    - 500 Internal Server Error: Nếu có lỗi trong quá trình chuyển đổi file hoặc trong việc kiểm tra file.

    **Giải thích:**
    - Endpoint này cho phép người dùng tải xuống một file PLY chuyển đổi từ file `.splat`.
    - Chỉ người dùng có quyền truy cập (superuser hoặc chủ sở hữu) mới có thể tải xuống file.
    - File `.splat` cần có trạng thái `SUCCESS` và tồn tại trên hệ thống.
    - Sử dụng lệnh `gsbox` để chuyển đổi từ `.splat` sang `.ply`. Quá trình này diễn ra bất đồng bộ.
    - Sau khi tải xuống, file sẽ được lên lịch dọn dẹp trong nền.
    """
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

    input_path = splat.model_url
    if not input_path or not os.path.exists(input_path):
        raise HTTPException(status_code=400, detail="Input .splat file not found")

    output_path = input_path.replace('.splat', '.ply')

    # Run the Go command asynchronously
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(
            None,
            lambda: subprocess.run(
                ['gsbox', 's2p', '-i', input_path, '-o', output_path],
                check=True
            )
        )
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="Failed to convert .splat to .ply")

    # Check again just in case
    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Converted .ply file not found")

    # Schedule cleanup
    background_tasks.add_task(delete_file, output_path)

    # Stream the file back
    return StreamingResponse(
        open(output_path, 'rb'),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={os.path.basename(output_path)}"}
    )

import json
@router.get("/{id}/metadata", responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"}
})
async def get_splat_metadata(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_guess_user),
    id: str,
) -> Any:
    """
    Lấy metadata bao gồm cameras.json, points.json và images_url từ thư mục của file .splat.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **id**: ID của splat cần lấy metadata (dưới dạng URL parameter).

    **Đầu ra (Response):**
    - 200 OK: Trả về JSON chứa dữ liệu từ cameras.json, points.json và danh sách images_url.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 400 Bad Request: Nếu không có quyền truy cập, file không tồn tại, hoặc trạng thái splat không thành công.
    - 404 Not Found: Nếu splat không tồn tại.
    - 500 Internal Server Error: Nếu có lỗi trong quá trình đọc hoặc xử lý file.

    **Giải thích:**
    - Endpoint này cho phép người dùng lấy metadata liên quan đến file `.splat`.
    - Chỉ người dùng có quyền truy cập (superuser hoặc chủ sở hữu) mới có thể truy cập metadata.
    - File `.splat` cần có trạng thái `SUCCESS` và tồn tại trên hệ thống.
    - Endpoint sẽ tìm và đọc file cameras.json, points.json, và liệt kê đường dẫn images trong cùng thư mục với file splat.
    """
    # Kiểm tra splat có tồn tại
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")

    # Kiểm tra quyền truy cập
    if not current_user:
        if not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")
    else:
        if not current_user.is_superuser and current_user.id != splat.owner_id and not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")

    # Kiểm tra trạng thái
    if splat.status != 'SUCCESS':
        raise HTTPException(
            status_code=404,
            detail=f"Result not ready or task failed. Current state: {splat.status}"
        )

    # Lấy đường dẫn thư mục từ model_url
    user_id = splat.owner_id
    dir_path = os.path.join(settings.MODEL_WORKSPACES_DIR, str(user_id), splat.id)
    
    if not os.path.exists(dir_path):
        raise HTTPException(status_code=404, detail="COLMAP directory not found")
    
    # Đường dẫn đến các file metadata
    cameras_json_path = os.path.join(dir_path, 'cameras.json')
    points_json_path = os.path.join(dir_path, 'points.json')
    
    # Đọc dữ liệu từ các file JSON
    try:
        cameras_data = {}
        if os.path.exists(cameras_json_path):
            with open(cameras_json_path, 'r') as f:
                cameras_data = json.load(f)
        else:
            cameras_data = {"error": "cameras.json not found"}
            
        points_data = {}
        if os.path.exists(points_json_path):
            with open(points_json_path, 'r') as f:
                points_data = json.load(f)
        else:
            points_data = {"error": "points.json not found"}
            
        # Tìm tất cả các file hình ảnh trong thư mục
        images_url =  "/images/" + id
                
        # Tạo response JSON kết hợp
        combined_response = {
            "cameras": cameras_data,
            "points": points_data,
            "images": images_url,
        }
        
        return JSONResponse(content=combined_response)
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error parsing JSON metadata files")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving metadata: {str(e)}")
    

@router.get("/{id}/download-colmap", responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"}
})
async def download_colmap_files(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_guess_user),
    id: str,
) -> Any:
    """
    Tải xuống các file COLMAP (cameras.bin, images.bin, points3D.bin) và thư mục images dưới dạng file zip.

    **Yêu cầu Header:**
    - Cần xác thực người dùng qua token JWT trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - **id**: ID của splat cần tải xuống các file COLMAP (dưới dạng URL parameter).
    - **background_tasks**: Được sử dụng để lên lịch dọn dẹp file sau khi tải xuống.

    **Đầu ra (Response):**
    - 200 OK: Trả về file ZIP chứa các file COLMAP và thư mục images.
    - 401 Unauthorized: Nếu người dùng chưa xác thực hoặc token không hợp lệ.
    - 400 Bad Request: Nếu không có quyền truy cập, file không tồn tại, hoặc trạng thái splat không thành công.
    - 404 Not Found: Nếu splat không tồn tại hoặc thư mục COLMAP không tồn tại.

    **Giải thích:**
    - Endpoint này cho phép người dùng tải xuống các file COLMAP liên quan đến splat dưới dạng file ZIP.
    - Chỉ người dùng có quyền truy cập (superuser hoặc chủ sở hữu) mới có thể tải xuống.
    - File ZIP sẽ chứa: cameras.bin, images.bin, points3D.bin và thư mục images.
    - File ZIP được tạo trong bộ nhớ và gửi đi mà không lưu trữ tạm thời trên ổ đĩa.
    """
    # Kiểm tra splat có tồn tại
    splat = crud.splat.get(db=db, id=id)
    if not splat:
        raise HTTPException(status_code=404, detail="Splat not found")

    # Kiểm tra quyền truy cập
    if not current_user:
        if not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")
    else:
        if not current_user.is_superuser and current_user.id != splat.owner_id and not splat.is_public:
            raise HTTPException(status_code=400, detail="Not enough permissions")

    # Kiểm tra trạng thái
    if splat.status != 'SUCCESS':
        raise HTTPException(
            status_code=404,
            detail=f"Result not ready or task failed. Current state: {splat.status}"
        )

    # Tìm thư mục colmap
    user_id = splat.owner_id
    colmap_dir = os.path.join(settings.MODEL_WORKSPACES_DIR, str(user_id), splat.id, "colmap")
    
    if not os.path.exists(colmap_dir):
        raise HTTPException(status_code=404, detail="COLMAP directory not found")

    # Tạo file ZIP trong bộ nhớ
    zip_buffer = BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Thêm các file .bin
        bin_files = ['cameras.bin', 'images.bin', 'points3D.bin']
        for bin_file in bin_files:
            bin_path = os.path.join(colmap_dir, bin_file)
            if os.path.exists(bin_path):
                zip_file.write(bin_path, arcname=bin_file)
            else:
                raise HTTPException(status_code=404, detail=f"{bin_file} not found")
        
        # Thêm thư mục images và các file bên trong
        images_dir = os.path.join(colmap_dir, "images")
        if os.path.exists(images_dir):
            for root, dirs, files in os.walk(images_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Tạo đường dẫn tương đối cho file trong zip
                    arcname = os.path.relpath(file_path, colmap_dir)
                    zip_file.write(file_path, arcname=arcname)
        else:
            raise HTTPException(status_code=404, detail="Images directory not found")
    
    # Di chuyển con trỏ về đầu buffer
    zip_buffer.seek(0)
    
    # Trả về file ZIP dưới dạng streaming response
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=colmap_files_{id}.zip"
        }
    )