from typing import Any

from sqlalchemy.orm import Session  # type: ignore
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi_pagination import Params, Page
from fastapi_pagination.ext.sqlalchemy import paginate
from pydantic.networks import EmailStr
from app import crud, models, schemas
from app.api import deps
from app.core.config import settings, Config
from app.app_utils import send_new_account_email, generate_mail_confirmation_token, verify_mail_confirmation_token

router = APIRouter()

@router.post("/signup", response_model=schemas.User, responses={
    400: {"model": schemas.Detail, "description": "The user with this username already exists in the system"}})
def create_user_signup(
    *,
    config: Config = Depends(deps.get_config),
    db: Session = Depends(deps.get_db),
    password: str = Body(...),
    email: EmailStr = Body(...),
    first_name: str = Body(...),
    last_name: str = Body(...),
) -> Any:
    """
    Đăng ký tài khoản người dùng mới.

    **Yêu cầu Header:**
    - Không yêu cầu xác thực.

    **Đầu vào (Request Body):**
    - `email` (EmailStr): Email người dùng.
    - `password` (str): Mật khẩu.
    - `first_name` (str): Tên.
    - `last_name` (str): Họ.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng đã đăng ký.
    - 400 Bad Request: Nếu email đã tồn tại.
    - 403 Forbidden: Nếu không cho phép đăng ký.
    """
    if not settings.USERS_OPEN_REGISTRATION:
        raise HTTPException(
            status_code=403,
            detail="Open user registration is forbidden on this server",
        )
    user = crud.user.get_by_email(db, email=email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user_in = schemas.UserCreate(
        password=password, email=email, first_name=first_name, last_name=last_name)
    user = crud.user.create(db, obj_in=user_in)
    mail_confirmation_token = generate_mail_confirmation_token(email=email)
    if config.EMAILS_ENABLED and user_in.email:
        send_new_account_email(
            email_to=user_in.email, token=mail_confirmation_token
        )
    return user


@router.post("/confirm-email/{token}", response_model=schemas.Msg)
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    token: str,
) -> Any:
    """
    Xác nhận email người dùng qua token gửi trong email.
    
    **Yêu cầu Header:**
    - Không yêu cầu xác thực.

    **Đầu vào (Path Parameter):**
    - `token` (str): Mã xác nhận trong email.

    **Đầu ra (Response):**
    - 200 OK: Trả về `{ "msg": "Mail confirmed" }` nếu xác nhận thành công.
    - 400 Bad Request: Nếu token không hợp lệ hoặc email đã được xác nhận.
    - 404 Not Found: Nếu người dùng không tồn tại.
    """
    email = verify_mail_confirmation_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    elif crud.user.is_active(user):
        raise HTTPException(
            status_code=400, detail="User mail is already confirmed")
    user.is_active = True
    db.add(user)
    db.commit()
    return {"msg": "Mail confirmed"}

