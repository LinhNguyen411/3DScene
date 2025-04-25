from google.auth.transport import requests
from google.oauth2 import id_token
from fastapi import Request
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session  # type: ignore
import secrets
import string

from app import crud
from app import models
from app import schemas
from app.api import deps
from app.core import security
from app.core.config import settings, Config
from app.core.security import get_password_hash
from app.app_utils import (
    generate_password_reset_token,
    send_reset_password_email,
    verify_password_reset_token,
    send_new_google_account_email,
)

router = APIRouter()

@router.post("/login/get-my-info", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Lấy thông tin của người dùng hiện tại.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Parameters):**
    - Không yêu cầu tham số đầu vào ngoài header `Authorization` chứa token hợp lệ.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng hiện tại.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập hoặc token không hợp lệ.

    **Giải thích:**
    - Endpoint này được sử dụng để lấy thông tin chi tiết của người dùng hiện tại.
    - Thông tin trả về bao gồm các thuộc tính của người dùng từ cơ sở dữ liệu.
    - Trường `"is_pro"` sẽ được bổ sung vào kết quả, cho biết người dùng có phải là người dùng trả phí (pro) hay không. Nếu người dùng là superuser, trường này luôn là `True`.
    - Nếu người dùng có gói đăng ký trả phí còn hiệu lực, trường `"is_pro"` sẽ được đặt thành `True`, ngược lại là `False`.

    **Chi tiết về các hành động:**
    - Lấy thông tin người dùng từ `current_user` và kiểm tra xem người dùng có đăng ký trả phí hay không.
    - Nếu người dùng là superuser, trường `"is_pro"` luôn được đánh dấu là `True`.
    - Trả về thông tin người dùng kèm theo thông tin `"is_pro"`.
    """
    user_response = current_user.__dict__
    is_pro = crud.payment.check_is_last_payment_not_expired(db = db, payer_id=current_user.id)
    if current_user.is_superuser:
        is_pro = True
    user_response["is_pro"] = is_pro
    return user_response


@router.post("/login/get-access-token", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Đăng nhập và nhận mã truy cập OAuth2 tương thích, sử dụng để gửi các yêu cầu trong tương lai.

    **Yêu cầu Header:**
    - Không yêu cầu header đặc biệt ngoài `Authorization` nếu có trong các yêu cầu tiếp theo.

    **Đầu vào (Request Parameters):**
    - **username**: Địa chỉ email của người dùng (dưới dạng form data).
    - **password**: Mật khẩu của người dùng (dưới dạng form data).

    **Đầu ra (Response):**
    - 200 OK: Trả về mã truy cập (`access_token`) và kiểu token (`token_type`).
    - 400 Bad Request: Nếu địa chỉ email hoặc mật khẩu không chính xác.
    - 400 Bad Request: Nếu người dùng không hoạt động (inactive).

    **Giải thích:**
    - Endpoint này cho phép người dùng đăng nhập và nhận mã truy cập OAuth2 để sử dụng cho các yêu cầu API sau này.
    - Nếu thông tin đăng nhập không đúng, hoặc người dùng bị khóa (inactive), hệ thống sẽ trả về lỗi 400.
    - Nếu đăng nhập thành công, mã truy cập (access token) sẽ được tạo ra và trả về cùng với kiểu token (`bearer`).
    - Mã truy cập sẽ hết hạn sau khoảng thời gian xác định (`ACCESS_TOKEN_EXPIRE_MINUTES`).

    **Chi tiết về các hành động:**
    - Xác thực thông tin đăng nhập của người dùng (email và mật khẩu).
    - Nếu thông tin hợp lệ và người dùng hoạt động, tạo mã truy cập mới.
    - Trả về token dưới dạng `"bearer"` kèm theo mã truy cập (`access_token`).
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=400, detail="Incorrect email or password")
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/login/get-access-supertoken", response_model=schemas.Token)
def login_access_supertoken(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Đăng nhập và nhận mã truy cập OAuth2 tương thích, sử dụng để gửi các yêu cầu trong tương lai.
    Endpoint này chỉ cho phép người dùng có quyền superuser đăng nhập và nhận mã truy cập.

    **Yêu cầu Header:**
    - Không yêu cầu header đặc biệt ngoài `Authorization` nếu có trong các yêu cầu tiếp theo.

    **Đầu vào (Request Parameters):**
    - **username**: Địa chỉ email của người dùng (dưới dạng form data).
    - **password**: Mật khẩu của người dùng (dưới dạng form data).

    **Đầu ra (Response):**
    - 200 OK: Trả về mã truy cập (`access_token`) và kiểu token (`token_type`).
    - 400 Bad Request: Nếu địa chỉ email hoặc mật khẩu không chính xác.
    - 400 Bad Request: Nếu người dùng không hoạt động (inactive).
    - 400 Bad Request: Nếu người dùng không có quyền superuser.

    **Giải thích:**
    - Endpoint này cho phép người dùng có quyền superuser đăng nhập và nhận mã truy cập OAuth2 để sử dụng cho các yêu cầu API sau này.
    - Nếu thông tin đăng nhập không đúng, người dùng không hoạt động (inactive), hoặc người dùng không phải superuser, hệ thống sẽ trả về lỗi 400.
    - Nếu đăng nhập thành công và người dùng có quyền superuser, mã truy cập sẽ được tạo ra và trả về cùng với kiểu token (`bearer`).
    - Mã truy cập sẽ hết hạn sau khoảng thời gian xác định (`ACCESS_TOKEN_EXPIRE_MINUTES`).

    **Chi tiết về các hành động:**
    - Xác thực thông tin đăng nhập của người dùng (email và mật khẩu).
    - Nếu thông tin hợp lệ và người dùng là superuser, tạo mã truy cập mới.
    - Trả về token dưới dạng `"bearer"` kèm theo mã truy cập (`access_token`).
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=400, detail="Incorrect email or password")
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    elif not crud.user.is_superuser(user):
        raise HTTPException(status_code=400, detail="User is not superuser")
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
}


@router.post("/login/verify-token", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def test_token(current_user: models.User = Depends(deps.get_current_active_user)) -> Any:
    """
    Kiểm tra tính hợp lệ của mã truy cập (access token).

    **Yêu cầu Header:**
    - Authorization: Token truy cập (Bearer token) phải được gửi trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - Không có tham số yêu cầu trong body, chỉ cần cung cấp mã truy cập trong header.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng nếu mã truy cập hợp lệ.
    - 401 Unauthorized: Nếu mã truy cập không hợp lệ hoặc người dùng không được xác thực.

    **Giải thích:**
    - Endpoint này cho phép người dùng kiểm tra tính hợp lệ của mã truy cập mà họ đang sử dụng. Nếu mã truy cập hợp lệ và người dùng đã đăng nhập, thông tin người dùng sẽ được trả về.
    - Nếu mã truy cập không hợp lệ hoặc người dùng không được xác thực, hệ thống sẽ trả về lỗi 401.
    - Người dùng cần gửi mã truy cập trong header `Authorization` dưới dạng `Bearer token`.

    **Chi tiết về các hành động:**
    - Kiểm tra và xác thực mã truy cập gửi đến.
    - Trả về thông tin người dùng nếu mã truy cập hợp lệ.
    """
    return current_user

@router.post("/login/verify-supertoken", response_model=schemas.User, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def test_supertoken(current_user: models.User = Depends(deps.get_current_active_superuser)) -> Any:
    """
    Kiểm tra tính hợp lệ của mã truy cập (access token) dành cho superuser.

    **Yêu cầu Header:**
    - Authorization: Token truy cập (Bearer token) phải được gửi trong header `Authorization`.

    **Đầu vào (Request Parameters):**
    - Không có tham số yêu cầu trong body, chỉ cần cung cấp mã truy cập trong header.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin người dùng nếu mã truy cập hợp lệ và người dùng là superuser.
    - 401 Unauthorized: Nếu mã truy cập không hợp lệ, người dùng không phải là superuser hoặc không được xác thực.

    **Giải thích:**
    - Endpoint này cho phép người dùng **superuser** kiểm tra tính hợp lệ của mã truy cập mà họ đang sử dụng. Nếu mã truy cập hợp lệ và người dùng là superuser, thông tin người dùng sẽ được trả về.
    - Nếu mã truy cập không hợp lệ hoặc người dùng không phải là superuser, hệ thống sẽ trả về lỗi 401.
    - Người dùng cần gửi mã truy cập trong header `Authorization` dưới dạng `Bearer token`.

    **Chi tiết về các hành động:**
    - Kiểm tra và xác thực mã truy cập gửi đến.
    - Trả về thông tin người dùng nếu mã truy cập hợp lệ và người dùng là superuser.
    """
    return current_user


@router.post("/login/password-recovery/{email}", response_model=schemas.Msg, responses={
    201: {"model": schemas.Detail, "description": "The user with this username does not exist in the system"},
})
def recover_password(email: str, db: Session = Depends(deps.get_db)) -> Any:
    """
    Khôi phục mật khẩu cho người dùng.

    **Đầu vào (Request Parameters):**
    - email (path): Địa chỉ email của người dùng cần khôi phục mật khẩu.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông báo xác nhận email khôi phục mật khẩu đã được gửi đi thành công.
    - 201: Trả về lỗi nếu người dùng không tồn tại trong hệ thống (mã lỗi: `20001`).

    **Giải thích:**
    - Endpoint này kiểm tra xem người dùng có tồn tại trong hệ thống với email đã cho không. Nếu có, một mã thông báo khôi phục mật khẩu sẽ được tạo ra và gửi qua email cho người dùng. Nếu không tìm thấy người dùng, một lỗi sẽ được trả về.
    - Người dùng sẽ nhận được email khôi phục mật khẩu, từ đó có thể đặt lại mật khẩu của mình.

    **Chi tiết các bước:**
    - Kiểm tra xem người dùng có tồn tại trong cơ sở dữ liệu không.
    - Nếu có, tạo một mã thông báo khôi phục mật khẩu và gửi email chứa liên kết khôi phục mật khẩu.
    - Nếu không tìm thấy người dùng, trả về mã lỗi 201.
    """
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=201,
            detail="20001",
        )
    password_reset_token = generate_password_reset_token(email=email)
    send_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    return {"msg": "Password recovery email sent"}


@router.post("/login/reset-password/", response_model=schemas.Msg, responses={
    400: {"model": schemas.Detail, "description": "Invalid token"},
    404: {"model": schemas.Detail, "description": "The user with this username does not exist in the system."},
})
def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Cập nhật mật khẩu cho người dùng sau khi xác thực token đổi mật khẩu.

    **Yêu cầu Header:**
    - Không yêu cầu header đặc biệt ngoài `Authorization` nếu có trong các yêu cầu tiếp theo.

    **Đầu vào (Request Parameters):**
    - **token**: Token xác thực đổi mật khẩu được gửi trong body yêu cầu (dưới dạng chuỗi).
    - **new_password**: Mật khẩu mới của người dùng (dưới dạng chuỗi).

    **Đầu ra (Response):**
    - 200 OK: Trả về thông báo thành công với thông điệp `"Password updated successfully"`.
    - 400 Bad Request: Nếu token không hợp lệ hoặc người dùng không hoạt động (inactive).
    - 404 Not Found: Nếu người dùng không tồn tại trong hệ thống.

    **Giải thích:**
    - Endpoint này cho phép người dùng thay đổi mật khẩu của mình nếu họ cung cấp token hợp lệ.
    - Token sẽ được kiểm tra để xác thực người dùng, sau đó mật khẩu mới sẽ được lưu vào hệ thống.
    - Nếu người dùng không tồn tại, hoặc token không hợp lệ, hoặc người dùng không hoạt động, hệ thống sẽ trả về lỗi tương ứng.

    **Chi tiết về các hành động:**
    - Xác thực token đổi mật khẩu.
    - Tìm kiếm người dùng trong cơ sở dữ liệu bằng email.
    - Kiểm tra tình trạng hoạt động của người dùng.
    - Cập nhật mật khẩu mới nếu tất cả điều kiện đều hợp lệ.
    - Trả về thông báo thành công nếu mật khẩu được cập nhật thành công.
    """
    email = verify_password_reset_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(new_password)
    user.hashed_password = hashed_password
    db.add(user)
    db.commit()
    return {"msg": "Password updated successfully"}

