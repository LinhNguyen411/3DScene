from typing import Any, List,Dict
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud

from fastapi import (APIRouter,  Depends, HTTPException, File, UploadFile)
import os
from app.core.config import Config
from dotenv import load_dotenv
import time
import shutil

statistic_router = APIRouter()

@statistic_router.get("/total-pro-users", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_total_pro_users(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lấy tổng số người dùng đã đăng ký gói Pro.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - Không có dữ liệu đầu vào yêu cầu từ người dùng.

    **Đầu ra (Response):**
    - 200 OK: Trả về tổng số người dùng đã đăng ký gói Pro.
    - 400 Bad Request: Nếu người dùng không có quyền truy cập (không phải là superuser).

    **Giải thích:**
    - Hàm này sẽ trả về tổng số người dùng đã đăng ký gói Pro, chỉ khi người yêu cầu là superuser.
    - Nếu người dùng không phải là superuser, sẽ ném ra lỗi 400 với thông báo "Not enough permissions".
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    total = crud.payment.count_pro_users(db=db)
    return total

@statistic_router.get("/total-users", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_total_users(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lấy tổng số người dùng trong hệ thống.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - Không có dữ liệu đầu vào yêu cầu từ người dùng.

    **Đầu ra (Response):**
    - 200 OK: Trả về tổng số người dùng trong hệ thống.
    - 400 Bad Request: Nếu người dùng không có quyền truy cập (không phải là superuser).

    **Giải thích:**
    - Hàm này sẽ trả về tổng số người dùng trong hệ thống, chỉ khi người yêu cầu là superuser.
    - Nếu người dùng không phải là superuser, sẽ ném ra lỗi 400 với thông báo "Not enough permissions".
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    total = crud.user.get_total_users(db=db)
    return total

@statistic_router.get("/get-splats-last-24hours", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_splats_last_24hours(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lấy dữ liệu splats trong 24 giờ qua.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - Không có dữ liệu đầu vào yêu cầu từ người dùng.

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách splats trong 24 giờ qua.
    - 400 Bad Request: Nếu người dùng không có quyền truy cập (không phải là superuser).

    **Giải thích:**
    - Hàm này sẽ trả về danh sách splats đã được ghi nhận trong vòng 24 giờ qua, chỉ khi người yêu cầu là superuser.
    - Nếu người dùng không phải là superuser, sẽ ném ra lỗi 400 với thông báo "Not enough permissions".
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    splats = crud.splat.get_splats_last_24_hours(db=db)
    return splats

@statistic_router.get("/total-amount", responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_total_amount(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lấy tổng số tiền thanh toán trong hệ thống.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - Không có dữ liệu đầu vào yêu cầu từ người dùng.

    **Đầu ra (Response):**
    - 200 OK: Trả về tổng số tiền thanh toán trong hệ thống.
    - 400 Bad Request: Nếu người dùng không có quyền truy cập (không phải là superuser).

    **Giải thích:**
    - Hàm này sẽ trả về tổng số tiền thanh toán đã được ghi nhận trong hệ thống, chỉ khi người yêu cầu là superuser.
    - Nếu người dùng không phải là superuser, sẽ ném ra lỗi 400 với thông báo "Not enough permissions".
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    total_amount = crud.payment.get_total_amount(db)
    return total_amount

config_router = APIRouter()


@config_router.get("/env", response_model=List[schemas.EnvVariableResponse], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"}
})
async def get_environment_variables(
    *,
    config: Config = Depends(deps.get_config),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Lấy tất cả các biến môi trường từ cấu hình.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - Không có dữ liệu đầu vào yêu cầu từ người dùng.

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách các biến môi trường với tên và giá trị.
    - 403 Forbidden: Nếu người dùng không có quyền truy cập (không phải là superuser).
    
    **Giải thích:**
    - Hàm này trả về tất cả các biến môi trường từ cấu hình hệ thống. Những biến nhạy cảm như `SMTP_PASSWORD`, `GOOGLE_AUTH_CLIENT_SECRET`, và `STRIPE_API_KEY` sẽ được ẩn giá trị (hiển thị dưới dạng `****`).
    - Chỉ người dùng có quyền superuser mới có thể truy cập danh sách các biến môi trường này. Nếu người dùng không phải là superuser, sẽ trả về lỗi 403 với thông báo "Not enough permissions".
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    # Define sensitive keys that should be masked
    not_configable_keys = [
        "SMTP_PORT",
        "SMTP_HOST",
        "SMTP_TLS",
        "EMAILS_ENABLED"
    ]
    sensitive_keys = [
        "SMTP_PASSWORD", 
        "GOOGLE_AUTH_CLIENT_SECRET", 
        "PAYOS_CLIENT_ID",
        "PAYOS_API_KEY",
        "PAYOS_CHECKSUM_KEY",
        # "STRIPE_API_KEY"
    ]
    order_keys = [
        "PROJECT_NAME",
        "PROJECT_DESCRIPTION",
        "PROJECT_KEYWORDS",
        "PROJECT_ICON",

        "GOOGLE_AUTH_CLIENT_ID",
        "GOOGLE_AUTH_CLIENT_SECRET",

        # "STRIPE_PUBLIC_KEY",
        # "STRIPE_API_KEY",
        # "STRIPE_MONTHLY_ID",
        # "STRIPE_YEARLY_ID",

        "PAYOS_CLIENT_ID",
        "PAYOS_API_KEY",
        "PAYOS_CHECKSUM_KEY",
        "PAYOS_MONTHLY_PRICE",
        "PAYOS_YEARLY_PRICE",

        "SMTP_USER",
        "SMTP_PASSWORD",
        "EMAILS_FROM_EMAIL",
        "EMAILS_FROM_NAME",
        "SUPPORT_EMAIL",
        "SERVER_HOST_FRONT",

    ]
    env_vars = []
    
    # Add environment vars from config
    for key in order_keys:
        if not key.startswith("_") and key.isupper() and key not in not_configable_keys:
            value = getattr(config, key)
            if isinstance(value, (str, int, bool, float)) or value is None:
                is_sensitive = key in sensitive_keys
                display_value = "****" if is_sensitive else str(value)
                env_vars.append({
                    "key": key,
                    "value": display_value,
                    "sensitive": is_sensitive
                })
    
    return env_vars

@config_router.put("/env", response_model=Dict[str, str], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"},
    400: {"model": schemas.Detail, "description": "Invalid environment variable"}
})
async def update_environment_variable(
    *,
    config: Config = Depends(deps.get_config),
    current_user: models.User = Depends(deps.get_current_active_user),
    env_update: schemas.EnvVariableUpdate,
) -> Any:
    """
    Cập nhật một biến môi trường trong tệp .backend.env.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - `key` (str): Tên biến môi trường cần cập nhật.
    - `value` (str): Giá trị mới của biến môi trường.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông báo xác nhận rằng biến môi trường đã được cập nhật thành công.
    - 403 Forbidden: Nếu người dùng không có quyền truy cập (không phải là superuser).
    - 400 Bad Request: Nếu tên biến môi trường không hợp lệ hoặc không tồn tại trong cấu hình.
    - 500 Internal Server Error: Nếu có lỗi khi cập nhật biến môi trường trong tệp .backend.env.

    **Giải thích:**
    - Hàm này sẽ cập nhật một biến môi trường trong tệp `.backend.env` và nạp lại các giá trị môi trường từ tệp này.
    - Chỉ những người dùng có quyền superuser mới có thể thực hiện việc cập nhật này. Nếu người dùng không có quyền, sẽ trả về lỗi 403.
    - Nếu tên biến môi trường không tồn tại trong cấu hình, hàm sẽ trả về lỗi 400.
    - Khi cập nhật thành công, biến môi trường sẽ được cập nhật trong hệ thống và trong tệp `.backend.env`.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    # Validate that the variable exists in the config
    valid_config_keys = [key for key in dir(config) if not key.startswith("_") and key.isupper()]
    if env_update.key not in valid_config_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid environment variable: {env_update.key}"
        )
    
    # Update the .backend.env file - using direct file manipulation
    env_file = "/code/app/core/.backend.env"
    
    try:
        # Read all lines from the .env file
        with open(env_file, 'r') as file:
            lines = file.readlines()
        
        # Check if the key already exists in the file
        key_exists = False
        for i, line in enumerate(lines):
            if line.strip() and not line.strip().startswith('#'):
                key_value = line.strip().split('=', 1)
                if len(key_value) == 2 and key_value[0].strip() == env_update.key:
                    # Update the existing key
                    lines[i] = f'{env_update.key}="{env_update.value}"\n'
                    key_exists = True
                    break
        
        # If key doesn't exist, add it to the end of the file
        if not key_exists:
            lines.append(f"{env_update.key}={env_update.value}\n")
        
        # Write the updated content back to the file
        with open(env_file, 'w') as file:
            file.writelines(lines)
        
        # Update the current environment
        os.environ[env_update.key] = env_update.value
        
        # Reload dotenv file
        load_dotenv(dotenv_path=env_file, override=True)
        
        return {"message": f"Environment variable {env_update.key} updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update environment variable: {str(e)}"
        )

@config_router.get("/env/reload", response_model=Dict[str, str], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"}
})
async def reload_environment_variables(
    *,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Tải lại tất cả các biến môi trường từ tệp .backend.env.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - Không có dữ liệu đầu vào yêu cầu từ người dùng.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông báo xác nhận rằng các biến môi trường đã được tải lại thành công.
    - 403 Forbidden: Nếu người dùng không có quyền truy cập (không phải là superuser).
    - 500 Internal Server Error: Nếu có lỗi khi tải lại các biến môi trường từ tệp `.backend.env`.

    **Giải thích:**
    - Hàm này sẽ tải lại tất cả các biến môi trường từ tệp `.backend.env` và nạp lại vào hệ thống. Chỉ những người dùng có quyền superuser mới có thể thực hiện việc này.
    - Nếu có lỗi khi tải lại các biến môi trường, sẽ trả về lỗi 500 với thông báo chi tiết.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    try:
        load_dotenv(dotenv_path="/code/app/core/.backend.env", override=True)
        return {"message": "Environment variables reloaded successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reload environment variables: {str(e)}"
        )


@config_router.post("/create-env-backup", response_model=Dict[str, str], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"}
})
async def create_env_backup(
    *,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Tạo một bản sao lưu của tệp .backend.env hiện tại.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body):**
    - Không có dữ liệu đầu vào yêu cầu từ người dùng.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông báo xác nhận rằng bản sao lưu tệp .backend.env đã được tạo thành công.
    - 403 Forbidden: Nếu người dùng không có quyền truy cập (không phải là superuser).
    - 500 Internal Server Error: Nếu có lỗi khi tạo bản sao lưu.

    **Giải thích:**
    - Hàm này sẽ tạo một bản sao lưu của tệp `.backend.env` hiện tại, lưu trữ bản sao lưu với tên có chứa dấu thời gian.
    - Chỉ những người dùng có quyền superuser mới có thể thực hiện việc này.
    - Nếu có lỗi khi sao chép tệp, sẽ trả về lỗi 500 với thông báo chi tiết.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    from datetime import datetime
    import shutil
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        source = "/code/app/core/.backend.env"
        destination = f"/code/app/core/.backend.env.backup_{timestamp}"
        
        shutil.copy2(source, destination)
        
        return {"message": f"Environment file backed up to {destination}"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create backup: {str(e)}"
        )
    
@config_router.post("/upload-icon", response_model=Dict[str, str], responses={
    401: {"model": schemas.Detail, "description": "User unauthorized"},
    403: {"model": schemas.Detail, "description": "Not enough permissions"}
})
async def upload_project_icon(
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_active_user),
    config: Config = Depends(deps.get_config),  # Added to access current PROJECT_ICON
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Retrieve the current (old) PROJECT_ICON URL
    old_icon_url = config.PROJECT_ICON
    
    upload_dir = "/code/app/public/icons"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = file.filename.split(".")[-1]
    filename = f"project_icon_{int(time.time())}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    icon_url = f"/public/icons/{filename}"
    
    env_file = "/code/app/core/.backend.env"
    with open(env_file, 'r') as file:
        lines = file.readlines()
    
    with open(env_file, 'w') as file:
        key_found = False
        for line in lines:
            if line.startswith("PROJECT_ICON="):
                file.write(f'PROJECT_ICON="{icon_url}"\n')
                key_found = True
            else:
                file.write(line)
        if not key_found:
            file.write(f'PROJECT_ICON="{icon_url}"\n')
    
    load_dotenv(dotenv_path=env_file, override=True)
    
    # Delete the old icon file if it exists and is different from the new one
    if old_icon_url and old_icon_url.startswith('/public/icons/') and old_icon_url != icon_url:
        old_filename = os.path.basename(old_icon_url)
        old_file_path = os.path.join(upload_dir, old_filename)
        if os.path.exists(old_file_path):
            try:
                os.remove(old_file_path)
            except Exception as e:
                print(f"Failed to delete old icon file: {e}")
    
    return {"message": "Project icon updated successfully", "url": icon_url}

router = APIRouter()
router.include_router(statistic_router, prefix="/statistic", tags=["statistic"])
router.include_router(config_router, prefix="/config", tags=["config"])