@router.put("/update-my-info", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    user_in: schemas.UserUpdate,
) -> Any:
    """
    Cập nhật thông tin cá nhân của người dùng hiện tại.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body - UserUpdate):**
    - `first_name` (str, optional): Tên người dùng.
    - `last_name` (str, optional): Họ người dùng.
    - `password` (str, optional): Mật khẩu mới.
    - `current_password` (str, optional): Mật khẩu hiện tại (bắt buộc nếu đổi mật khẩu).
    - `is_active` (bool, optional): Trạng thái hoạt động (chỉ superuser mới có thể thay đổi).
    - `is_superuser` (bool, optional): Quyền superuser (chỉ superuser mới có thể thay đổi).

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng đã cập nhật.
    - 400 Bad Request: Nếu người dùng không đủ quyền để cập nhật một số trường.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    if not current_user.is_superuser and (user_in.is_superuser == True or user_in.is_active == False):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    if user_in.current_password:
        user = crud.user.update_password(db=db, db_obj=current_user, obj_in=user_in)
    else:
        user = crud.user.update(db=db, db_obj=current_user, obj_in=user_in)
    return user
    


@router.get("", response_model=Page[schemas.User], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_users(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Lấy danh sách người dùng.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Parameters):**
    - `params` (Params): Các tham số phân trang (pagination) như `page`, `size` sẽ được tự động lấy từ query parameters.

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách người dùng dưới dạng phân trang (Page).
    - 400 Bad Request: Nếu người dùng không phải là superuser, không có quyền truy cập.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    users = crud.user.get_multi(db=db)

    return paginate(users, params)


@router.get("/{id}", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Lấy thông tin người dùng theo ID.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Path Parameter):**
    - `id` (int): ID của người dùng cần lấy thông tin.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng với ID tương ứng.
    - 400 Bad Request: Nếu người dùng không có quyền truy cập thông tin của người dùng khác.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    - 404 Not Found: Nếu không tìm thấy người dùng với ID đã cho.
    """
    user = crud.user.get(db=db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not current_user.is_superuser and (user.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return user


@router.post("", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    user_in: schemas.UserCreate
) -> Any:
    """
    Tạo người dùng mới.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Body - UserCreate):**
    - `email` (EmailStr, bắt buộc): Địa chỉ email của người dùng.
    - `first_name` (str, bắt buộc): Tên của người dùng.
    - `last_name` (str, bắt buộc): Họ của người dùng.
    - `is_active` (bool, tùy chọn): Trạng thái hoạt động của người dùng (mặc định là `False`).
    - `is_superuser` (bool, tùy chọn): Quyền superuser của người dùng (mặc định là `False`).
    - `password` (str, tùy chọn): Mật khẩu của người dùng (bắt buộc nếu tạo người dùng mới).

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng vừa tạo.
    - 400 Bad Request: Nếu người dùng không có quyền tạo người dùng mới.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    user = crud.user.create(db=db, obj_in=user_in)
    return user


@router.put("/{id}", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
    user_in: schemas.UserUpdate,
) -> Any:
    """
    Cập nhật thông tin người dùng theo ID.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Path Parameter):**
    - `id` (int, bắt buộc): ID của người dùng cần cập nhật.

    **Đầu vào (Request Body - UserUpdate):**
    - `password` (str, tùy chọn): Mật khẩu mới của người dùng.
    - `first_name` (str, tùy chọn): Tên mới của người dùng.
    - `last_name` (str, tùy chọn): Họ mới của người dùng.
    - `is_active` (bool, tùy chọn): Trạng thái hoạt động của người dùng (mặc định là `True`).
    - `is_superuser` (bool, tùy chọn): Quyền superuser của người dùng (mặc định là `False`).
    - `current_password` (str, tùy chọn): Mật khẩu hiện tại của người dùng, yêu cầu khi thay đổi mật khẩu.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng sau khi cập nhật.
    - 400 Bad Request: Nếu người dùng không đủ quyền hoặc không thể cập nhật thông tin.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    - 404 Not Found: Nếu không tìm thấy người dùng với ID đã cho.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    user = crud.user.get(db=db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.id == id and (user_in.is_active == False or user_in.is_superuser == False):
        raise HTTPException(status_code=400, detail="Super users are not allowed to deactivate themselves")
    user = crud.user.update(db=db, db_obj=user, obj_in=user_in)
    return user


@router.delete("/{id}", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Xóa người dùng theo ID.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Path Parameter):**
    - `id` (int, bắt buộc): ID của người dùng cần xóa.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng đã bị xóa.
    - 400 Bad Request: Nếu người dùng không có quyền xóa người dùng khác.
    - 401 Unauthorized: Nếu người dùng chưa đăng nhập hoặc token không hợp lệ.
    - 403 Forbidden: Nếu người dùng cố gắng xóa chính mình (Super users không thể xóa tài khoản của chính mình).
    - 404 Not Found: Nếu không tìm thấy người dùng với ID đã cho.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    user = crud.user.get(db=db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    user = crud.user.remove(db=db, id=id)
    return user