# config: Config = Config()
# config_data = {'GOOGLE_CLIENT_ID': config.GOOGLE_AUTH_CLIENT_ID,
#                'GOOGLE_CLIENT_SECRET': config.GOOGLE_AUTH_CLIENT_SECRET}
# starlette_config = Config(environ=config_data)
# oauth = OAuth(starlette_config)
# oauth.register(
#     name='google',
#     server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
#     client_kwargs={'scope': 'openid email profile'},
# )


@router.post('/login/google-auth', response_model=schemas.Token)
async def auth_credentials(
        config: Config = Depends(deps.get_config),
        credentials: str = Body(..., embed=True),
        db: Session = Depends(deps.get_db)):
    """
    Đổi token Google thành token JWT của ứng dụng.

    **Yêu cầu Header:**
    - Không yêu cầu header đặc biệt ngoài `Authorization` nếu có trong các yêu cầu tiếp theo.

    **Đầu vào (Request Parameters):**
    - **credentials**: Token OAuth2 Google được gửi trong body yêu cầu (dưới dạng chuỗi).

    **Đầu ra (Response):**
    - 200 OK: Trả về token JWT truy cập (`access_token`), kiểu token (`token_type`), và đường dẫn chuyển hướng (`redirect_path`).
    - 400 Bad Request: Nếu thông tin đăng nhập Google không hợp lệ, hoặc người dùng không hoạt động, hoặc không thể tạo tài khoản.

    **Giải thích:**
    - Endpoint này cho phép người dùng đăng nhập bằng tài khoản Google. Nếu tài khoản chưa tồn tại trong hệ thống, một tài khoản mới sẽ được tạo và gửi email thông báo.
    - Token Google được xác thực và nếu hợp lệ, người dùng sẽ nhận được một token JWT mới để tiếp tục sử dụng các yêu cầu API trong tương lai.
    - Nếu người dùng là mới (sign-up), họ sẽ được chuyển hướng tới trang thiết lập mật khẩu, còn nếu là người dùng cũ, họ sẽ được chuyển hướng tới trang dashboard.

    **Chi tiết về các hành động:**
    - Xác thực token Google bằng `id_token.verify_oauth2_token`.
    - Kiểm tra nếu người dùng đã tồn tại trong hệ thống bằng email.
    - Nếu người dùng không tồn tại, tạo tài khoản mới và gửi email thông báo.
    - Nếu người dùng tồn tại nhưng không hoạt động, trả về lỗi.
    - Nếu tài khoản hợp lệ, tạo mã truy cập JWT và trả về cùng với đường dẫn chuyển hướng.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            credentials, requests.Request(), config.GOOGLE_AUTH_CLIENT_ID)
    except Exception:
        raise HTTPException(
            status_code=400, detail="Incorrect google credentials.")
    is_sign_up = False
    user_email = idinfo['email']
    user = crud.user.get_by_email(db, email=user_email)
    if not user:
        is_sign_up = True
        user_lastname = idinfo['family_name']
        user_firstname= idinfo['given_name']
        characters = string.ascii_letters + string.digits + string.punctuation
        user_temp_password = ''.join(secrets.choice(characters) for _ in range(128))
        user_in = schemas.UserCreate(
                email= user_email,
                first_name= user_firstname,
                last_name= user_lastname,
                is_active= True,
                is_superuser= False,
                password= user_temp_password,
        )
        user = crud.user.create(db=db, obj_in=user_in)
        send_new_google_account_email(email_to=user.email)
        if not user:
            raise HTTPException(
                status_code=400, detail="Failed to create user.")
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    redirect_path = '/sign-up/set-password' if is_sign_up else '/dashboard'
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "redirect_path": redirect_path,
    }
