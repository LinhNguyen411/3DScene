from typing import Any,List
from app.api import deps
from app import schemas
from app.core.config import Config

from fastapi import (APIRouter,  Depends)

router = APIRouter()

@router.get("/env", response_model=List[schemas.EnvVariableResponse])
async def get_public_environment_variables(
    *,
    config: Config = Depends(deps.get_config),
) -> Any:
    """
    Lấy các biến môi trường công khai từ cấu hình.

    **Yêu cầu Header:**
    - Không

    **Đầu vào (Request Body):**
    - Không có dữ liệu đầu vào yêu cầu từ người dùng.

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách các biến môi trường công khai với tên và giá trị.
    - 403 Forbidden: Nếu người dùng không có quyền truy cập.

    **Giải thích:**
    - Hàm này trả về các biến môi trường có thể công khai từ cấu hình hệ thống (ví dụ: `GOOGLE_AUTH_CLIENT_ID`, `STRIPE_PUBLIC_KEY`, `PROJECT_NAME`,...).
    - Chỉ các biến có tên trùng với danh sách định nghĩa sẵn và có kiểu dữ liệu đơn giản (str, int, float, bool hoặc None) mới được trả về.
    - Giá trị của các biến này không được xem là nhạy cảm, do đó trường `sensitive` luôn được đặt là `False`.
    """
    public_keys = [
        "GOOGLE_AUTH_CLIENT_ID", 
        "STRIPE_PUBLIC_KEY", 
        "STRIPE_MONTHLY_ID",
        "STRIPE_YEARLY_ID",
        "PROJECT_NAME",
    ]
    
    env_vars = []
    
    # Add environment vars from config
    for key in dir(config):
        if not key.startswith("_") and key.isupper() and key in public_keys:
            value = getattr(config, key)
            if isinstance(value, (str, int, bool, float)) or value is None:
                env_vars.append({
                    "key": key,
                    "value": str(value),
                    "sensitive": False
                })
    
    return env_vars