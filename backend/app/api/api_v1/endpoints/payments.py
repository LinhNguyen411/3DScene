from typing import Any
from sqlalchemy.orm import Session  # type: ignore
from app.api import deps
from app import schemas
from app import models
from app import crud

from fastapi_pagination.ext.sqlalchemy import paginate
from fastapi_pagination import Params, Page
from fastapi import (APIRouter,  Depends, HTTPException)



router = APIRouter()


@router.get("/", response_model=Page[schemas.Payment], responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def read_payments(
    params: Params = Depends(),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Lấy danh sách các khoản thanh toán của người dùng.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Parameters):**
    - `params`: Các tham số phân trang, bao gồm `page`, `size`, dùng để phân trang kết quả.

    **Đầu ra (Response):**
    - 200 OK: Trả về danh sách các khoản thanh toán của người dùng với các thông tin phân trang.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập hoặc token không hợp lệ.
    - 400 Bad Request: Nếu người dùng không đủ quyền để truy cập dữ liệu (ví dụ: người dùng không phải là người dùng hoạt động).
    
    **Giải thích:**
    - Endpoint này trả về danh sách các khoản thanh toán của người dùng hiện tại.
    - Người dùng cần phải đăng nhập và có quyền truy cập.
    - Nếu người dùng là superuser, họ sẽ thấy tất cả các khoản thanh toán. Nếu không, chỉ có thể truy cập các khoản thanh toán liên quan đến chính họ.

    **Chi tiết về các hành động:**
    - Nếu người dùng không hoạt động, trả về lỗi "Not enough permissions".
    - Nếu người dùng là superuser, trả về tất cả các khoản thanh toán trong hệ thống.
    - Nếu người dùng không phải superuser, chỉ trả về các khoản thanh toán mà người dùng là người thanh toán (payer).
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    if current_user.is_superuser:
        payments = crud.payment.get_multi(db=db)
    else:
        payments = crud.payment.query_get_multi_by_payer(db=db, payer_id=current_user.id)

    return paginate(payments, params)

@router.get("/{id}", response_model=schemas.Payment, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def get_payment(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Lấy thông tin chi tiết một khoản thanh toán.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Parameters):**
    - `id`: ID của khoản thanh toán cần lấy thông tin chi tiết.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin chi tiết của khoản thanh toán với ID tương ứng.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập hoặc token không hợp lệ.
    - 400 Bad Request: Nếu người dùng không đủ quyền để xem thông tin khoản thanh toán (ví dụ: không phải superuser).
    - 404 Not Found: Nếu không tìm thấy khoản thanh toán với ID tương ứng.

    **Giải thích:**
    - Endpoint này dùng để lấy thông tin chi tiết của một khoản thanh toán dựa trên ID.
    - Người dùng cần phải đăng nhập và có quyền truy cập (chỉ superuser mới có thể xem thông tin khoản thanh toán của bất kỳ người dùng nào).
    - Nếu không tìm thấy khoản thanh toán với ID yêu cầu, hệ thống sẽ trả về lỗi 404.

    **Chi tiết về các hành động:**
    - Nếu không có quyền hoặc không phải là superuser, người dùng sẽ nhận lỗi "Not enough permissions".
    - Nếu khoản thanh toán không tồn tại, sẽ nhận lỗi "Payment not found".
    """
    payment = crud.payment.get(db=db, id=id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return payment

@router.post("/", response_model=schemas.Payment, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
async def create_payment(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    user_id : int,
    payment_in: schemas.PaymentCreate
) -> Any:
    """
    Tạo mới một khoản thanh toán.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Parameters):**
    - `user_id`: ID của người dùng mà bạn muốn tạo khoản thanh toán cho họ.
    - `payment_in`: Dữ liệu về khoản thanh toán cần tạo. (bao gồm số tiền và gói thanh toán).

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin chi tiết của khoản thanh toán vừa được tạo.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập hoặc token không hợp lệ.
    - 400 Bad Request: Nếu người dùng không phải là superuser hoặc không đủ quyền để tạo khoản thanh toán cho người khác.

    **Giải thích:**
    - Endpoint này dùng để tạo một khoản thanh toán mới cho người dùng được chỉ định.
    - Chỉ superuser mới có quyền tạo thanh toán cho người dùng khác, người dùng bình thường không có quyền này.
    - Nếu người dùng không có quyền truy cập hoặc không phải superuser, sẽ nhận lỗi 400.

    **Chi tiết về các hành động:**
    - Nếu người dùng không phải là superuser, hệ thống sẽ trả về lỗi "Not enough permissions".
    - Sau khi khoản thanh toán được tạo thành công, thông tin của khoản thanh toán sẽ được trả về.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    payment: models.Payment = crud.payment.create_with_payer(
        db, obj_in=payment_in, payer_id=user_id)
    return payment


@router.put("/{id}", response_model=schemas.Payment, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def update_payment(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
    payment_in: schemas.PaymentUpdate,
) -> Any:
    """
    Cập nhật thông tin một khoản thanh toán.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Parameters):**
    - `id`: ID của khoản thanh toán cần cập nhật.
    - `payment_in`: Dữ liệu cập nhật cho khoản thanh toán, bao gồm thông tin ngày hết hạn.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông tin chi tiết của khoản thanh toán sau khi cập nhật thành công.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập hoặc token không hợp lệ.
    - 400 Bad Request: Nếu người dùng không phải là superuser hoặc không đủ quyền để cập nhật khoản thanh toán.
    - 404 Not Found: Nếu khoản thanh toán với `id` không tồn tại.

    **Giải thích:**
    - Endpoint này dùng để cập nhật thông tin cho một khoản thanh toán đã tồn tại.
    - Chỉ superuser mới có quyền cập nhật các khoản thanh toán của người khác, người dùng bình thường không có quyền này.
    - Nếu người dùng không phải là superuser, hệ thống sẽ trả về lỗi "Not enough permissions".
    - Sau khi cập nhật thành công, thông tin của khoản thanh toán sẽ được trả về.

    **Chi tiết về các hành động:**
    - Nếu không tìm thấy khoản thanh toán với `id` được cung cấp, sẽ trả về lỗi 404.
    - Sau khi thông tin khoản thanh toán được cập nhật, thông tin chi tiết sẽ được trả về.
    """
    payment = crud.payment.get(db=db, id=id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    payment = crud.payment.update(db=db, db_obj=payment, obj_in=payment_in)
    return payment


@router.delete("/{id}", response_model=schemas.Detail, responses={
    401: {"model": schemas.Detail, "description": "User unathorized"}
})
def delete_payment(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    id: int,
) -> Any:
    """
    Xóa một khoản thanh toán.

    **Yêu cầu Header:**
    - `Authorization: Bearer <access_token>`

    **Đầu vào (Request Parameters):**
    - `id`: ID của khoản thanh toán cần xóa.

    **Đầu ra (Response):**
    - 200 OK: Trả về thông báo "Payment deleted successfully" khi xóa thành công.
    - 401 Unauthorized: Nếu người dùng không có quyền truy cập hoặc token không hợp lệ.
    - 400 Bad Request: Nếu người dùng không phải là superuser hoặc không đủ quyền để xóa khoản thanh toán.
    - 404 Not Found: Nếu khoản thanh toán với `id` không tồn tại.

    **Giải thích:**
    - Endpoint này dùng để xóa một khoản thanh toán theo `id` đã được cung cấp.
    - Chỉ superuser mới có quyền xóa khoản thanh toán của người khác, người dùng bình thường không có quyền này.
    - Sau khi xóa thành công, hệ thống trả về thông báo xác nhận việc xóa.
    - Nếu không tìm thấy khoản thanh toán với `id` được cung cấp, hệ thống sẽ trả về lỗi 404.

    **Chi tiết về các hành động:**
    - Nếu không tìm thấy khoản thanh toán với `id` được cung cấp, sẽ trả về lỗi 404.
    - Sau khi khoản thanh toán được xóa thành công, hệ thống sẽ trả về thông báo với chi tiết "Payment deleted successfully".
    """
    payment = crud.payment.get(db=db, id=id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    payment = crud.payment.remove(db=db, id=id)
    return {"detail": f'Payment deleted successfully {id}'}
